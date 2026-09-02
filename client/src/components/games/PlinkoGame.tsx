import React, { useState, useRef, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';

interface PlinkoGameProps {
    balanceCents: number;
    onUpdateBalance: (newBalance: number | ((prev: number) => number)) => void;
    onBack: () => void;
}

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

// Stake standard Plinko multiplier tables based on rows and risk
const MULTIPLIERS: Record<number, Record<RiskLevel, number[]>> = {
    8: {
        LOW: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
        MEDIUM: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
        HIGH: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29]
    },
    10: {
        LOW: [8.9, 3, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 3, 8.9],
        MEDIUM: [22, 5, 2, 1.4, 0.6, 0.4, 0.6, 1.4, 2, 5, 22],
        HIGH: [76, 10, 3, 0.9, 0.3, 0.2, 0.3, 0.9, 3, 10, 76]
    },
    12: {
        LOW: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
        MEDIUM: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
        HIGH: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170]
    },
    14: {
        LOW: [7.1, 4, 1.9, 1.4, 1.3, 1.1, 1, 0.5, 1, 1.1, 1.3, 1.4, 1.9, 4, 7.1],
        MEDIUM: [58, 15, 7, 4, 1.9, 1, 0.5, 0.2, 0.5, 1, 1.9, 4, 7, 15, 58],
        HIGH: [420, 56, 18, 5, 1.9, 0.3, 0.2, 0.2, 0.2, 0.3, 1.9, 5, 18, 56, 420]
    },
    16: {
        LOW: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
        MEDIUM: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
        HIGH: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000]
    }
};

interface Ball {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    currentRow: number;     // Target row index currently heading to (0 .. rows)
    currentCol: number;     // Target column index in current row
    path: number[];         // Sequence of 0 (left) or 1 (right) choices
    betEur: number;
    targetSlot: number;     // Final bucket index (sum of rights)
    hasCollided: boolean;   // Avoid duplicate collisions in single row
}

export const PlinkoGame: React.FC<PlinkoGameProps> = ({ balanceCents, onUpdateBalance, onBack }) => {
    const [betEur, setBetEur] = useState<number>(1.00);
    const [rows, setRows] = useState<number>(12);
    const [risk, setRisk] = useState<RiskLevel>('MEDIUM');
    const [history, setHistory] = useState<{ mult: number; color: string }[]>([
        { mult: 2.0, color: '#10b981' },
        { mult: 0.6, color: '#475569' },
        { mult: 1.1, color: '#06b6d4' },
        { mult: 0.3, color: '#475569' },
        { mult: 4.0, color: '#f59e0b' }
    ]);
    const [activeSlotPulse, setActiveSlotPulse] = useState<number | null>(null);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const ballsRef = useRef<Ball[]>([]);
    const nextBallId = useRef<number>(1);
    const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const currentMultipliers = MULTIPLIERS[rows][risk];

    // Audio effects
    const playSound = useCallback((type: 'peg' | 'win' | 'drop') => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            if (type === 'drop') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(450, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.08);
                gain.gain.setValueAtTime(0.12, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
                osc.connect(gain); gain.connect(ctx.destination);
                osc.start(); osc.stop(ctx.currentTime + 0.08);
            } else if (type === 'peg') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                const freq = 600 + Math.random() * 350;
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                gain.gain.setValueAtTime(0.09, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
                osc.connect(gain); gain.connect(ctx.destination);
                osc.start(); osc.stop(ctx.currentTime + 0.035);
            } else if (type === 'win') {
                [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);
                    gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.06);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.06 + 0.25);
                    osc.connect(gain); gain.connect(ctx.destination);
                    osc.start(ctx.currentTime + idx * 0.06);
                    osc.stop(ctx.currentTime + idx * 0.06 + 0.25);
                });
            }
        } catch {}
    }, []);

    // Color mapper for multiplier buckets
    const getSlotColor = (mult: number) => {
        if (mult >= 100) return '#ef4444'; // Red
        if (mult >= 20) return '#f97316';  // Orange
        if (mult >= 5) return '#f59e0b';   // Gold
        if (mult >= 2) return '#10b981';   // Emerald
        if (mult >= 1) return '#06b6d4';   // Cyan
        return '#475569';                  // Slate
    };

    // Helper: calculate pin coordinates on canvas
    const getPinCoords = (r: number, c: number, width: number, height: number) => {
        const startY = 55;
        const rowHeight = (height - 130) / rows;
        const rowSpacing = 28 + (16 - rows) * 2.2;
        const countInRow = r + 1;
        const rowWidth = (countInRow - 1) * rowSpacing;
        const startX = (width - rowWidth) / 2;
        const x = startX + c * rowSpacing;
        const y = startY + r * rowHeight;
        return { x, y, rowSpacing, rowHeight, startY };
    };

    // Drop a ball
    const handleDropBall = () => {
        const betCents = Math.round(betEur * 100);

        if (balanceCents < betCents) {
            alert('Nicht genügend Guthaben!');
            return;
        }

        onUpdateBalance(prev => prev - betCents);
        playSound('drop');

        // Pre-determine authentic Stake binomial path (50% left = 0, 50% right = 1)
        const path: number[] = [];
        let rightsCount = 0;
        for (let i = 0; i < rows; i++) {
            const dir = Math.random() < 0.5 ? 0 : 1;
            path.push(dir);
            if (dir === 1) rightsCount++;
        }
        const targetSlot = rightsCount; // Exactly 0 to rows (Binomial distribution)

        const canvas = canvasRef.current;
        const width = canvas ? canvas.width : 680;
        const height = canvas ? canvas.height : 540;
        const { x: topPinX, y: topPinY } = getPinCoords(0, 0, width, height);

        const newBall: Ball = {
            id: nextBallId.current++,
            x: topPinX + (Math.random() - 0.5) * 2,
            y: topPinY - 30,
            vx: (Math.random() - 0.5) * 0.5,
            vy: 2.2,
            radius: 6.5,
            color: '#ef4444',
            currentRow: 0,
            currentCol: 0,
            path,
            betEur,
            targetSlot,
            hasCollided: false
        };

        ballsRef.current.push(newBall);
    };

    // Canvas rendering & physics loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;

        const render = () => {
            const width = canvas.width;
            const height = canvas.height;

            ctx.clearRect(0, 0, width, height);

            const startY = 55;
            const rowHeight = (height - 130) / rows;
            const rowSpacing = 28 + (16 - rows) * 2.2;
            const pinRadius = 3.2;

            // 1. Draw Pegs (Pyramid of pins)
            for (let r = 0; r <= rows; r++) {
                const countInRow = r + 1;
                const rowWidth = (countInRow - 1) * rowSpacing;
                const startX = (width - rowWidth) / 2;
                const y = startY + r * rowHeight;

                for (let c = 0; c < countInRow; c++) {
                    const x = startX + c * rowSpacing;

                    // Glow & Pin
                    ctx.beginPath();
                    ctx.arc(x, y, pinRadius, 0, Math.PI * 2);
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
                    ctx.shadowBlur = 5;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            }

            // 2. Draw Multiplier Buckets at bottom
            const bottomY = startY + rows * rowHeight + 24;
            const totalBuckets = rows + 1;
            const totalWidth = (totalBuckets - 1) * rowSpacing;
            const startX = (width - totalWidth) / 2;
            const bucketW = Math.max(22, rowSpacing - 6);

            for (let i = 0; i < totalBuckets; i++) {
                const bx = startX + i * rowSpacing;
                const mult = currentMultipliers[i] ?? 1;
                const isPulsing = activeSlotPulse === i;

                ctx.save();
                ctx.translate(bx, bottomY);
                if (isPulsing) {
                    ctx.scale(1.2, 1.2);
                }

                // Slot pill
                ctx.fillStyle = getSlotColor(mult);
                ctx.beginPath();
                ctx.roundRect(-bucketW / 2, -12, bucketW, 24, [5]);
                ctx.fill();

                if (isPulsing) {
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }

                // Multiplier text
                ctx.fillStyle = '#ffffff';
                ctx.font = `bold ${bucketW < 26 ? '9px' : '11px'} Inter, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${mult}×`, 0, 0);

                ctx.restore();
            }

            // 3. Update & Draw Balls with Galton Board Physics
            const gravity = 0.26;

            ballsRef.current = ballsRef.current.filter(ball => {
                ball.vy += gravity;
                ball.x += ball.vx;
                ball.y += ball.vy;

                // Air friction
                ball.vx *= 0.985;

                // Steer along path through pins
                if (ball.currentRow <= rows) {
                    const pin = getPinCoords(ball.currentRow, ball.currentCol, width, height);
                    const dx = ball.x - pin.x;
                    const dy = ball.y - pin.y;
                    const dist = Math.hypot(dx, dy);

                    // Collision with the pin in currentRow
                    if (dist < ball.radius + pinRadius + 1.5 && !ball.hasCollided) {
                        playSound('peg');
                        ball.hasCollided = true;

                        // Branch left or right according to precalculated binomial path
                        const choice = ball.path[ball.currentRow] ?? (Math.random() < 0.5 ? 0 : 1);
                        const bounceDir = choice === 1 ? 1 : -1;

                        // Realistic elastic bounce off peg
                        ball.vx = bounceDir * (1.6 + Math.random() * 0.5);
                        ball.vy = -1.8 - Math.random() * 0.6;
                        ball.x = pin.x + bounceDir * (pinRadius + ball.radius * 0.7);

                        // Advance target to next row
                        ball.currentRow += 1;
                        if (choice === 1) {
                            ball.currentCol += 1;
                        }
                    }

                    // Reset collision flag once ball has dropped sufficiently below the pin
                    if (ball.hasCollided && ball.y > pin.y + pinRadius + 3) {
                        ball.hasCollided = false;
                    }

                    // Guiding gentle force towards the target pin column to maintain realistic trajectory
                    if (ball.currentRow <= rows) {
                        const nextPin = getPinCoords(ball.currentRow, ball.currentCol, width, height);
                        const targetOffsetX = nextPin.x - ball.x;
                        ball.vx += targetOffsetX * 0.015;
                    }
                }

                // Draw glowing ball
                ctx.beginPath();
                ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
                ctx.fillStyle = '#ef4444';
                ctx.shadowColor = '#f87171';
                ctx.shadowBlur = 10;
                ctx.fill();
                ctx.shadowBlur = 0;

                // Check if ball reached bottom buckets
                if (ball.y >= bottomY - 6) {
                    const landedIndex = Math.min(
                        totalBuckets - 1,
                        Math.max(0, ball.targetSlot)
                    );
                    const mult = currentMultipliers[landedIndex] ?? 1;
                    const winCents = Math.round(ball.betEur * 100 * mult);

                    // Add win back to balance functionally
                    if (winCents > 0) {
                        onUpdateBalance(prev => prev + winCents);
                    }

                    // Pulse the bucket
                    setActiveSlotPulse(landedIndex);
                    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
                    pulseTimerRef.current = setTimeout(() => setActiveSlotPulse(null), 350);

                    // Record history
                    setHistory(prev => [{ mult, color: getSlotColor(mult) }, ...prev.slice(0, 6)]);

                    // Audio & Confetti on big wins
                    if (mult >= 5) {
                        playSound('win');
                        confetti({ particleCount: 30, spread: 70, origin: { y: 0.85 } });
                    }

                    return false; // Ball finished
                }

                return true;
            });

            animationId = requestAnimationFrame(render);
        };

        animationId = requestAnimationFrame(render);
        return () => {
            cancelAnimationFrame(animationId);
            if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
        };
    }, [rows, risk, currentMultipliers, onUpdateBalance, playSound, activeSlotPulse]);

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            padding: '24px',
            maxWidth: '1240px',
            margin: '0 auto',
            boxShadow: 'var(--shadow-elevated)',
            position: 'relative'
        }}>
            {/* Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <button onClick={onBack} className="stake-btn stake-btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                        ← Lobby
                    </button>
                    <span style={{ fontSize: '1.6rem' }}>🔴</span>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.35rem', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 900 }}>
                            Stake Plinko
                        </h2>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Original Stake Galton Physics &bull; Bis zu 1000× Multiplikator
                        </span>
                    </div>
                </div>

                {/* Live Multiplier Ticker */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginRight: '6px' }}>Verlauf:</span>
                    {history.map((h, i) => (
                        <span key={i} style={{
                            background: h.color,
                            color: '#fff',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                        }}>
                            {h.mult}×
                        </span>
                    ))}
                </div>
            </div>

            {/* Main Game Container: Settings on Left, Board on Right */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '320px 1fr',
                gap: '24px',
                background: 'var(--bg-main)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                border: '1px solid var(--border-subtle)'
            }}>
                {/* Left Controls Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Bet Amount */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 700 }}>
                            Einsatzbetrag (€)
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="number"
                                step="0.5"
                                min="0.5"
                                max="500"
                                value={betEur}
                                onChange={(e) => setBetEur(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                                style={{
                                    flex: 1,
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-strong)',
                                    color: '#fff',
                                    padding: '12px 14px',
                                    borderRadius: 'var(--radius-md)',
                                    fontWeight: 700,
                                    fontSize: '1rem'
                                }}
                            />
                            <button
                                onClick={() => setBetEur(b => parseFloat((b / 2).toFixed(2)))}
                                className="stake-btn stake-btn-secondary"
                                style={{ padding: '0 12px' }}
                            >
                                ½
                            </button>
                            <button
                                onClick={() => setBetEur(b => parseFloat((b * 2).toFixed(2)))}
                                className="stake-btn stake-btn-secondary"
                                style={{ padding: '0 12px' }}
                            >
                                2×
                            </button>
                        </div>
                    </div>

                    {/* Risk Level */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 700 }}>
                            Risiko
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                            {(['LOW', 'MEDIUM', 'HIGH'] as RiskLevel[]).map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setRisk(r)}
                                    style={{
                                        padding: '10px 0',
                                        borderRadius: 'var(--radius-md)',
                                        border: risk === r ? '2px solid var(--stake-green)' : '1px solid var(--border-subtle)',
                                        background: risk === r ? 'var(--bg-elevated)' : 'var(--bg-card)',
                                        color: risk === r ? 'var(--stake-green)' : 'var(--text-secondary)',
                                        fontWeight: 800,
                                        fontSize: '0.82rem',
                                        cursor: 'pointer',
                                        textTransform: 'uppercase'
                                    }}
                                >
                                    {r === 'LOW' ? 'Niedrig' : r === 'MEDIUM' ? 'Mittel' : 'Hoch'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rows Selector */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 700 }}>
                            Reihen: {rows}
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                            {[8, 10, 12, 14, 16].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => setRows(num)}
                                    style={{
                                        padding: '8px 0',
                                        borderRadius: 'var(--radius-md)',
                                        border: rows === num ? '2px solid var(--stake-gold)' : '1px solid var(--border-subtle)',
                                        background: rows === num ? 'var(--bg-elevated)' : 'var(--bg-card)',
                                        color: rows === num ? 'var(--stake-gold)' : 'var(--text-secondary)',
                                        fontWeight: 800,
                                        fontSize: '0.85rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Drop Ball Action Button */}
                    <button
                        onClick={handleDropBall}
                        className="stake-btn stake-btn-green glow-green"
                        style={{
                            padding: '16px',
                            fontSize: '1.2rem',
                            fontWeight: 900,
                            letterSpacing: '1px',
                            marginTop: 'auto'
                        }}
                    >
                        KUGEL FALLEN LASSEN
                    </button>
                </div>

                {/* Right Pegboard Canvas */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#090f1a',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    padding: '10px'
                }}>
                    <canvas
                        ref={canvasRef}
                        width={680}
                        height={540}
                        style={{ width: '100%', maxWidth: '680px', height: 'auto', display: 'block' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default PlinkoGame;
