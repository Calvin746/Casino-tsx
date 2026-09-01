import React, { useState } from 'react';

interface AuthScreenProps {
    onLogin: (balanceCents: number, email?: string) => void;
    onClose?: () => void;
    isModal?: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onClose, isModal = false }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

        try {
            const res = await fetch(`http://localhost:4000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                // If backend error, show message or give fallback option
                setError(data.error || 'Serverfehler');
                setLoading(false);
                return;
            }

            if (isLogin) {
                onLogin(data.balanceCents, email);
            } else {
                setIsLogin(true);
                setError(null);
                alert('Registrierung erfolgreich! Bitte logge dich nun ein.');
            }
        } catch (err) {
            // Backend might not be running -> Offer instant demo mode
            setError('Keine Verbindung zum lokalen Server. Du kannst sofort im VIP-Demomodus starten!');
        } finally {
            setLoading(false);
        }
    };

    const handleGuestStart = () => {
        // Instant play with 100.00 €
        onLogin(10000, 'vip_guest@stake.local');
    };

    const content = (
        <div style={{
            background: 'var(--bg-card)',
            padding: '36px 32px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
            border: '1px solid var(--border-strong)',
            width: '100%',
            maxWidth: '420px',
            position: 'relative'
        }}>
            {isModal && onClose && (
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        fontSize: '1.2rem',
                        cursor: 'pointer'
                    }}
                >
                    ✕
                </button>
            )}

            {/* Stake Logo */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                }}>
                    <span style={{
                        background: 'linear-gradient(135deg, #00e701 0%, #009901 100%)',
                        color: '#000',
                        fontWeight: 900,
                        fontSize: '1.2rem',
                        padding: '4px 8px',
                        borderRadius: '6px'
                    }}>
                        S
                    </span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '1px', color: '#fff', fontFamily: 'var(--font-display)' }}>
                        STAKE<span style={{ color: 'var(--stake-green)' }}>.ROYAL</span>
                    </span>
                </div>
                <h2 style={{ fontSize: '1.1rem', color: 'var(--text-white)', margin: 0, fontWeight: 700 }}>
                    {isLogin ? 'Willkommen zurück!' : 'Kostenloses Stake-Konto erstellen'}
                </h2>
            </div>

            {/* Quick Guest Play Button */}
            <button
                onClick={handleGuestStart}
                className="stake-btn stake-btn-green glow-green"
                style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    marginBottom: '20px'
                }}
            >
                ⚡ Sofort als VIP-Gast spielen (100,00 € Startguthaben)
            </button>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                margin: '16px 0',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '1px'
            }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }}></div>
                <span style={{ padding: '0 12px' }}>Oder mit E-Mail</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }}></div>
            </div>

            {error && (
                <div style={{
                    color: '#f87171',
                    marginBottom: '16px',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    background: 'rgba(239, 68, 68, 0.1)',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                        E-Mail Adresse
                    </label>
                    <input
                        type="email"
                        placeholder="name@beispiel.de"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-main)',
                            color: '#fff',
                            outline: 'none'
                        }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                        Passwort
                    </label>
                    <input
                        type="password"
                        placeholder="Mindestens 8 Zeichen"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-main)',
                            color: '#fff',
                            outline: 'none'
                        }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="stake-btn stake-btn-secondary"
                    style={{
                        padding: '12px',
                        fontWeight: 700,
                        marginTop: '6px'
                    }}
                >
                    {loading ? 'Lädt...' : (isLogin ? 'Einloggen' : 'Konto registrieren')}
                </button>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {isLogin ? 'Noch kein Konto? ' : 'Bereits registriert? '}
                <span
                    onClick={() => { setIsLogin(!isLogin); setError(null); }}
                    style={{ color: 'var(--stake-green)', cursor: 'pointer', fontWeight: 700 }}
                >
                    {isLogin ? 'Hier kostenlos registrieren' : 'Hier einloggen'}
                </span>
            </div>
        </div>
    );

    if (isModal) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '16px'
            }}>
                {content}
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            width: '100vw',
            backgroundColor: 'var(--bg-main)',
            padding: '20px'
        }}>
            {content}
        </div>
    );
};
