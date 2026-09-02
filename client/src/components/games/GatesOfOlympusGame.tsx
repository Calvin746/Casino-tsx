import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';

interface GatesGameProps {
    balanceCents: number;
    onUpdateBalance: (newBalance: number) => void;
    onBack: () => void;
}

interface SymbolDef {
    id: string;
    label: string;
    icon: string;
    payout8: number;  // 8-9 symbols
    payout10: number; // 10-11 symbols
    payout12: number; // 12+ symbols
    color: string;
}

const SYMBOLS: SymbolDef[] = [
    { id: 'crown', label: 'Krone', icon: '👑', payout8: 10, payout10: 25, payout12: 50, color: '#f59e0b' },
    { id: 'hourglass', label: 'Sanduhr', icon: '⏳', payout8: 2.5, payout10: 10, payout12: 25, color: '#06b6d4' },
    { id: 'ring', label: 'Ring', icon: '💍', payout8: 2, payout10: 5, payout12: 15, color: '#ec4899' },
    { id: 'chalice', label: 'Kelch', icon: '🏆', payout8: 1.5, payout10: 2, payout12: 12, color: '#eab308' },
    { id: 'red_gem', label: 'Roter Rubin', icon: '🔴', payout8: 1, payout10: 1.5, payout12: 10, color: '#ef4444' },
    { id: 'purple_gem', label: 'Amethyst', icon: '🟣', payout8: 0.8, payout10: 1.2, payout12: 8, color: '#a855f7' },
    { id: 'yellow_gem', label: 'Topas', icon: '🟡', payout8: 0.5, payout10: 1, payout12: 5, color: '#eab308' },
    { id: 'green_gem', label: 'Smaragd', icon: '🟢', payout8: 0.4, payout10: 0.9, payout12: 4, color: '#10b981' },
    { id: 'blue_gem', label: 'Saphir', icon: '🔷', payout8: 0.25, payout10: 0.75, payout12: 2, color: '#3b82f6' }
];

const SCATTER = { id: 'zeus', icon: '⚡', label: 'Zeus Scatter' };

export const GatesOfOlympusGame: React.FC<GatesGameProps> = ({ balanceCents, onUpdateBalance, onBack }) => {
    const [betEur, setBetEur] = useState<number>(1.00);
    const [grid, setGrid] = useState<string[][]>(() => generateInitialGrid());
    const [spinning, setSpinning] = useState<boolean>(false);
    const [multiplierOrbs, setMultiplierOrbs] = useState<{ row: number; col: number; mult: number }[]>([]);
    const [totalMultiplier, setTotalMultiplier] = useState<number>(1);
    const [freeSpinsRemaining, setFreeSpinsRemaining] = useState<number>(0);
    const [globalFreeSpinsMultiplier, setGlobalFreeSpinsMultiplier] = useState<number>(1);
    const [winMessage, setWinMessage] = useState<string>('Drehe die Walzen und empfange Zeus Segen!');
    const [lastWinEur, setLastWinEur] = useState<number>(0);
    const [winningSymbolIds, setWinningSymbolIds] = useState<Set<string>>(new Set());

    function getRandomSymbol(): string {
        const rand = Math.random();
        if (rand < 0.035) return 'zeus';
        const regularIndex = Math.floor(Math.random() * SYMBOLS.length);
        return SYMBOLS[regularIndex].id;
    }

    function generateInitialGrid(): string[][] {
        const newGrid: string[][] = [];
        for (let r = 0; r < 5; r++) {
            const row: string[] = [];
            for (let c = 0; c < 6; c++) {
                row.push(getRandomSymbol());
            }
            newGrid.push(row);
        }
        return newGrid;
    }

    // Audio effects
    const playAudio = (type: 'spin' | 'thunder' | 'win') => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            if (type === 'spin') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.3);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                osc.connect(gain); gain.connect(ctx.destination);
                osc.start(); osc.stop(ctx.currentTime + 0.3);
            } else if (type === 'thunder') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.6);
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
                osc.connect(gain); gain.connect(ctx.destination);
                osc.start(); osc.stop(ctx.currentTime + 0.6);
            } else if (type === 'win') {
                [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(f, ctx.currentTime + idx * 0.08);
                    gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.08);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.08 + 0.3);
                    osc.connect(gain); gain.connect(ctx.destination);
                    osc.start(ctx.currentTime + idx * 0.08);
                    osc.stop(ctx.currentTime + idx * 0.08 + 0.3);
                });
            }
        } catch {}
    };

    const handleSpin = () => {
        if (spinning) return;
        const betCents = Math.round(betEur * 100);
        let currentBalance = balanceCents;

        if (freeSpinsRemaining === 0) {
            if (currentBalance < betCents) {
                alert('Nicht genügend Guthaben!');
                return;
            }
            currentBalance -= betCents;
            onUpdateBalance(currentBalance);
        } else {
            setFreeSpinsRemaining(prev => prev - 1);
        }

        setSpinning(true);
        setLastWinEur(0);
        setWinningSymbolIds(new Set());
        playAudio('spin');

        // Roll new grid
        setTimeout(() => {
            const freshGrid = generateInitialGrid();
            setGrid(freshGrid);

            // Zeus Multiplier Orb Chance (15% in base game, 45% in Free Spins)
            const orbs: { row: number; col: number; mult: number }[] = [];
            const orbChance = freeSpinsRemaining > 0 ? 0.45 : 0.20;
            if (Math.random() < orbChance) {
                playAudio('thunder');
                const possibleMults = [2, 3, 5, 8, 10, 15, 25, 50, 100, 250, 500];
                const orbCount = Math.random() < 0.25 ? 2 : 1;
                for (let i = 0; i < orbCount; i++) {
                    const chosen = possibleMults[Math.floor(Math.random() * possibleMults.length)];
                    const r = Math.floor(Math.random() * 5);
                    const c = Math.floor(Math.random() * 6);
                    orbs.push({ row: r, col: c, mult: chosen });
                }
            }
            setMultiplierOrbs(orbs);

            // Calculate Counts & Scatter Pays (8+ matching)
            const counts: Record<string, number> = {};
            for (let r = 0; r < 5; r++) {
                for (let c = 0; c < 6; c++) {
                    const s = freshGrid[r][c];
                    counts[s] = (counts[s] || 0) + 1;
                }
            }

            let baseWinEur = 0;
            const winIds = new Set<string>();

            SYMBOLS.forEach(sym => {
                const count = counts[sym.id] || 0;
                if (count >= 8) {
                    winIds.add(sym.id);
                    if (count >= 12) baseWinEur += sym.payout12 * betEur;
                    else if (count >= 10) baseWinEur += sym.payout10 * betEur;
                    else baseWinEur += sym.payout8 * betEur;
                }
            });

            // Check Zeus Scatters for Free Spins (4+ scatters)
            const scatterCount = counts['zeus'] || 0;
            let triggeredFreeSpins = false;
            // Use function setter for free spins so it works inside the closure without stale values
            if (scatterCount >= 4) {
                triggeredFreeSpins = true;
                baseWinEur += scatterCount * 3 * betEur;
                setFreeSpinsRemaining(prev => prev + 15);
            }

            // Sum Multiplier Orbs
            const orbSum = orbs.reduce((acc, curr) => acc + curr.mult, 0);
            let finalMult = orbSum > 0 ? orbSum : 1;

            if (freeSpinsRemaining > 0 && orbSum > 0) {
                setGlobalFreeSpinsMultiplier(prev => prev + orbSum);
                finalMult = globalFreeSpinsMultiplier + orbSum;
            }

            setTotalMultiplier(finalMult);
            setWinningSymbolIds(winIds);

            const totalWinEur = baseWinEur * finalMult;
            const winCents = Math.round(totalWinEur * 100);

            if (winCents > 0) {
                currentBalance += winCents;
                onUpdateBalance(currentBalance);
                setLastWinEur(totalWinEur);
                playAudio('win');

                if (totalWinEur >= betEur * 10) {
                    confetti({ particleCount: 30, spread: 80, origin: { y: 0.6 } });
                    setWinMessage(`⚡ ZEUS MEGA-GEWINN: +${totalWinEur.toFixed(2)} € (Multiplikator: ${finalMult}×)!`);
                } else {
                    setWinMessage(`🎉 Gewinn: +${totalWinEur.toFixed(2)} € (mit ${finalMult}× Multiplikator)!`);
                }
            } else if (triggeredFreeSpins) {
                setWinMessage(`⚡ 4+ ZEUS SCATTER! 15 FREISPIELE GEWONNEN!`);
                confetti({ particleCount: 50, spread: 100 });
            } else {
                setWinMessage('Kein Gewinn. Zeus lädt den Blitz für die nächste Runde auf!');
            }

            setSpinning(false);
        }, 800);
    };

    return (
        <div style={{
            background: 'radial-gradient(ellipse at center, #2e1065 0%, #0f0728 100%)',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid #a855f7',
            padding: '24px',
            maxWidth: '1240px',
            margin: '0 auto',
            boxShadow: '0 0 50px rgba(168, 85, 247, 0.3)',
            position: 'relative',
            color: '#fff'
        }}>
            {/* Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <button onClick={onBack} className="stake-btn stake-btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                        ← Lobby
                    </button>
                    <span style={{ fontSize: '1.8rem' }}>⚡</span>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#fbbf24', fontFamily: 'var(--font-display)', fontWeight: 900, textShadow: '0 0 12px #f59e0b' }}>
                            Gates of Olympus 1000
                        </h2>
                        <span style={{ fontSize: '0.75rem', color: '#c084fc' }}>
                            Pragmatic Play &bull; Scatter Pays 8+ &bull; Multiplikatoren bis 1000×
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {freeSpinsRemaining > 0 && (
                        <div style={{
                            background: 'linear-gradient(135deg, #7e22ce, #a855f7)',
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontWeight: 900,
                            fontSize: '0.85rem',
                            border: '1px solid #fbbf24',
                            boxShadow: '0 0 15px #a855f7'
                        }}>
                            ✨ FREISPIELE: {freeSpinsRemaining} (Multiplikator: {globalFreeSpinsMultiplier}×)
                        </div>
                    )}
                    <div style={{ color: 'var(--stake-green)', fontWeight: 900, fontSize: '1.2rem' }}>
                        {(balanceCents / 100).toFixed(2)} €
                    </div>
                </div>
            </div>

            {/* Main Stage: 6x5 Grid + Zeus Character Pillar */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 240px',
                gap: '24px',
                background: 'rgba(15, 7, 40, 0.85)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                border: '1px solid rgba(168, 85, 247, 0.3)'
            }}>
                {/* 6x5 Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gridTemplateRows: 'repeat(5, 72px)',
                    gap: '8px',
                    background: 'rgba(23, 10, 60, 0.95)',
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    border: '2px solid rgba(251, 191, 36, 0.4)',
                    boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)'
                }}>
                    {grid.map((row, rIdx) =>
                        row.map((symId, cIdx) => {
                            const isWinning = winningSymbolIds.has(symId);
                            const symObj = SYMBOLS.find(s => s.id === symId) || SCATTER;
                            const orbOnPos = multiplierOrbs.find(o => o.row === rIdx && o.col === cIdx);

                            return (
                                <div
                                    key={`${rIdx}-${cIdx}`}
                                    style={{
                                        background: isWinning ? 'rgba(251, 191, 36, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                                        border: isWinning ? '2px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.08)',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'relative',
                                        transform: isWinning ? 'scale(1.06)' : 'scale(1)',
                                        transition: 'all 0.2s',
                                        boxShadow: isWinning ? '0 0 15px #f59e0b' : 'none'
                                    }}
                                >
                                    <span style={{ fontSize: '2.2rem' }}>{symObj.icon}</span>
                                    {orbOnPos && (
                                        <div style={{
                                            position: 'absolute',
                                            top: -6,
                                            right: -6,
                                            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                                            color: '#fff',
                                            fontWeight: 900,
                                            fontSize: '0.75rem',
                                            padding: '2px 6px',
                                            borderRadius: '12px',
                                            boxShadow: '0 0 10px #f59e0b',
                                            animation: 'pulseGlow 0.6s infinite alternate'
                                        }}>
                                            {orbOnPos.mult}×
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Right Zeus Column & Status */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(30, 15, 80, 0.6)',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '4.5rem', animation: 'float 3s infinite ease-in-out' }}>
                        ⚡
                    </div>
                    <div>
                        <h3 style={{ margin: '0 0 8px', color: '#fbbf24', fontSize: '1.2rem', fontWeight: 900 }}>
                            ZEUS
                        </h3>
                        <p style={{ fontSize: '0.78rem', color: '#c084fc', margin: 0 }}>
                            Blitze schleudern zufällige Multiplikator-Kugeln (bis zu 1000×) auf das Spielfeld!
                        </p>
                    </div>

                    {totalMultiplier > 1 && (
                        <div style={{
                            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                            color: '#fff',
                            fontWeight: 900,
                            padding: '10px 20px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '1.3rem',
                            boxShadow: '0 0 20px #f59e0b'
                        }}>
                            {totalMultiplier}× MULTI
                        </div>
                    )}
                </div>
            </div>

            {/* Status Message */}
            <div style={{
                textAlign: 'center',
                margin: '18px 0',
                fontWeight: 800,
                fontSize: '1.05rem',
                color: lastWinEur > 0 ? 'var(--stake-green)' : 'var(--text-white)'
            }}>
                {winMessage}
            </div>

            {/* Controls */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(15, 7, 40, 0.8)',
                padding: '16px 20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Einsatz:</span>
                    {[0.5, 1, 2, 5, 10, 25].map(v => (
                        <button
                            key={v}
                            onClick={() => setBetEur(v)}
                            disabled={spinning || freeSpinsRemaining > 0}
                            style={{
                                padding: '8px 14px',
                                borderRadius: 'var(--radius-sm)',
                                border: betEur === v ? '2px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.1)',
                                background: betEur === v ? 'var(--bg-elevated)' : 'transparent',
                                color: betEur === v ? '#fbbf24' : '#fff',
                                fontWeight: 800,
                                cursor: 'pointer'
                            }}
                        >
                            {v}€
                        </button>
                    ))}
                </div>

                <button
                    onClick={handleSpin}
                    disabled={spinning}
                    className="stake-btn stake-btn-green glow-green"
                    style={{
                        padding: '14px 44px',
                        fontSize: '1.15rem',
                        fontWeight: 900,
                        letterSpacing: '1px'
                    }}
                >
                    {spinning ? 'BLITZE ZUCKEN...' : freeSpinsRemaining > 0 ? `FREISPIEL (${freeSpinsRemaining})` : 'DREHEN'}
                </button>
            </div>
        </div>
    );
};
