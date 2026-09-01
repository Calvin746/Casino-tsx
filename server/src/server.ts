import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mysql, { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

const app = express();
app.use(cors({
    origin: 'http://localhost:5173', // Frontend URL
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// JWT Secret (in production from .env)
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-casino-key';

// Rate Limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10, // Limit each IP to 10 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Zu viele Anfragen, bitte versuchen Sie es später erneut.' }
});

const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    limit: 60, // Limit each IP to 60 requests per minute.
    message: { error: 'Zu viele Anfragen, bitte versuchen Sie es später erneut.' }
});

app.use('/api/', apiLimiter);

// MySQL Verbindungs-Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'casino_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const SYMBOLS = ['CHERRY', 'LEMON', 'BELL', 'DIAMOND', 'SEVEN'];
const PAYOUT_MULTIPLIERS: Record<string, number> = {
    'CHERRY': 2,
    'LEMON': 5,
    'BELL': 10,
    'DIAMOND': 25,
    'SEVEN': 50
};

interface UserRow extends RowDataPacket {
    id: string;
    email: string;
    password_hash: string;
    balance_cents: number;
    is_suspended: boolean;
}

// --- AUTHENTICATION ROUTES ---

app.post('/api/auth/register', authLimiter, async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password || password.length < 8) {
        return res.status(400).json({ error: 'Ungültige Email oder Passwort zu kurz (min. 8 Zeichen).' });
    }

    try {
        const [existingUsers] = await pool.query<UserRow[]>('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Email bereits registriert.' });
        }

        const userId = crypto.randomUUID();
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        await pool.query(
            'INSERT INTO users (id, email, password_hash, balance_cents, is_suspended) VALUES (?, ?, ?, ?, ?)',
            [userId, email, passwordHash, 10000, false] // 100 Euro Startguthaben for demo
        );

        res.status(201).json({ message: 'Registrierung erfolgreich.', userId });
    } catch (err) {
        console.error('Registration Error:', err);
        res.status(500).json({ error: 'Serverfehler bei der Registrierung.' });
    }
});

app.post('/api/auth/login', authLimiter, async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email und Passwort erforderlich.' });
    }

    try {
        const [users] = await pool.query<UserRow[]>('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Ungültige Anmeldedaten.' });
        }

        const user = users[0];
        
        if (user.is_suspended) {
            return res.status(403).json({ error: 'Konto ist gesperrt.' });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Ungültige Anmeldedaten.' });
        }

        // Create JWT token
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '2h' });

        // Set JWT as HttpOnly Cookie
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 2 * 60 * 60 * 1000 // 2 hours
        });

        res.json({ message: 'Login erfolgreich.', balanceCents: user.balance_cents });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ error: 'Serverfehler beim Login.' });
    }
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
    res.clearCookie('auth_token');
    res.json({ message: 'Logout erfolgreich.' });
});

// Middleware to verify JWT
const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.auth_token;

    if (!token) {
        return res.status(401).json({ error: 'Zugriff verweigert. Kein Token gefunden.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        (req as any).user = decoded; // attach user info
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Ungültiger oder abgelaufener Token.' });
    }
};


// --- GAME ROUTES ---

app.post('/api/games/slot/spin', authenticateJWT, async (req: Request, res: Response) => {
    const { betCents } = req.body;
    const userId = (req as any).user.userId; // Aus dem JWT

    if (!betCents || betCents <= 0) {
        return res.status(400).json({ error: 'Ungültige Parameter.' });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [rows] = await connection.query<UserRow[]>(
            'SELECT id, balance_cents, is_suspended FROM users WHERE id = ? FOR UPDATE',
            [userId]
        );

        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Benutzer nicht gefunden.' });
        }

        const user = rows[0];

        if (user.is_suspended) {
            await connection.rollback();
            return res.status(403).json({ error: 'Konto ist gesperrt.' });
        }

        if (user.balance_cents < betCents) {
            await connection.rollback();
            return res.status(400).json({ error: 'Unzureichendes Guthaben.' });
        }

        const serverSeed = crypto.randomBytes(32).toString('hex');
        const reelsResult = [
            SYMBOLS[crypto.randomInt(0, SYMBOLS.length)],
            SYMBOLS[crypto.randomInt(0, SYMBOLS.length)],
            SYMBOLS[crypto.randomInt(0, SYMBOLS.length)]
        ];

        let winCents = 0;
        if (reelsResult[0] === reelsResult[1] && reelsResult[1] === reelsResult[2]) {
            winCents = betCents * PAYOUT_MULTIPLIERS[reelsResult[0]];
        }

        const newBalance = user.balance_cents - betCents + winCents;

        await connection.query(
            'UPDATE users SET balance_cents = ? WHERE id = ?',
            [newBalance, userId]
        );

        const roundId = crypto.randomUUID();
        await connection.query<ResultSetHeader>(
            `INSERT INTO game_rounds (id, user_id, bet_cents, win_cents, server_seed, result_data)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [roundId, userId, betCents, winCents, serverSeed, JSON.stringify({ reels: reelsResult })]
        );

        const txId = crypto.randomUUID();
        await connection.query(
            `INSERT INTO balance_transactions (id, user_id, type, amount_cents, balance_after_cents, reference_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [txId, userId, 'SPIN', winCents - betCents, newBalance, roundId]
        );

        await connection.commit();

        return res.json({
            roundId,
            reels: reelsResult,
            winCents,
            newBalanceCents: newBalance
        });

    } catch (err) {
        await connection.rollback();
        console.error('Spin Execution Error:', err);
        return res.status(500).json({ error: 'Serverfehler bei der Spielausführung.' });
    } finally {
        connection.release();
    }
});

// User Endpoint to fetch current balance
app.get('/api/users/me', authenticateJWT, async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    try {
        const [rows] = await pool.query<UserRow[]>('SELECT balance_cents, kyc_status FROM users WHERE id = ?', [userId]);
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ balanceCents: rows[0].balance_cents, kycStatus: (rows[0] as any).kyc_status });
    } catch(err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// --- KYC & COMPLIANCE ROUTES ---

app.post('/api/kyc/submit', authenticateJWT, async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    // Mock KYC verification (in a real app, this would integrate with Sumsub or Jumio)
    try {
        await pool.query('UPDATE users SET kyc_status = ? WHERE id = ?', ['VERIFIED', userId]);
        res.json({ message: 'KYC-Dokumente erfolgreich verifiziert (Mock).' });
    } catch(err) {
        res.status(500).json({ error: 'Serverfehler bei der KYC-Prüfung.' });
    }
});

// --- PAYMENT ROUTES (Mock) ---

app.post('/api/wallet/deposit', authenticateJWT, async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { amountCents } = req.body;

    if (!amountCents || amountCents <= 0) return res.status(400).json({ error: 'Ungültiger Betrag.' });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.query<UserRow[]>('SELECT balance_cents FROM users WHERE id = ? FOR UPDATE', [userId]);
        if (rows.length === 0) throw new Error('User not found');
        
        const newBalance = rows[0].balance_cents + amountCents;
        await connection.query('UPDATE users SET balance_cents = ? WHERE id = ?', [newBalance, userId]);
        
        const txId = crypto.randomUUID();
        await connection.query(
            `INSERT INTO balance_transactions (id, user_id, type, amount_cents, balance_after_cents) VALUES (?, ?, ?, ?, ?)`,
            [txId, userId, 'DEPOSIT', amountCents, newBalance]
        );
        
        await connection.commit();
        res.json({ message: 'Einzahlung erfolgreich.', newBalanceCents: newBalance });
    } catch(err) {
        await connection.rollback();
        res.status(500).json({ error: 'Einzahlung fehlgeschlagen.' });
    } finally {
        connection.release();
    }
});

app.post('/api/wallet/withdraw', authenticateJWT, async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { amountCents } = req.body;

    if (!amountCents || amountCents <= 0) return res.status(400).json({ error: 'Ungültiger Betrag.' });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.query<any[]>('SELECT balance_cents, kyc_status FROM users WHERE id = ? FOR UPDATE', [userId]);
        if (rows.length === 0) throw new Error('User not found');
        
        const user = rows[0];
        
        if (user.kyc_status !== 'VERIFIED' && amountCents > 10000) {
            await connection.rollback();
            return res.status(403).json({ error: 'KYC-Verifizierung erforderlich für Auszahlungen über 100€.' });
        }
        
        if (user.balance_cents < amountCents) {
            await connection.rollback();
            return res.status(400).json({ error: 'Unzureichendes Guthaben.' });
        }
        
        const newBalance = user.balance_cents - amountCents;
        await connection.query('UPDATE users SET balance_cents = ? WHERE id = ?', [newBalance, userId]);
        
        const txId = crypto.randomUUID();
        await connection.query(
            `INSERT INTO balance_transactions (id, user_id, type, amount_cents, balance_after_cents) VALUES (?, ?, ?, ?, ?)`,
            [txId, userId, 'WITHDRAW', -amountCents, newBalance]
        );
        
        await connection.commit();
        res.json({ message: 'Auszahlung erfolgreich.', newBalanceCents: newBalance });
    } catch(err) {
        await connection.rollback();
        res.status(500).json({ error: 'Auszahlung fehlgeschlagen.' });
    } finally {
        connection.release();
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Backend läuft auf http://localhost:${PORT}`);
});