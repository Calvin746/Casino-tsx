import React, { useState, useEffect } from 'react';

interface BetEntry {
    id: string;
    game: string;
    gameIcon: string;
    user: string;
    time: string;
    betEur: number;
    multiplier: number;
    payoutEur: number;
    isHighRoller: boolean;
}

const INITIAL_GAMES = [
    { name: 'Royal 3D Slot', icon: '🎰' },
    { name: 'Stake Mines', icon: '💣' },
    { name: 'Stake Crash', icon: '🚀' },
    { name: 'Plinko', icon: '🔴' },
    { name: 'Lightning Roulette', icon: '⚡' },
    { name: 'Sweet Bonanza', icon: '🍭' },
    { name: 'Gates of Olympus', icon: '👑' },
    { name: 'Blackjack VIP', icon: '🃏' }
];

const INITIAL_USERS = [
    'Drake🦉', 'CryptoWhale', 'Satoshi99', 'NeonRider', 'MoonBettor',
    'LuckyStrike', 'BtcBaron', 'HighRoller77', 'K***9', 'DiamondHands',
    'StakeVIP_88', 'AlphaBet', 'GoldDigger', 'SpeedyGonz'
];

export const LiveBetsTable: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'all' | 'high' | 'lucky'>('all');
    const [bets, setBets] = useState<BetEntry[]>([]);

    // Generate random bet
    const generateBet = (forceHigh: boolean = false): BetEntry => {
        const game = INITIAL_GAMES[Math.floor(Math.random() * INITIAL_GAMES.length)];
        const user = INITIAL_USERS[Math.floor(Math.random() * INITIAL_USERS.length)];
        const now = new Date();
        const time = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        let betEur: number;
        if (forceHigh || Math.random() < 0.15) {
            betEur = Math.floor(Math.random() * 4500) + 500; // 500 - 5000 €
        } else {
            betEur = parseFloat((Math.random() * 45 + 1).toFixed(2)); // 1 - 50 €
        }

        // Win or loss
        const isWin = Math.random() < 0.48;
        let multiplier = 0;
        if (isWin) {
            const rand = Math.random();
            if (rand < 0.7) {
                multiplier = parseFloat((Math.random() * 2 + 1.1).toFixed(2));
            } else if (rand < 0.95) {
                multiplier = parseFloat((Math.random() * 15 + 3).toFixed(2));
            } else {
                multiplier = parseFloat((Math.random() * 250 + 20).toFixed(2));
            }
        }

        const payoutEur = parseFloat((betEur * multiplier).toFixed(2));

        return {
            id: Math.random().toString(36).substring(2, 9),
            game: game.name,
            gameIcon: game.icon,
            user,
            time,
            betEur,
            multiplier,
            payoutEur,
            isHighRoller: betEur >= 500
        };
    };

    // Seed initial bets
    useEffect(() => {
        const initialList: BetEntry[] = [];
        for (let i = 0; i < 8; i++) {
            initialList.push(generateBet());
        }
        setBets(initialList);

        // Stream new bets periodically
        const interval = setInterval(() => {
            const newBet = generateBet();
            setBets(prev => [newBet, ...prev.slice(0, 15)]);
        }, 2200);

        return () => clearInterval(interval);
    }, []);

    // Filter bets
    const filteredBets = bets.filter(b => {
        if (activeTab === 'high') return b.isHighRoller;
        if (activeTab === 'lucky') return b.multiplier >= 10;
        return true;
    });

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            padding: '24px',
            marginTop: '36px'
        }}>
            {/* Header & Tabs */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                marginBottom: '20px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.2rem' }}>📊</span>
                    <h3 style={{ color: 'var(--text-white)', fontSize: '1.15rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)' }}>
                        Live Wetten & High Rollers
                    </h3>
                    <span className="stake-badge stake-badge-live" style={{ marginLeft: '6px' }}>
                        ● LIVE
                    </span>
                </div>

                {/* Tab Switcher */}
                <div style={{
                    display: 'flex',
                    background: 'var(--bg-main)',
                    padding: '3px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)'
                }}>
                    <button
                        onClick={() => setActiveTab('all')}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '4px',
                            border: 'none',
                            background: activeTab === 'all' ? 'var(--bg-elevated)' : 'transparent',
                            color: activeTab === 'all' ? 'var(--text-white)' : 'var(--text-secondary)',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                        }}
                    >
                        Alle Wetten
                    </button>
                    <button
                        onClick={() => setActiveTab('high')}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '4px',
                            border: 'none',
                            background: activeTab === 'high' ? 'var(--bg-elevated)' : 'transparent',
                            color: activeTab === 'high' ? 'var(--stake-gold)' : 'var(--text-secondary)',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                        }}
                    >
                        High Rollers
                    </button>
                    <button
                        onClick={() => setActiveTab('lucky')}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '4px',
                            border: 'none',
                            background: activeTab === 'lucky' ? 'var(--bg-elevated)' : 'transparent',
                            color: activeTab === 'lucky' ? 'var(--stake-green)' : 'var(--text-secondary)',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                        }}
                    >
                        Glückspilze (10x+)
                    </button>
                </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    textAlign: 'left',
                    fontSize: '0.85rem'
                }}>
                    <thead>
                        <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
                            <th style={{ padding: '12px 16px', fontWeight: 600 }}>SPIEL</th>
                            <th style={{ padding: '12px 16px', fontWeight: 600 }}>SPIELER</th>
                            <th style={{ padding: '12px 16px', fontWeight: 600 }}>ZEIT</th>
                            <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>EINSATZ</th>
                            <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>MULTIPLIKATOR</th>
                            <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>AUSZAHLUNG</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBets.map((bet) => {
                            const isWin = bet.multiplier > 0;
                            return (
                                <tr
                                    key={bet.id}
                                    style={{
                                        borderBottom: '1px solid rgba(47, 69, 83, 0.4)',
                                        transition: 'background 0.2s',
                                        backgroundColor: bet.isHighRoller ? 'rgba(245, 158, 11, 0.04)' : 'transparent'
                                    }}
                                >
                                    <td style={{ padding: '12px 16px', color: 'var(--text-white)', fontWeight: 600 }}>
                                        <span style={{ marginRight: '8px' }}>{bet.gameIcon}</span>
                                        {bet.game}
                                    </td>
                                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>
                                        {bet.user.includes('Drake') ? (
                                            <span style={{ color: 'var(--stake-gold)', fontWeight: 800 }}>{bet.user}</span>
                                        ) : (
                                            bet.user
                                        )}
                                    </td>
                                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                        {bet.time}
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-white)', fontWeight: 600 }}>
                                        {bet.betEur.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                        <span style={{
                                            padding: '3px 8px',
                                            borderRadius: '4px',
                                            fontWeight: 700,
                                            fontSize: '0.78rem',
                                            background: isWin ? (bet.multiplier >= 10 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(0, 231, 1, 0.12)') : 'rgba(255,255,255,0.05)',
                                            color: isWin ? (bet.multiplier >= 10 ? 'var(--stake-gold)' : 'var(--stake-green)') : 'var(--text-secondary)'
                                        }}>
                                            {bet.multiplier.toFixed(2)}x
                                        </span>
                                    </td>
                                    <td style={{
                                        padding: '12px 16px',
                                        textAlign: 'right',
                                        fontWeight: 700,
                                        color: isWin ? 'var(--stake-green)' : 'var(--text-secondary)'
                                    }}>
                                        {isWin ? `+${bet.payoutEur.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €` : '0,00 €'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
