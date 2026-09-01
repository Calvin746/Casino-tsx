import React from 'react';

export type GameView = 'LOBBY' | 'SLOT3D' | 'ROULETTE3D' | 'MINES' | 'CRASH' | 'WALKTHROUGH3D' | 'PROMOTIONS' | 'ADMIN_DASHBOARD';

interface StakeSidebarProps {
    isOpen: boolean;
    activeView: GameView;
    onSelectView: (view: GameView) => void;
    onOpenPromo: (promoId?: string) => void;
    isAdmin?: boolean;
}

export const StakeSidebar: React.FC<StakeSidebarProps> = ({
    isOpen,
    activeView,
    onSelectView,
    onOpenPromo,
    isAdmin = false
}) => {
    return (
        <aside style={{
            width: isOpen ? '240px' : '72px',
            backgroundColor: 'var(--bg-card)',
            borderRight: '1px solid var(--border-subtle)',
            transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            zIndex: 90,
            flexShrink: 0
        }}>
            <div style={{ padding: '16px 10px' }}>
                {/* Section: Admin Dashboard (Only visible for Admins!) */}
                {isAdmin && (
                    <div style={{ marginBottom: '16px' }}>
                        <button
                            onClick={() => onSelectView('ADMIN_DASHBOARD')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid #f59e0b',
                                background: activeView === 'ADMIN_DASHBOARD' ? '#78350f' : 'rgba(245, 158, 11, 0.1)',
                                color: '#f59e0b',
                                fontWeight: 900,
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            <span style={{ fontSize: '1.2rem' }}>👑</span>
                            {isOpen && <span>Admin Dashboard</span>}
                        </button>
                    </div>
                )}

                {/* Section: Main Games */}
                <div style={{ marginBottom: '20px' }}>
                    {isOpen && (
                        <div style={{
                            padding: '4px 12px 8px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: 'var(--text-secondary)',
                            letterSpacing: '1px'
                        }}>
                            CASINO SPIELE
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {/* Lobby */}
                        <button
                            onClick={() => onSelectView('LOBBY')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                background: activeView === 'LOBBY' ? 'var(--bg-elevated)' : 'transparent',
                                color: activeView === 'LOBBY' ? 'var(--stake-green)' : 'var(--text-white)',
                                fontWeight: activeView === 'LOBBY' ? 700 : 500,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.15s'
                            }}
                        >
                            <span style={{ fontSize: '1.2rem', minWidth: '24px', textAlign: 'center' }}>🏠</span>
                            {isOpen && <span>Casino Lobby</span>}
                        </button>

                        {/* Royal 3D Slot */}
                        <button
                            onClick={() => onSelectView('SLOT3D')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                background: activeView === 'SLOT3D' ? 'var(--bg-elevated)' : 'transparent',
                                color: activeView === 'SLOT3D' ? 'var(--stake-green)' : 'var(--text-white)',
                                fontWeight: activeView === 'SLOT3D' ? 700 : 500,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.15s'
                            }}
                        >
                            <span style={{ fontSize: '1.2rem', minWidth: '24px', textAlign: 'center' }}>🎰</span>
                            {isOpen && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <span>Royal 3D Slot</span>
                                    <span className="stake-badge stake-badge-original">ORIGINAL</span>
                                </div>
                            )}
                        </button>

                        {/* European 3D Live Roulette */}
                        <button
                            onClick={() => onSelectView('ROULETTE3D')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                background: activeView === 'ROULETTE3D' ? 'var(--bg-elevated)' : 'transparent',
                                color: activeView === 'ROULETTE3D' ? 'var(--stake-green)' : 'var(--text-white)',
                                fontWeight: activeView === 'ROULETTE3D' ? 700 : 500,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.15s'
                            }}
                        >
                            <span style={{ fontSize: '1.2rem', minWidth: '24px', textAlign: 'center' }}>🎡</span>
                            {isOpen && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <span>3D Roulette</span>
                                    <span className="stake-badge stake-badge-vip">3D LIVE</span>
                                </div>
                            )}
                        </button>

                        {/* Mines */}
                        <button
                            onClick={() => onSelectView('MINES')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                background: activeView === 'MINES' ? 'var(--bg-elevated)' : 'transparent',
                                color: activeView === 'MINES' ? 'var(--stake-green)' : 'var(--text-white)',
                                fontWeight: activeView === 'MINES' ? 700 : 500,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.15s'
                            }}
                        >
                            <span style={{ fontSize: '1.2rem', minWidth: '24px', textAlign: 'center' }}>💣</span>
                            {isOpen && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <span>Stake Mines</span>
                                    <span className="stake-badge stake-badge-original">ORIGINAL</span>
                                </div>
                            )}
                        </button>

                        {/* Crash */}
                        <button
                            onClick={() => onSelectView('CRASH')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                background: activeView === 'CRASH' ? 'var(--bg-elevated)' : 'transparent',
                                color: activeView === 'CRASH' ? 'var(--stake-green)' : 'var(--text-white)',
                                fontWeight: activeView === 'CRASH' ? 700 : 500,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.15s'
                            }}
                        >
                            <span style={{ fontSize: '1.2rem', minWidth: '24px', textAlign: 'center' }}>🚀</span>
                            {isOpen && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <span>Stake Crash</span>
                                    <span className="stake-badge stake-badge-original">LIVE</span>
                                </div>
                            )}
                        </button>

                        {/* 3D Casino Room */}
                        <button
                            onClick={() => onSelectView('WALKTHROUGH3D')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                background: activeView === 'WALKTHROUGH3D' ? 'var(--bg-elevated)' : 'transparent',
                                color: activeView === 'WALKTHROUGH3D' ? 'var(--stake-green)' : 'var(--text-white)',
                                fontWeight: activeView === 'WALKTHROUGH3D' ? 700 : 500,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.15s'
                            }}
                        >
                            <span style={{ fontSize: '1.2rem', minWidth: '24px', textAlign: 'center' }}>🕶️</span>
                            {isOpen && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <span>3D Casino Walkthrough</span>
                                    <span className="stake-badge stake-badge-vip">3D</span>
                                </div>
                            )}
                        </button>
                    </div>
                </div>

                {/* Section: Promotions & Sponsoring */}
                <div style={{ marginBottom: '20px' }}>
                    {isOpen && (
                        <div style={{
                            padding: '4px 12px 8px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: 'var(--text-secondary)',
                            letterSpacing: '1px'
                        }}>
                            PROMOTIONS & VIP
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <button
                            onClick={() => onOpenPromo('drake')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--text-white)',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                textAlign: 'left'
                            }}
                        >
                            <span style={{ fontSize: '1.2rem', minWidth: '24px', textAlign: 'center' }}>👑</span>
                            {isOpen && <span>Drake VIP Special</span>}
                        </button>

                        <button
                            onClick={() => onOpenPromo('race')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--text-white)',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                textAlign: 'left'
                            }}
                        >
                            <span style={{ fontSize: '1.2rem', minWidth: '24px', textAlign: 'center' }}>🏎️</span>
                            {isOpen && <span>$100k Daily Race</span>}
                        </button>

                        <button
                            onClick={() => onOpenPromo('ufc')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--text-white)',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                textAlign: 'left'
                            }}
                        >
                            <span style={{ fontSize: '1.2rem', minWidth: '24px', textAlign: 'center' }}>🥊</span>
                            {isOpen && <span>UFC Partner Bonus</span>}
                        </button>
                    </div>
                </div>

                {/* Section: Sponsoring Badges in Sidebar */}
                {isOpen && (
                    <div style={{
                        background: 'var(--bg-main)',
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        marginTop: '10px'
                    }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--stake-gold)', fontWeight: 800, marginBottom: '6px' }}>
                            OFFIZIELLE PARTNER
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                            ⚡ Stake F1 Team Kick Sauber<br />
                            🥊 UFC Global Partner<br />
                            🦉 Drake Ambassador
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Support & Info */}
            <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border-subtle)' }}>
                {isOpen ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--stake-green)', fontSize: '0.8rem', fontWeight: 600 }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--stake-green)' }}></span>
                            24/7 Live Support Aktiv
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Lizenz: Curacao 8048/JAZ
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', color: 'var(--stake-green)', fontSize: '1.1rem' }}>
                        💬
                    </div>
                )}
            </div>
        </aside>
    );
};
