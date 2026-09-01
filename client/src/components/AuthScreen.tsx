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
            background: 'linear-gradient(145deg, rgba(30, 35, 45, 0.95) 0%, rgba(15, 20, 25, 0.98) 100%)',
            padding: '40px 32px',
            borderRadius: '24px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
            width: '100%',
            maxWidth: '420px',
            position: 'relative',
            overflow: 'hidden'
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
                    marginBottom: '20px',
                    borderRadius: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}
            >
                ⚡ Sofort als VIP-Gast spielen
            </button>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                margin: '20px 0',
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                fontWeight: 600
            }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
                <span style={{ padding: '0 16px' }}>Oder mit E-Mail</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
            </div>

            {error && (
                <div style={{
                    color: '#ff4d4f',
                    marginBottom: '20px',
                    fontSize: '0.9rem',
                    textAlign: 'center',
                    background: 'rgba(255, 77, 79, 0.15)',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 77, 79, 0.3)',
                    fontWeight: 500,
                    backdropFilter: 'blur(4px)'
                }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.5px' }}>
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
                            padding: '14px 16px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(0,0,0,0.4)',
                            color: '#fff',
                            outline: 'none',
                            fontSize: '1rem',
                            transition: 'all 0.3s ease',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                        }}
                        onFocus={(e) => { e.target.style.border = '1px solid var(--stake-green)'; e.target.style.background = 'rgba(0,0,0,0.6)'; }}
                        onBlur={(e) => { e.target.style.border = '1px solid rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(0,0,0,0.4)'; }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.5px' }}>
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
                            padding: '14px 16px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(0,0,0,0.4)',
                            color: '#fff',
                            outline: 'none',
                            fontSize: '1rem',
                            transition: 'all 0.3s ease',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                        }}
                        onFocus={(e) => { e.target.style.border = '1px solid var(--stake-green)'; e.target.style.background = 'rgba(0,0,0,0.6)'; }}
                        onBlur={(e) => { e.target.style.border = '1px solid rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(0,0,0,0.4)'; }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="stake-btn stake-btn-secondary"
                    style={{
                        padding: '14px',
                        fontWeight: 800,
                        marginTop: '10px',
                        fontSize: '1rem',
                        letterSpacing: '1px',
                        borderRadius: '8px',
                        background: 'linear-gradient(to right, #2a2e38, #343a46)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)'; }}
                >
                    {loading ? 'LÄDT...' : (isLogin ? 'EINLOGGEN' : 'KONTO REGISTRIEREN')}
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
