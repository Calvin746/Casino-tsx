import React, { useState, useEffect, useRef } from 'react';
import { getRtpSettings } from '../../utils/rtpManager';

interface CrashGameProps {
    balanceCents: number;
    onUpdateBalance: (newBalance: number) => void;
    onBack: () => void;
}

export const CrashGame: React.FC<CrashGameProps> = ({ balanceCents, onUpdateBalance, onBack }) => {
    const [betEur, setBetEur] = useState<number>(1.00);
    const [gameState, setGameState] = useState<'idle' | 'running' | 'crashed' | 'cashed'>('idle');
    const [multiplier, setMultiplier] = useState<number>(1.00);
    const [crashPoint, setCrashPoint] = useState<number>(1.00);
    const [history, setHistory] = useState<number[]>([1.92, 4.31, 1.08, 14.50, 2.14, 1.35, 7.82]);
    const [message, setMessage] = useState<string>('');

    const animFrameRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);

    const startRound = () => {
        const betCents = Math.round(betEur * 100);
        if (balanceCents < betCents) {
            alert('Nicht genügend Guthaben!');
            return;
        }

        // Deduct bet
        onUpdateBalance(balanceCents - betCents);

        const rtpSettings = getRtpSettings();
        let point = 1.0;

        if (rtpSettings.crashInstantBust) {
            point = 1.00;
        } else if (rtpSettings.crashFixedMultiplier) {
            point = rtpSettings.crashFixedMultiplier;
        } else {
            const rand = Math.random();
            if (rand < 0.04) {
                point = 1.00;
            } else {
                point = parseFloat((0.98 / (1 - rand)).toFixed(2));
                if (point > 100) point = 100;
            }
        }

        setCrashPoint(point);
        setMultiplier(1.00);
        setGameState('running');
        setMessage('Rakete steigt! Klicke Auszahlen vor dem Crash!');
        startTimeRef.current = performance.now();
    };

    useEffect(() => {
        if (gameState !== 'running') return;

        const updateFlight = (timestamp: number) => {
            const elapsedSeconds = (timestamp - startTimeRef.current) / 1000;
            // Exponential curve for multiplier: e^(0.06 * t^1.4)
            const currentMult = parseFloat((Math.pow(Math.E, 0.18 * elapsedSeconds)).toFixed(2));

            if (currentMult >= crashPoint) {
                // Crashed!
                setMultiplier(crashPoint);
                setGameState('crashed');
                setMessage(`💥 ABGESTÜRZT bei ${crashPoint.toFixed(2)}x`);
                setHistory(prev => [crashPoint, ...prev.slice(0, 7)]);
            } else {
                setMultiplier(currentMult);
                animFrameRef.current = requestAnimationFrame(updateFlight);
            }
        };

        animFrameRef.current = requestAnimationFrame(updateFlight);

        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [gameState, crashPoint]);

    const handleCashout = () => {
        if (gameState !== 'running') return;

        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        const winEur = betEur * multiplier;
        const winCents = Math.round(winEur * 100);

        onUpdateBalance(balanceCents + winCents);
        setGameState('cashed');
        setMessage(`🎉 Erfolgreich ausgezahlt bei ${multiplier.toFixed(2)}x (+${winEur.toFixed(2)} €)!`);
    };

    // Calculate curve SVG points
    const progress = Math.min(1, (multiplier - 1) / 15);
    const rocketX = 60 + progress * 460;
    const rocketY = 240 - Math.pow(progress, 0.8) * 190;

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            padding: '28px',
            maxWidth: '1360px',
            margin: '0 auto'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <button
                        onClick={onBack}
                        className="stake-btn stake-btn-secondary"
                        style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                    >
                        ← Zurück zur Lobby
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.4rem' }}>🚀</span>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-white)', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                            Stake Crash
                        </h2>
                        <span className="stake-badge stake-badge-original">ORIGINAL</span>
                    </div>
                </div>
                <div style={{ color: 'var(--stake-green)', fontWeight: 700, fontSize: '0.9rem' }}>
                    Guthaben: {(balanceCents / 100).toFixed(2)} €
                </div>
            </div>

            {/* History Bar */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
                {history.map((pt, i) => (
                    <div
                        key={i}
                        style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            background: pt >= 2 ? 'rgba(0, 231, 1, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: pt >= 2 ? 'var(--stake-green)' : '#ef4444',
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            border: `1px solid ${pt >= 2 ? 'rgba(0, 231, 1, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                        }}
                    >
                        {pt.toFixed(2)}x
                    </div>
                ))}
            </div>

            {/* Main Stage: Controls Left, Flight Canvas Right */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(280px, 340px) 1fr',
                gap: '28px',
                alignItems: 'center'
            }}>
                {/* Controls */}
                <div style={{
                    background: 'var(--bg-main)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                            <span>Einsatz Betrag (€)</span>
                        </div>
                        <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                            <input
                                type="number"
                                step="0.5"
                                min="0.10"
                                disabled={gameState === 'running'}
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
                                disabled={gameState === 'running'}
                                style={{ background: 'transparent', border: 'none', borderLeft: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', padding: '0 10px', cursor: 'pointer', fontWeight: 700 }}
                            >
                                ½
                            </button>
                            <button
                                onClick={() => setBetEur(prev => parseFloat((prev * 2).toFixed(2)))}
                                disabled={gameState === 'running'}
                                style={{ background: 'transparent', border: 'none', borderLeft: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', padding: '0 10px', cursor: 'pointer', fontWeight: 700 }}
                            >
                                2×
                            </button>
                        </div>
                    </div>

                    {/* Action Button */}
                    {gameState === 'running' ? (
                        <button
                            onClick={handleCashout}
                            className="stake-btn stake-btn-green glow-green"
                            style={{ padding: '16px', fontSize: '1.05rem', fontWeight: 900 }}
                        >
                            Auszahlen ({(betEur * multiplier).toFixed(2)} €)
                        </button>
                    ) : (
                        <button
                            onClick={startRound}
                            className="stake-btn stake-btn-green"
                            style={{ padding: '14px', fontSize: '1rem', fontWeight: 800 }}
                        >
                            Wette platzieren ({betEur.toFixed(2)} €)
                        </button>
                    )}

                    {message && (
                        <div style={{
                            textAlign: 'center',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            padding: '8px',
                            borderRadius: '4px',
                            background: gameState === 'crashed' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 231, 1, 0.15)',
                            color: gameState === 'crashed' ? '#ef4444' : 'var(--stake-green)'
                        }}>
                            {message}
                        </div>
                    )}
                </div>

                {/* Flight Screen */}
                <div style={{
                    background: 'var(--bg-main)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-subtle)',
                    height: '440px',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {/* Big Multiplier in center */}
                    <div style={{
                        position: 'absolute',
                        zIndex: 10,
                        textAlign: 'center',
                        userSelect: 'none'
                    }}>
                        <div style={{
                            fontSize: '3.8rem',
                            fontWeight: 900,
                            fontFamily: 'var(--font-display)',
                            color: gameState === 'crashed' ? '#ef4444' : (gameState === 'cashed' ? 'var(--stake-gold)' : 'var(--text-white)'),
                            textShadow: gameState === 'crashed' ? '0 0 20px rgba(239,68,68,0.6)' : '0 0 25px rgba(0,231,1,0.4)',
                            transition: 'color 0.1s'
                        }}>
                            {multiplier.toFixed(2)}x
                        </div>
                        {gameState === 'crashed' && (
                            <div style={{ color: '#ef4444', fontWeight: 800, letterSpacing: '2px' }}>CRASHED</div>
                        )}
                        {gameState === 'cashed' && (
                            <div style={{ color: 'var(--stake-gold)', fontWeight: 800, letterSpacing: '2px' }}>GEWONNEN!</div>
                        )}
                    </div>

                    {/* Rocket SVG flight graphic */}
                    <svg viewBox="0 0 540 260" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
                        <defs>
                            <linearGradient id="crashGlow" x1="0%" y1="100%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#00e701" stopOpacity="0" />
                                <stop offset="100%" stopColor="#00e701" stopOpacity="0.45" />
                            </linearGradient>
                        </defs>

                        {/* Grid lines */}
                        <line x1="60" y1="240" x2="520" y2="240" stroke="var(--border-subtle)" strokeWidth="2" />
                        <line x1="60" y1="20" x2="60" y2="240" stroke="var(--border-subtle)" strokeWidth="2" />

                        {gameState === 'running' && (
                            <>
                                {/* Trailing curve */}
                                <path
                                    d={`M 60 240 Q ${rocketX * 0.7} 240 ${rocketX} ${rocketY}`}
                                    fill="none"
                                    stroke="var(--stake-green)"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                />
                                <polygon
                                    points={`60,240 ${rocketX},${rocketY} ${rocketX},240`}
                                    fill="url(#crashGlow)"
                                />
                                {/* Rocket Emoji / Dot */}
                                <circle cx={rocketX} cy={rocketY} r="8" fill="#00e701" filter="drop-shadow(0 0 8px #00e701)" />
                                <text x={rocketX - 10} y={rocketY - 14} fontSize="24">🚀</text>
                            </>
                        )}
                    </svg>
                </div>
            </div>
        </div>
    );
};
