import React, { useState } from 'react';
import { GameView } from '../layout/StakeSidebar';

interface GameItem {
    id: string;
    title: string;
    category: 'originals' | 'slots' | 'live';
    provider: string;
    view?: GameView;
    imageBg: string;
    icon: string;
    players: string;
    badge?: string;
    badgeColor?: string;
}

const CASINO_GAMES: GameItem[] = [
    {
        id: 'slot3d',
        title: 'Royal 3D Slot',
        category: 'originals',
        provider: 'Stake Originals',
        view: 'SLOT3D',
        imageBg: 'linear-gradient(135deg, #451a03 0%, #78350f 50%, #b45309 100%)',
        icon: '🎰',
        players: '3.492',
        badge: '3D LIVE',
        badgeColor: 'var(--stake-gold)'
    },
    {
        id: 'mines',
        title: 'Stake Mines',
        category: 'originals',
        provider: 'Stake Originals',
        view: 'MINES',
        imageBg: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #047857 100%)',
        icon: '💣',
        players: '5.120',
        badge: 'ORIGINAL',
        badgeColor: 'var(--stake-green)'
    },
    {
        id: 'crash',
        title: 'Stake Crash',
        category: 'originals',
        provider: 'Stake Originals',
        view: 'CRASH',
        imageBg: 'linear-gradient(135deg, #172554 0%, #1e3a8a 50%, #2563eb 100%)',
        icon: '🚀',
        players: '4.890',
        badge: 'HOT',
        badgeColor: '#ef4444'
    },
    {
        id: 'lobby3d',
        title: '3D Casino Lounge',
        category: 'originals',
        provider: 'Stake Originals',
        view: 'WALKTHROUGH3D',
        imageBg: 'linear-gradient(135deg, #311042 0%, #581c87 50%, #7e22ce 100%)',
        icon: '🕶️',
        players: '1.204',
        badge: 'INTERACTIVE',
        badgeColor: '#c084fc'
    },
    {
        id: 'gates',
        title: 'Gates of Olympus 1000',
        category: 'slots',
        provider: 'Pragmatic Play',
        view: 'SLOT3D',
        imageBg: 'linear-gradient(135deg, #4a044e 0%, #701a75 50%, #a21caf 100%)',
        icon: '⚡',
        players: '8.431',
        badge: '1000x',
        badgeColor: 'var(--stake-gold)'
    },
    {
        id: 'bonanza',
        title: 'Sweet Bonanza',
        category: 'slots',
        provider: 'Pragmatic Play',
        view: 'SLOT3D',
        imageBg: 'linear-gradient(135deg, #831843 0%, #be185d 50%, #db2777 100%)',
        icon: '🍭',
        players: '6.712'
    },
    {
        id: 'wanted',
        title: 'Wanted Dead or a Wild',
        category: 'slots',
        provider: 'Hacksaw Gaming',
        view: 'SLOT3D',
        imageBg: 'linear-gradient(135deg, #292524 0%, #44403c 50%, #78716c 100%)',
        icon: '🤠',
        players: '4.329',
        badge: 'VS',
        badgeColor: '#ef4444'
    },
    {
        id: 'roulette',
        title: 'Lightning Roulette Live',
        category: 'live',
        provider: 'Evolution Gaming',
        view: 'WALKTHROUGH3D',
        imageBg: 'linear-gradient(135deg, #713f12 0%, #a16207 50%, #ca8a04 100%)',
        icon: '🎡',
        players: '5.928',
        badge: '500x MULTI',
        badgeColor: 'var(--stake-gold)'
    },
    {
        id: 'blackjack',
        title: 'Stake Exclusive VIP Blackjack',
        category: 'live',
        provider: 'Evolution Gaming',
        view: 'WALKTHROUGH3D',
        imageBg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        icon: '🃏',
        players: '2.180',
        badge: 'VIP',
        badgeColor: 'var(--stake-green)'
    }
];

interface GameGridProps {
    onSelectGame: (view: GameView) => void;
    searchQuery: string;
}

export const GameGrid: React.FC<GameGridProps> = ({ onSelectGame, searchQuery }) => {
    const [selectedCategory, setSelectedCategory] = useState<'all' | 'originals' | 'slots' | 'live'>('all');

    const filteredGames = CASINO_GAMES.filter(g => {
        const matchesCategory = selectedCategory === 'all' || g.category === selectedCategory;
        const matchesSearch = searchQuery === '' || 
            g.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            g.provider.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div>
            {/* Category Filter Bar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '24px'
            }}>
                <div style={{
                    display: 'flex',
                    background: 'var(--bg-card)',
                    padding: '4px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    gap: '4px'
                }}>
                    <button
                        onClick={() => setSelectedCategory('all')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: selectedCategory === 'all' ? 'var(--bg-elevated)' : 'transparent',
                            color: selectedCategory === 'all' ? 'var(--text-white)' : 'var(--text-secondary)',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                    >
                        Alle Spiele ({CASINO_GAMES.length})
                    </button>
                    <button
                        onClick={() => setSelectedCategory('originals')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: selectedCategory === 'originals' ? 'var(--bg-elevated)' : 'transparent',
                            color: selectedCategory === 'originals' ? 'var(--stake-green)' : 'var(--text-secondary)',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                    >
                        Stake Originals
                    </button>
                    <button
                        onClick={() => setSelectedCategory('slots')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: selectedCategory === 'slots' ? 'var(--bg-elevated)' : 'transparent',
                            color: selectedCategory === 'slots' ? 'var(--text-white)' : 'var(--text-secondary)',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                    >
                        Spielautomaten
                    </button>
                    <button
                        onClick={() => setSelectedCategory('live')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: selectedCategory === 'live' ? 'var(--bg-elevated)' : 'transparent',
                            color: selectedCategory === 'live' ? 'var(--text-white)' : 'var(--text-secondary)',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                    >
                        Live Casino
                    </button>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Zeige {filteredGames.length} von {CASINO_GAMES.length} Spielen
                </div>
            </div>

            {/* Games Grid Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '18px'
            }}>
                {filteredGames.map((game) => (
                    <div
                        key={game.id}
                        onClick={() => game.view && onSelectGame(game.view)}
                        style={{
                            background: 'var(--bg-card)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border-subtle)',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s, border-color 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-6px)';
                            e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.5)';
                            e.currentTarget.style.borderColor = 'var(--border-strong)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        }}
                    >
                        {/* Card Image Stage */}
                        <div style={{
                            background: game.imageBg,
                            height: '150px',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden'
                        }}>
                            <span style={{ fontSize: '4.5rem', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.4))' }}>
                                {game.icon}
                            </span>

                            {/* Badge */}
                            {game.badge && (
                                <div style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '10px',
                                    background: 'rgba(0,0,0,0.7)',
                                    color: game.badgeColor || '#fff',
                                    border: `1px solid ${game.badgeColor || 'rgba(255,255,255,0.3)'}`,
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.68rem',
                                    fontWeight: 800,
                                    letterSpacing: '0.5px'
                                }}>
                                    {game.badge}
                                </div>
                            )}

                            {/* Live players pill */}
                            <div style={{
                                position: 'absolute',
                                bottom: '8px',
                                left: '10px',
                                background: 'rgba(0,0,0,0.6)',
                                backdropFilter: 'blur(4px)',
                                color: '#cbd5e1',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--stake-green)' }}></span>
                                {game.players} online
                            </div>
                        </div>

                        {/* Card Details Footer */}
                        <div style={{ padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h4 style={{
                                    margin: '0 0 2px 0',
                                    color: 'var(--text-white)',
                                    fontSize: '0.95rem',
                                    fontWeight: 700,
                                    fontFamily: 'var(--font-display)'
                                }}>
                                    {game.title}
                                </h4>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    {game.provider}
                                </span>
                            </div>

                            <button
                                style={{
                                    background: 'var(--bg-elevated)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--stake-green)',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                }}
                            >
                                ▶
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
