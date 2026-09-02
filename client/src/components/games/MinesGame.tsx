import React, { useState } from 'react';
import { getRtpSettings } from '../../utils/rtpManager';

interface MinesGameProps {
    balanceCents: number;
    onUpdateBalance: (newBalance: number) => void;
    onBack: () => void;
}

type TileState = 'hidden' | 'gem' | 'mine';

export const MinesGame: React.FC<MinesGameProps> = ({ balanceCents, onUpdateBalance, onBack }) => {
    const [betEur, setBetEur] = useState<number>(1.00);
    const [mineCount, setMineCount] = useState<number>(3);
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'cashed' | 'busted'>('idle');
    const [grid, setGrid] = useState<TileState[]>(Array(25).fill('hidden'));
    const [minePositions, setMinePositions] = useState<number[]>([]);
    const [gemsRevealed, setGemsRevealed] = useState<number>(0);
    const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.00);
    const [message, setMessage] = useState<string>('');

    const rtpSettings = getRtpSettings();

    // Multiplier calculation based on combinations
    const calculateMultiplier = (gems: number, mines: number): number => {
        if (gems === 0) return 1.0;
        let mult = 0.99; // House edge 1%
        for (let i = 0; i < gems; i++) {
            mult *= (25 - i) / (25 - mines - i);
        }
        return parseFloat(mult.toFixed(2));
    };

    const startGame = () => {
        const betCents = Math.round(betEur * 100);
        if (balanceCents < betCents) {
            alert('Nicht genügend Guthaben!');
            return;
        }

        // Deduct bet
        onUpdateBalance(balanceCents - betCents);

        // Place random mines
        const positions = new Set<number>();
        while (positions.size < mineCount) {
            positions.add(Math.floor(Math.random() * 25));
        }

        setMinePositions(Array.from(positions));
        setGrid(Array(25).fill('hidden'));
        setGemsRevealed(0);
        setCurrentMultiplier(1.00);
        setGameState('playing');
        setMessage('Finde Diamanten & meide die Minen!');
    };

    const handleTileClick = (index: number) => {
        if (gameState !== 'playing' || grid[index] !== 'hidden') return;

        const currentRtp = getRtpSettings();
        let isMine = minePositions.includes(index);

        if (currentRtp.minesRiggedLoss && gemsRevealed === 0) {
            isMine = true;
        }

        if (isMine) {
            // Bust
            const newGrid = [...grid];
            // Reveal all mines
            minePositions.forEach(pos => { newGrid[pos] = 'mine'; });
            newGrid[index] = 'mine';
            setGrid(newGrid);
            setGameState('busted');
            setMessage('💥 BOOM! Auf eine Mine getreten.');
        } else {
            // Gem found
            const newGrid = [...grid];
            newGrid[index] = 'gem';
            const newGems = gemsRevealed + 1;
            setGrid(newGrid);
            setGemsRevealed(newGems);

            const nextMult = calculateMultiplier(newGems, mineCount);
            setCurrentMultiplier(nextMult);

            // If all safe tiles revealed -> auto cashout
            if (newGems === 25 - mineCount) {
                cashOut(nextMult);
            }
        }
    };

    const cashOut = (multOverride?: number) => {
        if (gameState !== 'playing' || gemsRevealed === 0) return;
        const mult = multOverride || currentMultiplier;
        const winEur = betEur * mult;
        const winCents = Math.round(winEur * 100);

        onUpdateBalance(balanceCents + winCents);

        // Reveal remaining board
        const newGrid = [...grid];
        minePositions.forEach(pos => {
            if (newGrid[pos] === 'hidden') newGrid[pos] = 'mine';
        });
        setGrid(newGrid);
        setGameState('cashed');
        setMessage(`🎉 Ausgezahlt: +${winEur.toFixed(2)} € (${mult}x)`);
    };

    const currentWinEur = (betEur * currentMultiplier).toFixed(2);
    const nextTileMult = calculateMultiplier(gemsRevealed + 1, mineCount);

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            padding: '28px',
            maxWidth: '1360px',
            margin: '0 auto'
        }}>
            {/* Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <button
                        onClick={onBack}
                        className="stake-btn stake-btn-secondary"
                        style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                    >
                        ← Zurück zur Lobby
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.4rem' }}>💣</span>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-white)', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                            Stake Mines
                        </h2>
                        <span className="stake-badge stake-badge-original">ORIGINAL</span>
                    </div>
                </div>
                <div style={{ color: 'var(--stake-green)', fontWeight: 700, fontSize: '0.9rem' }}>
                    Guthaben: {(balanceCents / 100).toFixed(2)} €
                </div>
            </div>

            {/* Game Container (Left Controls + Right Grid) */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(260px, 320px) 1fr',
                gap: '28px',
                alignItems: 'center'
            }}>
                {/* Control Panel (Stake Left Rail) */}
                <div style={{
                    background: 'var(--bg-main)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '18px'
                }}>
                    {/* Bet Amount */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                            <span>Einsatz Betrag (€)</span>
                            <span>Min: 0.10 €</span>
                        </div>
                        <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                            <input
                                type="number"
                                step="0.5"
                                min="0.10"
                                disabled={gameState === 'playing'}
                                value={betEur}
                                onChange={(e) => setBetEur(Math.max(0.1, Number(e.target.value)))}
                                style={{
                                    flex: 1,
                                    background: 'transparent',
                                    border: 'none',
                                    padding: '10px 12px',
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: '0.95rem',
                                    outline: 'none'
                                }}
                            />
                            <button
                                onClick={() => setBetEur(prev => Math.max(0.1, parseFloat((prev / 2).toFixed(2))))}
                                disabled={gameState === 'playing'}
                                style={{ background: 'transparent', border: 'none', borderLeft: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', padding: '0 10px', cursor: 'pointer', fontWeight: 700 }}
                            >
                                ½
                            </button>
                            <button
                                onClick={() => setBetEur(prev => parseFloat((prev * 2).toFixed(2)))}
                                disabled={gameState === 'playing'}
                                style={{ background: 'transparent', border: 'none', borderLeft: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', padding: '0 10px', cursor: 'pointer', fontWeight: 700 }}
                            >
                                2×
                            </button>
                        </div>
                    </div>

                    {/* Mines Count Selector */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                            <span>Anzahl Minen</span>
                            <span style={{ color: 'var(--stake-gold)', fontWeight: 700 }}>{mineCount} Minen</span>
                        </div>
                        <select
                            disabled={gameState === 'playing'}
                            value={mineCount}
                            onChange={(e) => setMineCount(Number(e.target.value))}
                            style={{
                                width: '100%',
                                background: 'var(--bg-elevated)',
                                color: '#fff',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '6px',
                                padding: '10px 12px',
                                fontWeight: 700,
                                outline: 'none',
                                cursor: gameState === 'playing' ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 10, 15, 20, 24].map(n => (
                                <option key={n} value={n}>{n} Minen (Chance: {(((25 - n) / 25) * 100).toFixed(0)}%)</option>
                            ))}
                        </select>
                    </div>

                    {/* Stats during play */}
                    {gameState === 'playing' && (
                        <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                <span>Gefundene Gems:</span>
                                <span style={{ color: 'var(--stake-green)', fontWeight: 700 }}>{gemsRevealed}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                <span>Aktueller Multiplikator:</span>
                                <span style={{ color: 'var(--stake-gold)', fontWeight: 700 }}>{currentMultiplier}x</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                <span>Nächster Gem:</span>
                                <span style={{ color: '#60a5fa', fontWeight: 700 }}>{nextTileMult}x</span>
                            </div>
                        </div>
                    )}

                    {/* Play or Cashout Button */}
                    {gameState !== 'playing' ? (
                        <button
                            onClick={startGame}
                            className="stake-btn stake-btn-green"
                            style={{ padding: '14px', fontSize: '1rem' }}
                        >
                            Wette platzieren ({betEur.toFixed(2)} €)
                        </button>
                    ) : (
                        <button
                            onClick={() => cashOut()}
                            disabled={gemsRevealed === 0}
                            className="stake-btn stake-btn-green"
                            style={{
                                padding: '14px',
                                fontSize: '1rem',
                                opacity: gemsRevealed === 0 ? 0.6 : 1,
                                cursor: gemsRevealed === 0 ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Auszahlen ({currentWinEur} €)
                        </button>
                    )}

                    {message && (
                        <div style={{
                            textAlign: 'center',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            padding: '8px',
                            borderRadius: '4px',
                            background: gameState === 'busted' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 231, 1, 0.15)',
                            color: gameState === 'busted' ? '#ef4444' : 'var(--stake-green)'
                        }}>
                            {message}
                        </div>
                    )}
                </div>

                {/* 5x5 Mine Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '14px',
                    aspectRatio: '1 / 1',
                    maxHeight: '560px',
                    margin: '0 auto',
                    width: '100%'
                }}>
                    {grid.map((tile, i) => {
                        let bg = 'var(--bg-elevated)';
                        let content = null;
                        let border = '1px solid var(--border-subtle)';

                        if (tile === 'gem') {
                            bg = 'linear-gradient(135deg, #059669 0%, #10b981 100%)';
                            content = '💎';
                            border = '1px solid var(--stake-green)';
                        } else if (tile === 'mine') {
                            bg = 'linear-gradient(135deg, #b91c1c 0%, #ef4444 100%)';
                            content = '💣';
                            border = '1px solid #ef4444';
                        } else if (rtpSettings.minesShowLocations && minePositions.includes(i) && gameState === 'playing') {
                            content = <span style={{ opacity: 0.35, filter: 'grayscale(30%)' }}>💣</span>;
                        }

                        return (
                            <button
                                key={i}
                                onClick={() => handleTileClick(i)}
                                disabled={gameState !== 'playing' || tile !== 'hidden'}
                                style={{
                                    background: bg,
                                    border,
                                    borderRadius: 'var(--radius-md)',
                                    aspectRatio: '1 / 1',
                                    fontSize: '2.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: gameState === 'playing' && tile === 'hidden' ? 'pointer' : 'default',
                                    boxShadow: tile === 'gem' ? '0 0 15px rgba(16, 185, 129, 0.4)' : (tile === 'mine' ? '0 0 15px rgba(239, 68, 68, 0.5)' : 'none'),
                                    transition: 'transform 0.15s, background 0.2s',
                                    transform: tile !== 'hidden' ? 'scale(0.96)' : 'scale(1)'
                                }}
                            >
                                {content}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
