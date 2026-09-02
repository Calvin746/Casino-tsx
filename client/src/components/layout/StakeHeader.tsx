import React, { useState } from 'react';

export type CurrencyType = 'EUR' | 'BTC' | 'ETH' | 'USDT' | 'DOGE';

interface StakeHeaderProps {
    balanceCents: number;
    currency: CurrencyType;
    onCurrencyChange: (c: CurrencyType) => void;
    onOpenWallet: () => void;
    onOpenAuth?: () => void;
    onOpenAdminRtp?: () => void;
    isLoggedIn: boolean;
    userEmail?: string;
    onLogout?: () => void;
    onToggleSidebar: () => void;
    sidebarOpen: boolean;
    activeTab: 'casino' | 'sports';
    onTabChange: (tab: 'casino' | 'sports') => void;
    searchQuery: string;
    onSearchChange: (q: string) => void;
    chatOpen?: boolean;
    onToggleChat?: () => void;
}

export const StakeHeader: React.FC<StakeHeaderProps> = ({
    balanceCents,
    currency,
    onCurrencyChange,
    onOpenWallet,
    onOpenAuth,
    onOpenAdminRtp,
    isLoggedIn,
    userEmail,
    onLogout,
    onToggleSidebar,
    sidebarOpen,
    activeTab,
    onTabChange,
    searchQuery,
    onSearchChange,
    chatOpen,
    onToggleChat
}) => {
    const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    // Conversion display helper
    const formatBalance = (cents: number, curr: CurrencyType) => {
        const eur = cents / 100;
        switch (curr) {
            case 'BTC': return (eur / 60000).toFixed(6) + ' BTC';
            case 'ETH': return (eur / 3000).toFixed(4) + ' ETH';
            case 'USDT': return (eur * 1.08).toFixed(2) + ' USDT';
            case 'DOGE': return (eur * 8.5).toFixed(1) + ' DOGE';
            default: return eur.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
        }
    };

    return (
        <header style={{
            height: '72px',
            backgroundColor: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-subtle)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            gap: '16px'
        }}>
            {/* Left: Hamburger & Brand & Casino/Sports Switch */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                    onClick={onToggleSidebar}
                    aria-label="Toggle Navigation"
                    style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-white)',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>

                {/* Stake Brand Logo */}
                <div 
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}
                >
                    <div style={{
                        background: 'linear-gradient(135deg, #00e701 0%, #009901 100%)',
                        color: '#071807',
                        fontWeight: 900,
                        fontSize: '1.25rem',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        letterSpacing: '1px',
                        fontFamily: 'var(--font-display)',
                        boxShadow: '0 2px 10px var(--stake-green-glow)'
                    }}>
                        S
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{
                            fontSize: '1.35rem',
                            fontWeight: 900,
                            letterSpacing: '1.5px',
                            color: 'var(--text-white)',
                            fontFamily: 'var(--font-display)',
                            lineHeight: 1
                        }}>
                            STAKE<span style={{ color: 'var(--stake-green)' }}>.ROYAL</span>
                        </span>
                        <span style={{ fontSize: '0.62rem', letterSpacing: '2px', color: 'var(--stake-gold)', fontWeight: 700 }}>
                            OFFICIAL CRYPTO CASINO
                        </span>
                    </div>
                </div>

                {/* Casino / Sports Switcher */}
                <div style={{
                    display: 'flex',
                    background: 'var(--bg-main)',
                    padding: '3px',
                    borderRadius: '30px',
                    border: '1px solid var(--border-subtle)',
                    marginLeft: '8px'
                }}>
                    <button
                        onClick={() => onTabChange('casino')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            borderRadius: '25px',
                            border: 'none',
                            background: activeTab === 'casino' ? 'var(--bg-elevated)' : 'transparent',
                            color: activeTab === 'casino' ? 'var(--text-white)' : 'var(--text-primary)',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span>🎰</span> Casino
                    </button>
                    <button
                        onClick={() => onTabChange('sports')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            borderRadius: '25px',
                            border: 'none',
                            background: activeTab === 'sports' ? 'var(--bg-elevated)' : 'transparent',
                            color: activeTab === 'sports' ? 'var(--text-white)' : 'var(--text-primary)',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span>⚽</span> Sport
                    </button>
                </div>
            </div>

            {/* Middle: Search Bar */}
            <div style={{ flex: 1, maxWidth: '420px', position: 'relative' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0 12px',
                    height: '42px',
                    transition: 'border-color 0.2s'
                }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        type="text"
                        placeholder="Spiel oder Anbieter suchen..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-white)',
                            outline: 'none',
                            fontSize: '0.875rem'
                        }}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => onSearchChange('')}
                            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Right: Wallet Balance, Deposit & User Area */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {isLoggedIn ? (
                    <>
                        {/* Currency & Balance Capsule */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: 'var(--bg-main)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                            padding: '4px',
                            position: 'relative'
                        }}>
                            <div 
                                onClick={() => setCurrencyMenuOpen(!currencyMenuOpen)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '6px 12px',
                                    cursor: 'pointer',
                                    userSelect: 'none'
                                }}
                            >
                                <span style={{
                                    color: 'var(--text-white)',
                                    fontWeight: 800,
                                    fontSize: '0.95rem',
                                    letterSpacing: '0.3px'
                                }}>
                                    {formatBalance(balanceCents, currency)}
                                </span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2.5">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>

                            {/* Wallet / Deposit Button */}
                            <button
                                onClick={onOpenWallet}
                                className="stake-btn stake-btn-green"
                                style={{
                                    padding: '8px 16px',
                                    fontSize: '0.825rem',
                                    borderRadius: '6px'
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                                    <line x1="2" y1="10" x2="22" y2="10"></line>
                                </svg>
                                <span>Kasse</span>
                            </button>

                            {/* Dropdown Menu for Currencies */}
                            {currencyMenuOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: '110%',
                                    left: 0,
                                    width: '180px',
                                    background: 'var(--bg-elevated)',
                                    border: '1px solid var(--border-strong)',
                                    borderRadius: 'var(--radius-md)',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                    zIndex: 200,
                                    padding: '6px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '2px'
                                }}>
                                    {(['EUR', 'BTC', 'ETH', 'USDT', 'DOGE'] as CurrencyType[]).map((c) => (
                                        <div
                                            key={c}
                                            onClick={() => { onCurrencyChange(c); setCurrencyMenuOpen(false); }}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '4px',
                                                background: currency === c ? 'var(--bg-active)' : 'transparent',
                                                color: currency === c ? 'var(--stake-green)' : 'var(--text-white)',
                                                fontWeight: 600,
                                                fontSize: '0.85rem',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <span>{c}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                {c === 'EUR' ? 'Euro' : 'Krypto'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Admin RTP Control Button */}
                        {onOpenAdminRtp && (
                            <button
                                onClick={onOpenAdminRtp}
                                style={{
                                    background: 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #f59e0b 100%)',
                                    color: '#000',
                                    border: '1px solid #fff',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '8px 14px',
                                    fontWeight: 900,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 0 15px rgba(245, 158, 11, 0.6)'
                                }}
                            >
                                <span>👑</span> ADMIN RTP
                            </button>
                        )}

                        {/* User Profile Avatar */}
                        <div style={{ position: 'relative' }}>
                            <div
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontWeight: 800,
                                    fontSize: '0.95rem',
                                    cursor: 'pointer',
                                    border: '1px solid var(--border-strong)'
                                }}
                            >
                                {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
                            </div>

                            {userMenuOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: '110%',
                                    right: 0,
                                    width: '200px',
                                    background: 'var(--bg-elevated)',
                                    border: '1px solid var(--border-strong)',
                                    borderRadius: 'var(--radius-md)',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                    zIndex: 200,
                                    padding: '8px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px'
                                }}>
                                    <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Angemeldet als</p>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-white)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {userEmail || 'Spieler'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => { onOpenWallet(); setUserMenuOpen(false); }}
                                        style={{
                                            background: 'none', border: 'none', color: 'var(--text-white)', padding: '8px 12px',
                                            textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', borderRadius: '4px'
                                        }}
                                    >
                                        💳 Mein Wallet
                                    </button>
                                    <button
                                        onClick={onLogout}
                                        style={{
                                            background: 'none', border: 'none', color: 'var(--danger)', padding: '8px 12px',
                                            textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', borderRadius: '4px', fontWeight: 600
                                        }}
                                    >
                                        🚪 Abmelden
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={onOpenAuth}
                            className="stake-btn stake-btn-secondary"
                            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                        >
                            Anmelden
                        </button>
                        <button
                            onClick={onOpenAuth}
                            className="stake-btn stake-btn-green"
                            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                        >
                            Registrieren
                        </button>
                    </div>
                )}

                {/* Live Chat Toggle Button */}
                {onToggleChat && (
                    <button
                        onClick={onToggleChat}
                        title="Live Chat umschalten"
                        className="stake-btn stake-btn-secondary"
                        style={{
                            padding: '8px 14px',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            border: chatOpen ? '1px solid var(--stake-green)' : '1px solid var(--border-subtle)',
                            color: chatOpen ? 'var(--stake-green)' : 'var(--text-white)',
                            background: chatOpen ? 'rgba(0, 231, 1, 0.08)' : 'var(--bg-elevated)'
                        }}
                    >
                        <span style={{ fontSize: '1rem' }}>💬</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                background: 'var(--stake-green)',
                                display: 'inline-block',
                                boxShadow: '0 0 6px var(--stake-green)'
                            }}></span>
                            Chat
                        </span>
                    </button>
                )}
            </div>
        </header>
    );
};
