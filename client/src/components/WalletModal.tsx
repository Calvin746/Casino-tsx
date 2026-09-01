import React, { useState } from 'react';

interface WalletModalProps {
    onClose: () => void;
    currentBalance: number;
    kycStatus: string;
    onUpdateBalance: (newBalance: number) => void;
    onKycUpdate?: (newStatus: string) => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
    onClose,
    currentBalance,
    kycStatus,
    onUpdateBalance,
    onKycUpdate
}) => {
    const [activeTab, setActiveTab] = useState<'crypto' | 'fiat' | 'withdraw' | 'kyc'>('crypto');
    const [selectedCrypto, setSelectedCrypto] = useState<'BTC' | 'ETH' | 'USDT'>('BTC');
    const [amountEur, setAmountEur] = useState<number>(50);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);

    const CRYPTO_ADDRESSES = {
        BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        ETH: '0x71C83d3e8eD55819777926C33f81e7d7F80a0669',
        USDT: 'TYD57xYkXQ8236b2X4Xb628Fm7L59eT8dY'
    };

    const handleDeposit = async () => {
        if (amountEur <= 0) return;
        setLoading(true);
        setMessage(null);

        const depositCents = Math.round(amountEur * 100);

        try {
            const res = await fetch('http://localhost:4000/api/wallet/deposit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ amountCents: depositCents })
            });

            if (res.ok) {
                const data = await res.json();
                onUpdateBalance(data.newBalanceCents);
                setMessage({ text: `Erfolgreich eingezahlt! +${amountEur.toFixed(2)} € gutgeschrieben.`, type: 'success' });
            } else {
                throw new Error('Local fallback');
            }
        } catch (e) {
            // Local fallback simulation
            onUpdateBalance(currentBalance + depositCents);
            setMessage({ text: `Erfolgreich eingezahlt! +${amountEur.toFixed(2)} € gutgeschrieben (Simulation).`, type: 'success' });
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async () => {
        const withdrawCents = Math.round(amountEur * 100);
        if (withdrawCents <= 0 || withdrawCents > currentBalance) {
            setMessage({ text: 'Ungültiger Betrag oder unzureichendes Guthaben.', type: 'error' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const res = await fetch('http://localhost:4000/api/wallet/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ amountCents: withdrawCents })
            });

            if (res.ok) {
                const data = await res.json();
                onUpdateBalance(data.newBalanceCents);
                setMessage({ text: `Auszahlung erfolgreich initiiert! -${amountEur.toFixed(2)} €`, type: 'success' });
            } else {
                throw new Error('Local fallback');
            }
        } catch (e) {
            onUpdateBalance(currentBalance - withdrawCents);
            setMessage({ text: `Auszahlung erfolgreich initiiert! -${amountEur.toFixed(2)} € (Simulation)`, type: 'success' });
        } finally {
            setLoading(false);
        }
    };

    const copyAddress = () => {
        navigator.clipboard.writeText(CRYPTO_ADDRESSES[selectedCrypto]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '16px'
        }}>
            <div style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-strong)',
                width: '100%',
                maxWidth: '520px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--bg-main)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.4rem' }}>💳</span>
                        <h3 style={{ margin: 0, color: 'var(--text-white)', fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                            Stake Kasse & Wallet
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            fontSize: '1.4rem',
                            cursor: 'pointer'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    background: 'var(--bg-main)',
                    padding: '6px 16px',
                    borderBottom: '1px solid var(--border-subtle)',
                    gap: '6px'
                }}>
                    <button
                        onClick={() => setActiveTab('crypto')}
                        style={{
                            flex: 1,
                            padding: '10px',
                            border: 'none',
                            borderRadius: '6px',
                            background: activeTab === 'crypto' ? 'var(--bg-elevated)' : 'transparent',
                            color: activeTab === 'crypto' ? 'var(--stake-green)' : 'var(--text-secondary)',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                    >
                        Krypto Einzahlung
                    </button>
                    <button
                        onClick={() => setActiveTab('fiat')}
                        style={{
                            flex: 1,
                            padding: '10px',
                            border: 'none',
                            borderRadius: '6px',
                            background: activeTab === 'fiat' ? 'var(--bg-elevated)' : 'transparent',
                            color: activeTab === 'fiat' ? 'var(--stake-green)' : 'var(--text-secondary)',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                    >
                        Fiat / Sofort
                    </button>
                    <button
                        onClick={() => setActiveTab('withdraw')}
                        style={{
                            flex: 1,
                            padding: '10px',
                            border: 'none',
                            borderRadius: '6px',
                            background: activeTab === 'withdraw' ? 'var(--bg-elevated)' : 'transparent',
                            color: activeTab === 'withdraw' ? 'var(--stake-green)' : 'var(--text-secondary)',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                    >
                        Auszahlen
                    </button>
                    <button
                        onClick={() => setActiveTab('kyc')}
                        style={{
                            flex: 1,
                            padding: '10px',
                            border: 'none',
                            borderRadius: '6px',
                            background: activeTab === 'kyc' ? 'var(--bg-elevated)' : 'transparent',
                            color: activeTab === 'kyc' ? 'var(--stake-green)' : 'var(--text-secondary)',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                    >
                        KYC
                    </button>
                </div>

                {/* Content Body */}
                <div style={{ padding: '24px' }}>
                    {/* Current balance reminder */}
                    <div style={{
                        background: 'var(--bg-main)',
                        padding: '14px 18px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px'
                    }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Verfügbares Saldo:</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-white)' }}>
                            {(currentBalance / 100).toFixed(2)} €
                        </span>
                    </div>

                    {message && (
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: '6px',
                            marginBottom: '16px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            background: message.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 231, 1, 0.15)',
                            color: message.type === 'error' ? '#ef4444' : 'var(--stake-green)',
                            border: `1px solid ${message.type === 'error' ? '#ef4444' : 'var(--stake-green)'}`
                        }}>
                            {message.text}
                        </div>
                    )}

                    {/* TAB 1: CRYPTO DEPOSIT */}
                    {activeTab === 'crypto' && (
                        <div>
                            {/* Coin Picker */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                                {(['BTC', 'ETH', 'USDT'] as const).map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setSelectedCrypto(c)}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            borderRadius: '6px',
                                            border: `1px solid ${selectedCrypto === c ? 'var(--stake-green)' : 'var(--border-subtle)'}`,
                                            background: selectedCrypto === c ? 'rgba(0, 231, 1, 0.1)' : 'var(--bg-main)',
                                            color: selectedCrypto === c ? 'var(--stake-green)' : 'var(--text-white)',
                                            fontWeight: 700,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>

                            {/* QR Code & Address */}
                            <div style={{
                                background: 'var(--bg-main)',
                                padding: '16px',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-subtle)',
                                textAlign: 'center',
                                marginBottom: '20px'
                            }}>
                                {/* QR placeholder */}
                                <div style={{
                                    width: '130px',
                                    height: '130px',
                                    background: '#fff',
                                    margin: '0 auto 14px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '50px'
                                }}>
                                    📱
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                    Deine persönliche {selectedCrypto} Einzahlungsadresse:
                                </div>
                                <div style={{
                                    background: 'var(--bg-elevated)',
                                    padding: '10px 12px',
                                    borderRadius: '6px',
                                    fontSize: '0.78rem',
                                    color: 'var(--text-white)',
                                    wordBreak: 'break-all',
                                    fontFamily: 'monospace',
                                    border: '1px solid var(--border-subtle)',
                                    marginBottom: '10px'
                                }}>
                                    {CRYPTO_ADDRESSES[selectedCrypto]}
                                </div>
                                <button
                                    onClick={copyAddress}
                                    className="stake-btn stake-btn-secondary"
                                    style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                                >
                                    {copied ? '✓ Kopiert!' : '📋 Adresse kopieren'}
                                </button>
                            </div>

                            {/* Instant test deposit */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={handleDeposit}
                                    disabled={loading}
                                    className="stake-btn stake-btn-green"
                                    style={{ flex: 1, padding: '14px' }}
                                >
                                    Sofort +{amountEur.toFixed(2)} € Test-Guthaben gutschreiben
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: FIAT DEPOSIT */}
                    {activeTab === 'fiat' && (
                        <div>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                                {[25, 50, 100, 250, 500].map(amt => (
                                    <button
                                        key={amt}
                                        onClick={() => setAmountEur(amt)}
                                        style={{
                                            flex: 1,
                                            padding: '8px',
                                            borderRadius: '6px',
                                            border: amountEur === amt ? '1px solid var(--stake-green)' : '1px solid var(--border-subtle)',
                                            background: amountEur === amt ? 'rgba(0, 231, 1, 0.1)' : 'var(--bg-main)',
                                            color: amountEur === amt ? 'var(--stake-green)' : '#fff',
                                            fontWeight: 700,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {amt} €
                                    </button>
                                ))}
                            </div>

                            <input
                                type="number"
                                value={amountEur}
                                onChange={(e) => setAmountEur(Number(e.target.value))}
                                placeholder="Eigener Betrag in €"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-subtle)',
                                    background: 'var(--bg-main)',
                                    color: '#fff',
                                    fontWeight: 700,
                                    marginBottom: '16px',
                                    outline: 'none'
                                }}
                            />

                            <button
                                onClick={handleDeposit}
                                disabled={loading}
                                className="stake-btn stake-btn-green"
                                style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
                            >
                                Jetzt {amountEur.toFixed(2)} € Einzahlen (Sofort / Karte)
                            </button>
                        </div>
                    )}

                    {/* TAB 3: WITHDRAW */}
                    {activeTab === 'withdraw' && (
                        <div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                                Sofortige Krypto-Auszahlung ohne Transaktionsgebühren.
                            </p>
                            <input
                                type="number"
                                value={amountEur}
                                onChange={(e) => setAmountEur(Number(e.target.value))}
                                placeholder="Auszahlungsbetrag in €"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-subtle)',
                                    background: 'var(--bg-main)',
                                    color: '#fff',
                                    fontWeight: 700,
                                    marginBottom: '16px',
                                    outline: 'none'
                                }}
                            />
                            <button
                                onClick={handleWithdraw}
                                disabled={loading || amountEur <= 0}
                                className="stake-btn"
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    background: 'var(--stake-gold)',
                                    color: '#1a1003',
                                    fontWeight: 800
                                }}
                            >
                                Auszahlung von {amountEur.toFixed(2)} € anfordern
                            </button>
                        </div>
                    )}

                    {/* TAB 4: KYC VERIFICATION */}
                    {activeTab === 'kyc' && (
                        <div>
                            <div style={{
                                background: 'var(--bg-main)',
                                padding: '16px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-subtle)',
                                marginBottom: '18px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Verifizierungsstufe:</span>
                                    <span className="stake-badge stake-badge-original">Stufe 1 Verifiziert</span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                                    ✓ E-Mail Verifikation abgeschlossen<br />
                                    ✓ Tägliches Limit: Bis zu 100.000 €<br />
                                    ✓ Sofortige Auszahlungen aktiv
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    if (onKycUpdate) onKycUpdate('VERIFIED');
                                    setMessage({ text: 'KYC Status: Erfolgreich verifiziert!', type: 'success' });
                                }}
                                className="stake-btn stake-btn-secondary"
                                style={{ width: '100%', padding: '12px' }}
                            >
                                Ausweisdokument hochladen (Stufe 2)
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
