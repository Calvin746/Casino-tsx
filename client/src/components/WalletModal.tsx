import React, { useState } from 'react';

interface WalletModalProps {
    onClose: () => void;
    currentBalance: number;
    kycStatus: string;
    onUpdateBalance: (newBalance: number) => void;
    onKycUpdate: (newStatus: string) => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ onClose, currentBalance, kycStatus, onUpdateBalance, onKycUpdate }) => {
    const [amount, setAmount] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);

    const handleTransaction = async (type: 'deposit' | 'withdraw') => {
        if (amount <= 0) return;
        setLoading(true);
        setMessage(null);

        try {
            const res = await fetch(`http://localhost:4000/api/wallet/${type}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ amountCents: amount * 100 })
            });

            const data = await res.json();
            if (!res.ok) {
                setMessage({ text: data.error || 'Fehler aufgetreten', type: 'error' });
            } else {
                setMessage({ text: data.message, type: 'success' });
                onUpdateBalance(data.newBalanceCents);
                setAmount(0);
            }
        } catch (err) {
            setMessage({ text: 'Verbindungsfehler', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleKyc = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const res = await fetch(`http://localhost:4000/api/kyc/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({ text: data.message, type: 'success' });
                onKycUpdate('VERIFIED');
            } else {
                setMessage({ text: data.error, type: 'error' });
            }
        } catch(err) {
            setMessage({ text: 'Verbindungsfehler', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: '#121216', padding: '32px', borderRadius: '12px', border: '1px solid #333',
                width: '400px', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ margin: 0, color: '#c5a059' }}>Wallet & Konto</h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✖</button>
                </div>

                <div style={{ marginBottom: '24px', background: '#222', padding: '16px', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 8px 0', color: '#aaa' }}>Aktuelles Guthaben:</p>
                    <h3 style={{ margin: 0, fontSize: '1.8rem' }}>{(currentBalance / 100).toFixed(2)} €</h3>
                </div>

                <div style={{ marginBottom: '24px', background: '#222', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p style={{ margin: '0 0 4px 0', color: '#aaa' }}>KYC Status:</p>
                        <span style={{ fontWeight: 'bold', color: kycStatus === 'VERIFIED' ? '#4ade80' : '#f87171' }}>{kycStatus}</span>
                    </div>
                    {kycStatus !== 'VERIFIED' && (
                        <button onClick={handleKyc} disabled={loading} style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' }}>
                            Verifizieren
                        </button>
                    )}
                </div>

                {message && (
                    <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '6px', background: message.type === 'error' ? '#7f1d1d' : '#14532d', color: '#fff' }}>
                        {message.text}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <input
                        type="number"
                        placeholder="Betrag in €"
                        value={amount || ''}
                        onChange={e => setAmount(Number(e.target.value))}
                        style={{ flex: 1, padding: '12px', borderRadius: '6px', border: 'none', background: '#222', color: '#fff' }}
                        min="1"
                    />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => handleTransaction('deposit')}
                        disabled={loading || amount <= 0}
                        style={{ flex: 1, padding: '12px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: loading || amount <= 0 ? 'not-allowed' : 'pointer' }}
                    >
                        Einzahlen
                    </button>
                    <button
                        onClick={() => handleTransaction('withdraw')}
                        disabled={loading || amount <= 0}
                        style={{ flex: 1, padding: '12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: loading || amount <= 0 ? 'not-allowed' : 'pointer' }}
                    >
                        Auszahlen
                    </button>
                </div>
            </div>
        </div>
    );
};
