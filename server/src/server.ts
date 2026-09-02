import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mysql, { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import nodemailer from 'nodemailer';

const app = express();
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// JWT Secret (in production from .env)
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-casino-key';

// Email Transporter Config (Ethereal Test Account)
let transporter: nodemailer.Transporter;

nodemailer.createTestAccount().then(account => {
    transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: {
            user: account.user,
            pass: account.pass
        }
    });
    console.log('Test-Email Account (Ethereal) erstellt. Mails werden hier nicht wirklich versendet, sondern können über einen Link im Terminal angesehen werden.');
}).catch(err => {
    console.error('Fehler beim Erstellen des Test-Email-Accounts:', err);
});

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

        // Send Welcome Email
        if (transporter) {
            try {
                const info = await transporter.sendMail({
                    from: '"Casino Admin" <admin@casino.local>',
                    to: email,
                    subject: 'Willkommen im Online Casino!',
                    text: 'Hallo,\n\nvielen Dank für deine Registrierung in unserem Casino! Wir haben dir 100€ Startguthaben gutgeschrieben.\n\nViel Spaß und Erfolg,\nDein Casino Team',
                    html: '<p>Hallo,</p><p>vielen Dank für deine Registrierung in unserem Casino! Wir haben dir <strong>100€ Startguthaben</strong> gutgeschrieben.</p><p>Viel Spaß und Erfolg,<br>Dein Casino Team</p>'
                });
                console.log(`Willkommens-Email gesendet an ${email}`);
                console.log(`---> Vorschau-Link für die E-Mail (im Browser öffnen): ${nodemailer.getTestMessageUrl(info)}`);
            } catch (emailErr) {
                console.error('Failed to send welcome email:', emailErr);
                // Don't fail the registration if email fails
            }
        }

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

// --- SPORTS BETTING (P2P) ---

app.get('/api/sports/matches', async (req: Request, res: Response) => {
    try {
        const [matches] = await pool.query('SELECT * FROM matches WHERE status IN ("UPCOMING", "LIVE") ORDER BY start_time ASC');
        res.json(matches);
    } catch(err) {
        console.error('Error fetching matches:', err);
        res.status(500).json({ error: 'Fehler beim Laden der Spiele.' });
    }
});

// Mock endpoint to seed some matches (for demo purposes)
app.post('/api/sports/seed-matches', async (req: Request, res: Response) => {
    try {
        const matchId1 = crypto.randomUUID();
        const matchId2 = crypto.randomUUID();
        await pool.query(
            `INSERT IGNORE INTO matches (id, api_id, sport_key, home_team, away_team, start_time, status) VALUES 
            (?, 'mock_api_1', 'soccer_germany_bundesliga', 'Bayern München', 'Borussia Dortmund', DATE_ADD(NOW(), INTERVAL 1 DAY), 'UPCOMING'),
            (?, 'mock_api_2', 'soccer_germany_bundesliga', 'RB Leipzig', 'Bayer Leverkusen', DATE_ADD(NOW(), INTERVAL 2 DAY), 'UPCOMING')`,
            [matchId1, matchId2]
        );
        res.json({ message: 'Mock Matches created.' });
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: 'Seed failed.' });
    }
});

app.post('/api/sports/bets/create', authenticateJWT, async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { matchId, teamChoice, stakeCents } = req.body;

    if (!matchId || !teamChoice || !stakeCents || stakeCents <= 0) {
        return res.status(400).json({ error: 'Ungültige Wett-Parameter.' });
    }
    if (!['HOME', 'AWAY', 'DRAW'].includes(teamChoice)) {
        return res.status(400).json({ error: 'Ungültige Teamauswahl.' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Check user balance
        const [userRows] = await connection.query<UserRow[]>('SELECT balance_cents FROM users WHERE id = ? FOR UPDATE', [userId]);
        if (userRows.length === 0) throw new Error('User not found');
        if (userRows[0].balance_cents < stakeCents) {
            await connection.rollback();
            return res.status(400).json({ error: 'Unzureichendes Guthaben für diese Wette.' });
        }

        // 2. Check if match exists and is upcoming
        const [matchRows] = await connection.query<any[]>('SELECT status FROM matches WHERE id = ?', [matchId]);
        if (matchRows.length === 0 || matchRows[0].status !== 'UPCOMING') {
            await connection.rollback();
            return res.status(400).json({ error: 'Spiel nicht gefunden oder nicht mehr verfügbar für Wetten.' });
        }

        // 3. Deduct balance
        const newBalance = userRows[0].balance_cents - stakeCents;
        await connection.query('UPDATE users SET balance_cents = ? WHERE id = ?', [newBalance, userId]);

        // 4. Create P2P Bet Offer
        const betId = crypto.randomUUID();
        await connection.query(
            `INSERT INTO p2p_bets (id, match_id, creator_user_id, creator_team_choice, stake_cents, status) 
             VALUES (?, ?, ?, ?, ?, 'OPEN')`,
            [betId, matchId, userId, teamChoice, stakeCents]
        );

        // 5. Create Transaction Record
        const txId = crypto.randomUUID();
        await connection.query(
            `INSERT INTO balance_transactions (id, user_id, type, amount_cents, balance_after_cents, reference_id)
             VALUES (?, ?, 'BET_PLACE', ?, ?, ?)`,
            [txId, userId, -stakeCents, newBalance, betId]
        );

        await connection.commit();
        res.status(201).json({ message: 'Wetteinsatz erfolgreich erstellt.', betId, newBalanceCents: newBalance });
    } catch(err) {
        await connection.rollback();
        console.error('Create Bet Error:', err);
        res.status(500).json({ error: 'Serverfehler beim Erstellen der Wette.' });
    } finally {
        connection.release();
    }
});

app.get('/api/sports/bets/open/:matchId', async (req: Request, res: Response) => {
    const { matchId } = req.params;
    try {
        // Only return open bets for this match
        const [bets] = await pool.query(`
            SELECT b.id, b.creator_team_choice, b.stake_cents, b.created_at, u.email as creator_email 
            FROM p2p_bets b
            JOIN users u ON b.creator_user_id = u.id
            WHERE b.match_id = ? AND b.status = 'OPEN'
        `, [matchId]);
        res.json(bets);
    } catch(err) {
        res.status(500).json({ error: 'Fehler beim Laden der Wetten.' });
    }
});

app.post('/api/sports/bets/accept', authenticateJWT, async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { betId } = req.body;

    if (!betId) return res.status(400).json({ error: 'Wett-ID fehlt.' });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Lock the bet row
        const [betRows] = await connection.query<any[]>('SELECT * FROM p2p_bets WHERE id = ? FOR UPDATE', [betId]);
        if (betRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Wette nicht gefunden.' });
        }
        
        const bet = betRows[0];
        
        if (bet.status !== 'OPEN') {
            await connection.rollback();
            return res.status(400).json({ error: 'Diese Wette wurde bereits angenommen oder ist nicht mehr verfügbar.' });
        }
        
        if (bet.creator_user_id === userId) {
            await connection.rollback();
            return res.status(400).json({ error: 'Du kannst deine eigene Wette nicht annehmen.' });
        }

        // 2. Lock user balance
        const [userRows] = await connection.query<UserRow[]>('SELECT balance_cents FROM users WHERE id = ? FOR UPDATE', [userId]);
        if (userRows.length === 0) throw new Error('User not found');
        
        if (userRows[0].balance_cents < bet.stake_cents) {
            await connection.rollback();
            return res.status(400).json({ error: 'Unzureichendes Guthaben, um diese Wette anzunehmen.' });
        }

        // 3. Deduct balance from acceptor
        const newBalance = userRows[0].balance_cents - bet.stake_cents;
        await connection.query('UPDATE users SET balance_cents = ? WHERE id = ?', [newBalance, userId]);

        // 4. Update Bet Status
        await connection.query(
            'UPDATE p2p_bets SET acceptor_user_id = ?, status = "MATCHED" WHERE id = ?',
            [userId, betId]
        );

        // 5. Create Transaction Record
        const txId = crypto.randomUUID();
        await connection.query(
            `INSERT INTO balance_transactions (id, user_id, type, amount_cents, balance_after_cents, reference_id)
             VALUES (?, ?, 'BET_ACCEPT', ?, ?, ?)`,
            [txId, userId, -bet.stake_cents, newBalance, betId]
        );

        await connection.commit();
        res.json({ message: 'Wette erfolgreich angenommen! Das Spiel kann beginnen.', newBalanceCents: newBalance });
    } catch(err) {
        await connection.rollback();
        console.error('Accept Bet Error:', err);
        res.status(500).json({ error: 'Fehler beim Annehmen der Wette.' });
    } finally {
        connection.release();
    }
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Backend läuft auf http://localhost:${PORT}`);
});