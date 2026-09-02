import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { getRtpSettings } from '../utils/rtpManager';

// 10 Premium Casino Symbols
const SYMBOLS = ['7️⃣', '💎', '👑', '🍒', '🔔', '⭐', '🍇', 'BAR', '⚡', '🃏'];
const SYMBOL_COLORS: Record<string, string> = {
    '7️⃣': '#ef4444',
    '💎': '#38bdf8',
    '👑': '#f59e0b',
    '🍒': '#f43f5e',
    '🔔': '#eab308',
    '⭐': '#a855f7',
    '🍇': '#8b5cf6',
    'BAR': '#dc2626',
    '⚡': '#eab308',
    '🃏': '#10b981'
};

// 20 Paylines definition for 5x3 Grid (rows 0, 1, 2 for reels 0..4)
const PAYLINES = [
    [1, 1, 1, 1, 1], // Line 1: Middle horizontal
    [0, 0, 0, 0, 0], // Line 2: Top horizontal
    [2, 2, 2, 2, 2], // Line 3: Bottom horizontal
    [0, 1, 2, 1, 0], // Line 4: V-Shape down
    [2, 1, 0, 1, 2], // Line 5: V-Shape up
    [0, 0, 1, 2, 2], // Line 6: Diagonal down
    [2, 2, 1, 0, 0], // Line 7: Diagonal up
    [1, 0, 0, 0, 1], // Line 8: Top arch
    [1, 2, 2, 2, 1], // Line 9: Bottom arch
    [1, 0, 1, 2, 1], // Line 10: Zig-Zag
];

interface VideoSlot5x3Props {
    initialBalance: number;
    onBackToLobby?: () => void;
    onUpdateBalance?: (newBalance: number) => void;
    onOpenWallet?: () => void;
}

export const SlotMachine3D: React.FC<VideoSlot5x3Props> = ({
    initialBalance,
    onBackToLobby,
    onUpdateBalance,
    onOpenWallet
}) => {
    const [balance, setBalance] = useState<number>(initialBalance || 10000);
    const [betEur, setBetEur] = useState<number>(1.00);
    const [spinning, setSpinning] = useState<boolean>(false);
    const [reelStates, setReelStates] = useState<boolean[]>([false, false, false, false, false]);
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [lastWin, setLastWin] = useState<number>(0);
    const [winningLines, setWinningLines] = useState<number[]>([]);

    // Current 5x3 Grid Symbols (5 columns, 3 rows each)
    const [grid, setGrid] = useState<string[][]>([
        ['7️⃣', '💎', '👑'],
        ['🍒', '🔔', '⭐'],
        ['🍇', 'BAR', '⚡'],
        ['💎', '7️⃣', '🍒'],
        ['👑', '⭐', '🔔']
    ]);

    const triggerWinAnimation = () => {
        const duration = 2500;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 7,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#f59e0b', '#fbbf24', '#f87171']
            });
            confetti({
                particleCount: 7,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#f59e0b', '#fbbf24', '#f87171']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    };

    // Audio Synthesizer for 5-Reel Video Slot
    const playSlotSound = (type: 'spin' | 'reelStop' | 'win' | 'bigwin') => {
        if (!soundEnabled) return;
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            if (type === 'spin') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.25, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.15);
            } else if (type === 'reelStop') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(260, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.08);
                gain.gain.setValueAtTime(0.4, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.08);
            } else if (type === 'win' || type === 'bigwin') {
                [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
                    gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.08);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.35);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(ctx.currentTime + i * 0.08);
                    osc.stop(ctx.currentTime + i * 0.08 + 0.35);
                });
            }
        } catch (e) { }
    };

    // Spin 5-Reels Video Slot
    const handleSpin = () => {
        const betCents = Math.round(betEur * 100);
        if (spinning || balance < betCents) {
            if (balance < betCents && onOpenWallet) onOpenWallet();
            return;
        }

        playSlotSound('spin');
        setSpinning(true);
        setLastWin(0);
        setWinningLines([]);

        const balAfterBet = balance - betCents;
        setBalance(balAfterBet);
        if (onUpdateBalance) onUpdateBalance(balAfterBet);

        // Start all 5 reels spinning animation
        setReelStates([true, true, true, true, true]);

        // Generate target 5x3 Grid based on Admin RTP settings
        const newGrid: string[][] = [];
        const rtpSettings = getRtpSettings();
        const winChance = rtpSettings.slotWinChance / 100;
        const isWin = Math.random() < winChance;

        if (isWin) {
            // Guarantee winning line
            const winSym = SYMBOLS[Math.floor(Math.random() * 5)];
            for (let c = 0; c < 5; c++) {
                const col = [
                    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
                    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
                    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
                ];
                if (c < 3 || Math.random() < 0.6) {
                    col[1] = winSym; // Middle line hit
                }
                newGrid.push(col);
            }
        } else {
            for (let c = 0; c < 5; c++) {
                newGrid.push([
                    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
                    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
                    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
                ]);
            }
        }

        // Staggered stop timers for each of the 5 reels
        [400, 750, 1100, 1450, 1800].forEach((delay, idx) => {
            setTimeout(() => {
                setReelStates(prev => {
                    const next = [...prev];
                    next[idx] = false;
                    return next;
                });
                playSlotSound('reelStop');

                if (idx === 4) {
                    // All 5 reels stopped
                    setGrid(newGrid);
                    setSpinning(false);

                    // Check Paylines
                    let winTotalEur = 0;
                    const hitLines: number[] = [];

                    PAYLINES.forEach((line, lineIdx) => {
                        const s0 = newGrid[0][line[0]];
                        const s1 = newGrid[1][line[1]];
                        const s2 = newGrid[2][line[2]];
                        const s3 = newGrid[3][line[3]];
                        const s4 = newGrid[4][line[4]];

                        if (s0 === s1 && s1 === s2) {
                            hitLines.push(lineIdx);
                            let mult = (s0 === '7️⃣' || s0 === '👑' || s0 === '💎') ? 12 : 5;
                            if (s2 === s3) mult *= 2.5;
                            if (s3 === s4) mult *= 4;
                            winTotalEur += (betEur / 10) * mult;
                        }
                    });

                    const winCents = Math.round(winTotalEur * 100);
                    if (winCents > 0) {
                        setLastWin(winCents);
                        setWinningLines(hitLines);
                        const isBigWin = winCents >= betCents * 5;
                        playSlotSound(isBigWin ? 'bigwin' : 'win');
                        
                        if (isBigWin) {
                            triggerBigWinAnimation();
                        } else {
                            triggerWinAnimation();
                        }
                        
                        const finalBal = balAfterBet + winCents;
                        setBalance(finalBal);
                        if (onUpdateBalance) onUpdateBalance(finalBal);
                    }
                }
            }, delay);
        });
    };

    // Auto-Spin Logic
    const [autoSpinning, setAutoSpinning] = useState<boolean>(false);
    const autoSpinningRef = useRef<boolean>(false);
    
    useEffect(() => {
        autoSpinningRef.current = autoSpinning;
    }, [autoSpinning]);

    useEffect(() => {
        if (!spinning && autoSpinningRef.current) {
            const timer = setTimeout(() => {
                if (autoSpinningRef.current) {
                    const betCents = Math.round(betEur * 100);
                    if (balance >= betCents) {
                        handleSpin();
                    } else {
                        setAutoSpinning(false);
                    }
                }
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [spinning, balance, betEur]);

    const toggleAutoSpin = () => {
        if (!autoSpinning) {
            setAutoSpinning(true);
            if (!spinning) handleSpin();
        } else {
            setAutoSpinning(false);
        }
    };

    const triggerBigWinAnimation = () => {
        const duration = 5000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 15,
                angle: 60,
                spread: 80,
                origin: { x: 0 },
                colors: ['#f59e0b', '#fbbf24', '#f87171', '#a855f7', '#38bdf8']
            });
            confetti({
                particleCount: 15,
                angle: 120,
                spread: 80,
                origin: { x: 1 },
                colors: ['#f59e0b', '#fbbf24', '#f87171', '#a855f7', '#38bdf8']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    };

    const isBigWinNow = lastWin >= Math.round(betEur * 100) * 5;

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '1520px',
            margin: '0 auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.65)',
            position: 'relative'
        }}>
            {/* BIG WIN OVERLAY */}
            {isBigWinNow && !spinning && (
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    animation: 'fadeIn 0.5s ease-out'
                }}>
                    <h1 style={{
                        fontSize: '6rem',
                        color: '#f59e0b',
                        textShadow: '0 0 30px #f59e0b, 0 0 60px #fbbf24, 0 0 90px #fff',
                        margin: 0,
                        animation: 'pulseGlow 0.8s infinite alternate',
                        fontFamily: 'var(--font-display)',
                        WebkitTextStroke: '3px #fff'
                    }}>
                        MEGA WIN!
                    </h1>
                    <div style={{
                        fontSize: '3.5rem',
                        fontWeight: 900,
                        color: '#fff',
                        textShadow: '0 0 20px #10b981',
                        marginTop: '20px'
                    }}>
                        +{(lastWin / 100).toFixed(2)} €
                    </div>
                </div>
            )}

            {/* Top Bar */}
            <header style={{
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--bg-main)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {onBackToLobby && (
                        <button
                            onClick={onBackToLobby}
                            className="stake-btn stake-btn-secondary"
                            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                        >
                            ← Zurück zur Lobby
                        </button>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.4rem' }}>🎰</span>
                        <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#f59e0b', fontWeight: 900, fontFamily: 'var(--font-display)' }}>
                            Royal 5-Reel Video Slot (20 Paylines)
                        </h2>
                        <span className="stake-badge stake-badge-original">5-WALZEN MULTI-LINE</span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        style={{
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-md)',
                            color: soundEnabled ? 'var(--stake-green)' : 'var(--text-secondary)',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        {soundEnabled ? '🔊 Sound An' : '🔇 Sound Aus'}
                    </button>

                    <div style={{ color: 'var(--stake-green)', fontWeight: 900, fontSize: '1.15rem', marginLeft: '8px' }}>
                        {(balance / 100).toFixed(2)} €
                    </div>
                </div>
            </header>

            {/* Main 5x3 Video Slot Machine Screen */}
            <div style={{
                background: 'radial-gradient(circle at center, #1e293b 0%, #030712 100%)',
                padding: '36px 24px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '540px',
                borderBottom: '1px solid var(--border-subtle)'
            }}>
                {/* Vegas Golden Cabinet Marquee */}
                <div style={{
                    background: 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #f59e0b 100%)',
                    color: '#000',
                    fontWeight: 900,
                    padding: '8px 48px',
                    borderRadius: '8px',
                    letterSpacing: '3px',
                    fontSize: '1.2rem',
                    boxShadow: '0 0 30px rgba(245, 158, 11, 0.9)',
                    border: '2px solid #fff',
                    marginBottom: '24px',
                    textAlign: 'center'
                }}>
                    ★ STAKE 5-REEL MEGA MULTI-LINE SLOT ★
                </div>

                {/* 5-Reel Cabinet Frame Container */}
                <div style={{
                    background: '#020617',
                    border: '6px solid #334155',
                    borderRadius: '16px',
                    padding: '18px',
                    boxShadow: '0 0 50px rgba(0,0,0,0.8), inset 0 0 30px rgba(0,0,0,0.9)',
                    width: '100%',
                    maxWidth: '1220px',
                    position: 'relative'
                }}>
                    {/* Paylines indicator side numbers */}
                    <div style={{
                        position: 'absolute',
                        left: '-28px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        {[1, 2, 3, 4, 5].map(n => (
                            <span key={n} style={{ background: '#f59e0b', color: '#000', fontWeight: 900, fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px' }}>
                                {n}
                            </span>
                        ))}
                    </div>

                    {/* 5-Reel Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: '12px'
                    }}>
                        {grid.map((columnSymbols, colIdx) => {
                            const isReelSpinning = reelStates[colIdx];
                            return (
                                <div
                                    key={colIdx}
                                    style={{
                                        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
                                        borderRadius: '10px',
                                        border: '2px solid var(--border-subtle)',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '10px',
                                        padding: '10px 4px',
                                        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)'
                                    }}
                                >
                                    {columnSymbols.map((symbol, rowIdx) => {
                                        // Check if this cell is part of a winning payline
                                        const isCellWinning = winningLines.some(lineIdx => PAYLINES[lineIdx][colIdx] === rowIdx);

                                        return (
                                            <div
                                                key={rowIdx}
                                                style={{
                                                    height: '115px',
                                                    borderRadius: '8px',
                                                    background: isCellWinning ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255,255,255,0.03)',
                                                    border: isCellWinning ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.06)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '4.2rem',
                                                    boxShadow: isCellWinning ? '0 0 25px rgba(245, 158, 11, 0.8)' : 'none',
                                                    animation: isReelSpinning ? 'pulse 0.1s infinite alternate' : (isCellWinning ? 'pulseGlow 1s infinite' : 'none'),
                                                    filter: isReelSpinning ? 'blur(4px)' : 'none',
                                                    transition: 'all 0.15s',
                                                    zIndex: isCellWinning ? 10 : 1,
                                                    position: 'relative'
                                                }}
                                            >
                                                {isReelSpinning ? SYMBOLS[(rowIdx + Math.floor(Math.random() * 8)) % SYMBOLS.length] : symbol}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Win Notification Banner */}
                {lastWin > 0 && !spinning && !isBigWinNow && (
                    <div style={{
                        marginTop: '24px',
                        background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                        color: '#fff',
                        fontWeight: 900,
                        padding: '12px 42px',
                        borderRadius: '30px',
                        boxShadow: '0 0 35px rgba(16, 185, 129, 0.9)',
                        fontSize: '1.4rem',
                        letterSpacing: '1px',
                        animation: 'pulseGlow 1.2s infinite ease-in-out'
                    }}>
                        🎉 20 PAYLINES GEWINN: +{(lastWin / 100).toFixed(2)} €!
                    </div>
                )}
            </div>

            {/* Bottom Dashboard Controls */}
            <footer style={{
                padding: '24px 32px',
                background: 'var(--bg-main)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '20px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Einsatz (20 Linien):</span>
                    <div style={{
                        display: 'flex',
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        overflow: 'hidden'
                    }}>
                        {[0.20, 0.50, 1.00, 2.00, 5.00, 10.00].map(val => (
                            <button
                                key={val}
                                onClick={() => setBetEur(val)}
                                disabled={spinning || autoSpinning}
                                style={{
                                    background: betEur === val ? 'var(--stake-green)' : 'transparent',
                                    color: betEur === val ? '#052205' : 'var(--text-white)',
                                    fontWeight: 800,
                                    fontSize: '0.85rem',
                                    padding: '10px 14px',
                                    border: 'none',
                                    cursor: (spinning || autoSpinning) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {val.toFixed(2)} €
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={toggleAutoSpin}
                        className={autoSpinning ? "stake-btn stake-btn-secondary" : "stake-btn stake-btn-secondary"}
                        style={{
                            padding: '16px 24px',
                            fontSize: '1.1rem',
                            fontWeight: 800,
                            border: autoSpinning ? '2px solid #ef4444' : '2px solid transparent',
                            color: autoSpinning ? '#ef4444' : '#fff'
                        }}
                    >
                        {autoSpinning ? '⏹ AUTO STOP' : '🔄 AUTO SPIN'}
                    </button>
                    
                    <button
                        onClick={handleSpin}
                        disabled={spinning || balance < Math.round(betEur * 100) || autoSpinning}
                        className="stake-btn stake-btn-green glow-green"
                        style={{
                            padding: '16px 54px',
                            fontSize: '1.2rem',
                            fontWeight: 900,
                            letterSpacing: '0.5px'
                        }}
                    >
                        {spinning ? '5 Walzen drehen...' : `5 WALZEN DREHEN (${betEur.toFixed(2)} €)`}
                    </button>
                </div>
            </footer>
        </div>
    );
};