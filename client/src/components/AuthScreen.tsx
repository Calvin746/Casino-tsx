import React, { useState } from 'react';

interface AuthScreenProps {
    onLogin: (balance: number) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
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
                setError(data.error || 'Fehler aufgetreten');
                setLoading(false);
                return;
            }

            if (isLogin) {
                onLogin(data.balanceCents);
            } else {
                // If registered successfully, switch to login
                setIsLogin(true);
                setError(null);
                alert('Registrierung erfolgreich! Bitte logge dich nun ein.');
            }
        } catch (err) {
            setError('Verbindungsfehler zum Server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100vh', width: '100vw', backgroundColor: '#0a0a0c', color: '#fff'
        }}>
            <div style={{
                background: '#121216', padding: '40px', borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)', border: '1px solid #333', width: '350px'
            }}>
                <h1 style={{ textAlign: 'center', marginBottom: '24px', color: '#c5a059' }}>
                    {isLogin ? 'Casino Login' : 'Registrieren'}
                </h1>
                
                {error && <div style={{ color: '#f87171', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <input
                        type="email"
                        placeholder="E-Mail Adresse"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ padding: '12px', borderRadius: '6px', border: 'none', background: '#222', color: '#fff' }}
                    />
                    <input
                        type="password"
                        placeholder="Passwort"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        style={{ padding: '12px', borderRadius: '6px', border: 'none', background: '#222', color: '#fff' }}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: '14px', borderRadius: '6px', border: 'none',
                            background: '#c5a059', color: '#000', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer',
                            marginTop: '8px'
                        }}
                    >
                        {loading ? 'Lädt...' : (isLogin ? 'Einloggen' : 'Registrieren')}
                    </button>
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', color: '#888' }}>
                    {isLogin ? 'Noch kein Konto? ' : 'Bereits registriert? '}
                    <span
                        onClick={() => { setIsLogin(!isLogin); setError(null); }}
                        style={{ color: '#c5a059', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        {isLogin ? 'Hier registrieren' : 'Hier einloggen'}
                    </span>
                </div>
            </div>
        </div>
    );
};
