import React from 'react';

interface BottomAdBannerProps {
    onOpenDeposit: () => void;
    onSelectPromo: (type: string) => void;
}

export const BottomAdBanner: React.FC<BottomAdBannerProps> = ({ onOpenDeposit, onSelectPromo }) => {
    return (
        <div style={{ marginTop: '48px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* 1. Large Sponsorship / Real Ad Banners (Three Columns) */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '20px'
            }}>
                {/* Banner 1: Drake VIP */}
                <div style={{
                    background: 'linear-gradient(135deg, #1c1917 0%, #292524 50%, #1c1917 100%)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
                }}>
                    <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '90px', opacity: 0.12, pointerEvents: 'none' }}>
                        🦉
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                            <span className="stake-badge stake-badge-vip">AMBASSADOR</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--stake-gold)', fontWeight: 700 }}>DRAKE x STAKE</span>
                        </div>
                        <h3 style={{ fontSize: '1.25rem', color: 'var(--text-white)', fontWeight: 800, marginBottom: '8px', fontFamily: 'var(--font-display)' }}>
                            Exklusive Drake Roulette Streams
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: '#a8a29e', lineHeight: 1.5, marginBottom: '18px' }}>
                            Erlebe weltweite Livestreams mit Drake. Über $1.000.000 an Community-Drops direkt während der Shows!
                        </p>
                    </div>
                    <button
                        onClick={() => onSelectPromo('drake')}
                        className="stake-btn"
                        style={{
                            background: 'var(--stake-gold)',
                            color: '#1a1003',
                            fontWeight: 800,
                            alignSelf: 'flex-start',
                            boxShadow: '0 4px 12px var(--stake-gold-glow)'
                        }}
                    >
                        Drake VIP Programm →
                    </button>
                </div>

                {/* Banner 2: F1 Sauber & UFC */}
                <div style={{
                    background: 'linear-gradient(135deg, #062a1c 0%, #064e3b 50%, #032014 100%)',
                    border: '1px solid rgba(0, 231, 1, 0.3)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
                }}>
                    <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '90px', opacity: 0.12, pointerEvents: 'none' }}>
                        🏎️
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                            <span className="stake-badge stake-badge-original">OFFIZIELLER PARTNER</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--stake-green)', fontWeight: 700 }}>STAKE F1 TEAM</span>
                        </div>
                        <h3 style={{ fontSize: '1.25rem', color: 'var(--text-white)', fontWeight: 800, marginBottom: '8px', fontFamily: 'var(--font-display)' }}>
                            KICK Sauber F1 & UFC Sponsorship
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: '#a7f3d0', lineHeight: 1.5, marginBottom: '18px' }}>
                            Offizieller Hauptsponsor des Formel 1 Teams & weltweiter Partner der UFC. Wette auf die echten Champions.
                        </p>
                    </div>
                    <button
                        onClick={() => onSelectPromo('f1')}
                        className="stake-btn stake-btn-green"
                        style={{ alignSelf: 'flex-start' }}
                    >
                        Sponsoring Boni ansehen →
                    </button>
                </div>

                {/* Banner 3: Instant Crypto Banking */}
                <div style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
                }}>
                    <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '90px', opacity: 0.12, pointerEvents: 'none' }}>
                        🪙
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                            <span className="stake-badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
                                0% GEBÜHREN
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 700 }}>SOFORT-KASSE</span>
                        </div>
                        <h3 style={{ fontSize: '1.25rem', color: 'var(--text-white)', fontWeight: 800, marginBottom: '8px', fontFamily: 'var(--font-display)' }}>
                            Krypto & Fiat Sofort-Einzahlungen
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '18px' }}>
                            Ein- & Auszahlungen in Sekundenschnelle via Bitcoin, Ethereum, USDT, Litecoin sowie Apple Pay & Kreditkarte.
                        </p>
                    </div>
                    <button
                        onClick={onOpenDeposit}
                        className="stake-btn stake-btn-secondary"
                        style={{ alignSelf: 'flex-start' }}
                    >
                        Kasse öffnen →
                    </button>
                </div>
            </div>

            {/* 2. Official Partner Bar with Real Logos / Badges */}
            <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px 32px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '24px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '1px' }}>
                        OFFIZIELLE PARTNER & SPONSOREN:
                    </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '28px' }}>
                    {/* UFC Partner */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-white)', fontWeight: 800, fontSize: '0.95rem' }}>
                        <span style={{ color: '#ef4444', fontSize: '1.2rem', fontWeight: 900 }}>UFC</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>OFFICIAL GLOBAL PARTNER</span>
                    </div>

                    {/* Stake F1 Team */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-white)', fontWeight: 800, fontSize: '0.95rem' }}>
                        <span style={{ color: 'var(--stake-green)', fontSize: '1.2rem', fontWeight: 900 }}>KICK</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>SAUBER F1 TEAM</span>
                    </div>

                    {/* Drake */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-white)', fontWeight: 800, fontSize: '0.95rem' }}>
                        <span style={{ color: 'var(--stake-gold)', fontSize: '1.1rem' }}>🦉 DRAKE</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>VIP AMBASSADOR</span>
                    </div>

                    {/* Everton FC */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-white)', fontWeight: 800, fontSize: '0.95rem' }}>
                        <span style={{ color: '#38bdf8', fontSize: '1.1rem' }}>⚽ EVERTON FC</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>MAIN CLUB PARTNER</span>
                    </div>
                </div>
            </div>

            {/* 3. Real Casino Footer with Licensing, Provably Fair, 18+ & Links */}
            <footer style={{
                background: 'var(--bg-card)',
                borderTop: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                padding: '40px 32px 24px',
                marginTop: '16px'
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '32px',
                    marginBottom: '36px'
                }}>
                    <div>
                        <h4 style={{ color: 'var(--text-white)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px' }}>
                            Casino Spiele
                        </h4>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                            <li style={{ cursor: 'pointer', color: 'var(--text-primary)' }}>Stake Originals (Mines, Crash, 3D Slot)</li>
                            <li style={{ cursor: 'pointer', color: 'var(--text-primary)' }}>Spielautomaten & Megaways</li>
                            <li style={{ cursor: 'pointer', color: 'var(--text-primary)' }}>Live Roulette & Blackjack</li>
                            <li style={{ cursor: 'pointer', color: 'var(--text-primary)' }}>Feature Buy & Jackpots</li>
                            <li style={{ cursor: 'pointer', color: 'var(--text-primary)' }}>3D Casino Lounge</li>
                        </ul>
                    </div>

                    <div>
                        <h4 style={{ color: 'var(--text-white)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px' }}>
                            Sportwetten
                        </h4>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                            <li style={{ cursor: 'pointer', color: 'var(--text-primary)' }}>Fußball (Champions League, Bundesliga)</li>
                            <li style={{ cursor: 'pointer', color: 'var(--text-primary)' }}>Formel 1 Rennsport (Stake F1 Team)</li>
                            <li style={{ cursor: 'pointer', color: 'var(--text-primary)' }}>MMA & UFC Fight Night</li>
                            <li style={{ cursor: 'pointer', color: 'var(--text-primary)' }}>Basketball (NBA) & Tennis</li>
                            <li style={{ cursor: 'pointer', color: 'var(--text-primary)' }}>Live-Wetten & Quoten-Boost</li>
                        </ul>
                    </div>

                    <div>
                        <h4 style={{ color: 'var(--text-white)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px' }}>
                            Aktionen & VIP
                        </h4>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                            <li style={{ cursor: 'pointer', color: 'var(--text-primary)' }}>$100.000 Tägliches Rennen</li>
                            <li style={{ cursor: 'pointer', color: 'var(--text-primary)' }}>Drake Roulette Giveaway</li>
                            <li style={{ cursor: 'pointer', color: 'var(--text-primary)' }}>Stake VIP Club & Rakeback</li>
                            <li style={{ cursor: 'pointer', color: 'var(--text-primary)' }}>Wöchentliche $75.000 Verlosung</li>
                            <li style={{ cursor: 'pointer', color: 'var(--text-primary)' }}>Affiliate & Partnerprogramm</li>
                        </ul>
                    </div>

                    <div>
                        <h4 style={{ color: 'var(--text-white)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px' }}>
                            Sicherheit & Support
                        </h4>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                            <li style={{ cursor: 'pointer', color: 'var(--stake-green)', fontWeight: 600 }}>● 24/7 Live Support (Chat)</li>
                            <li style={{ cursor: 'pointer', color: 'var(--text-primary)' }}>Provably Fair Verifikation</li>
                            <li style={{ cursor: 'pointer', color: 'var(--text-primary)' }}>Verantwortungsvolles Spielen</li>
                            <li style={{ cursor: 'pointer', color: 'var(--text-primary)' }}>Datenschutz & AGB</li>
                            <li style={{ cursor: 'pointer', color: 'var(--text-primary)' }}>Anti-Geldwäsche (AML) & KYC</li>
                        </ul>
                    </div>
                </div>

                {/* Trust & License Badges */}
                <div style={{
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '24px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '20px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {/* 18+ */}
                        <div style={{
                            border: '2px solid #ef4444',
                            color: '#ef4444',
                            fontWeight: 900,
                            borderRadius: '50%',
                            width: '38px',
                            height: '38px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.85rem'
                        }}>
                            18+
                        </div>

                        {/* BeGambleAware */}
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-white)' }}>BeGambleAware.org</span>
                            <br />
                            Glücksspiel kann süchtig machen. Spiele verantwortungsvoll.
                        </div>
                    </div>

                    {/* Curacao License & Crypto Foundation */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                            background: 'var(--bg-main)',
                            border: '1px solid var(--border-subtle)',
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)'
                        }}>
                            🛡️ <strong style={{ color: 'var(--text-white)' }}>Curacao eGaming</strong> Licensed • No. 8048/JAZ
                        </div>
                        <div style={{
                            background: 'var(--bg-main)',
                            border: '1px solid var(--border-subtle)',
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.75rem',
                            color: 'var(--stake-green)'
                        }}>
                            ✓ <strong style={{ color: 'var(--text-white)' }}>Provably Fair</strong> Cryptographic Audit
                        </div>
                    </div>
                </div>

                {/* Bottom Copyright & Live Stats */}
                <div style={{
                    marginTop: '20px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)'
                }}>
                    <div>
                        © 2026 ROYAL STAKE CASINO. Alle Rechte vorbehalten. Offizieller Partner von UFC und Stake F1 Team Kick Sauber.
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--stake-green)', fontWeight: 600 }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--stake-green)', display: 'inline-block' }}></span>
                        28.419 Spieler gerade online
                    </div>
                </div>
            </footer>
        </div>
    );
};
