import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// European Roulette Numbers in wheel order
const ROULETTE_NUMBERS = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
    5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

function getNumberColor(num: number): 'green' | 'red' | 'black' {
    if (num === 0) return 'green';
    return RED_NUMBERS.has(num) ? 'red' : 'black';
}

interface RouletteWheelMeshProps {
    isSpinning: boolean;
    winningIndex: number;
}

const RouletteWheelMesh: React.FC<RouletteWheelMeshProps> = ({ isSpinning }) => {
    const wheelRef = useRef<THREE.Group>(null!);
    const ballRef = useRef<THREE.Group>(null!);

    useFrame((_, delta) => {
        if (wheelRef.current) {
            wheelRef.current.rotation.y += isSpinning ? delta * 6 : delta * 0.4;
        }
        if (ballRef.current && isSpinning) {
            ballRef.current.rotation.y -= delta * 12;
        }
    });

    return (
        <group position={[0, -0.2, 0]}>
            {/* Outer wooden bowl */}
            <mesh rotation={[0, 0, 0]}>
                <cylinderGeometry args={[2.5, 2.7, 0.4, 48]} />
                <meshStandardMaterial color="#451a03" roughness={0.3} metalness={0.4} />
            </mesh>

            {/* Brass outer track */}
            <mesh position={[0, 0.1, 0]}>
                <cylinderGeometry args={[2.4, 2.4, 0.35, 48, 1, true]} />
                <meshStandardMaterial color="#d97706" roughness={0.2} metalness={0.85} />
            </mesh>

            {/* Rotating inner wheel */}
            <group ref={wheelRef} position={[0, 0.12, 0]}>
                {/* Number track cone */}
                <mesh>
                    <cylinderGeometry args={[2.2, 2.0, 0.25, 37]} />
                    <meshStandardMaterial color="#1a1a24" roughness={0.4} metalness={0.6} />
                </mesh>

                {/* Center cone / turret */}
                <mesh position={[0, 0.35, 0]}>
                    <coneGeometry args={[0.55, 0.7, 32]} />
                    <meshStandardMaterial color="#f59e0b" roughness={0.15} metalness={0.9} />
                </mesh>

                {/* Turret cross handles */}
                <mesh position={[0, 0.5, 0]}>
                    <boxGeometry args={[1.4, 0.08, 0.08]} />
                    <meshStandardMaterial color="#f59e0b" roughness={0.15} metalness={0.9} />
                </mesh>
                <mesh position={[0, 0.5, 0]}>
                    <boxGeometry args={[0.08, 0.08, 1.4]} />
                    <meshStandardMaterial color="#f59e0b" roughness={0.15} metalness={0.9} />
                </mesh>
            </group>

            {/* Spinning Ball Orbit */}
            <group ref={ballRef} position={[0, 0.24, 0]}>
                <mesh position={[1.9, 0, 0]}>
                    <sphereGeometry args={[0.09, 16, 16]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.1} />
                </mesh>
            </group>
        </group>
    );
};

interface Roulette3DProps {
    initialBalance: number;
    onBackToLobby?: () => void;
    onUpdateBalance?: (newBalance: number) => void;
}

type BetType = 'red' | 'black' | 'even' | 'odd' | '1-18' | '19-36' | '1st12' | '2nd12' | '3rd12' | number;

export const Roulette3D: React.FC<Roulette3DProps> = ({
    initialBalance,
    onBackToLobby,
    onUpdateBalance
}) => {
    const [balance, setBalance] = useState<number>(initialBalance || 10000);
    const [selectedChip, setSelectedChip] = useState<number>(1.00);
    const [bets, setBets] = useState<Map<BetType, number>>(new Map());
    const [spinning, setSpinning] = useState<boolean>(false);
    const [winningNumber, setWinningNumber] = useState<number | null>(null);
    const [lastWin, setLastWin] = useState<number>(0);
    const [history, setHistory] = useState<number[]>([14, 2, 0, 31, 9, 22, 17]);
    const [message, setMessage] = useState<string>('Platziere deine Chips auf dem Roulettetisch');

    // Total bets in cents
    const totalBetEur = Array.from(bets.values()).reduce((sum, v) => sum + v, 0);

    const placeBet = (type: BetType) => {
        if (spinning) return;
        const currentBet = bets.get(type) || 0;
        const newTotal = totalBetEur + selectedChip;
        if (newTotal * 100 > balance) {
            alert('Nicht genügend Guthaben für diesen Einsatz!');
            return;
        }

        const newBets = new Map(bets);
        newBets.set(type, currentBet + selectedChip);
        setBets(newBets);
    };

    const clearBets = () => {
        if (spinning) return;
        setBets(new Map());
    };

    const doubleBets = () => {
        if (spinning) return;
        const newBets = new Map();
        let newTotal = 0;
        bets.forEach((val, key) => {
            newBets.set(key, val * 2);
            newTotal += val * 2;
        });
        if (newTotal * 100 > balance) {
            alert('Nicht genügend Guthaben zum Verdoppeln!');
            return;
        }
        setBets(newBets);
    };

    // Calculate payouts
    const spinWheel = () => {
        if (spinning || totalBetEur <= 0) return;

        const betCents = Math.round(totalBetEur * 100);
        if (balance < betCents) return;

        // Deduct bet from balance
        const balanceAfterBet = balance - betCents;
        setBalance(balanceAfterBet);
        if (onUpdateBalance) onUpdateBalance(balanceAfterBet);

        setSpinning(true);
        setWinningNumber(null);
        setLastWin(0);
        setMessage('Kugel rollt...');

        // Random European Roulette winner (0-36)
        const wonNum = Math.floor(Math.random() * 37);
        const wonColor = getNumberColor(wonNum);

        setTimeout(() => {
            setSpinning(false);
            setWinningNumber(wonNum);
            setHistory(prev => [wonNum, ...prev.slice(0, 8)]);

            // Compute winnings
            let totalWinEur = 0;

            bets.forEach((betAmount, betType) => {
                // Exact number (36x total payout = 35 to 1 + stake)
                if (typeof betType === 'number') {
                    if (betType === wonNum) {
                        totalWinEur += betAmount * 36;
                    }
                } else if (betType === 'red' && wonColor === 'red') {
                    totalWinEur += betAmount * 2;
                } else if (betType === 'black' && wonColor === 'black') {
                    totalWinEur += betAmount * 2;
                } else if (betType === 'even' && wonNum !== 0 && wonNum % 2 === 0) {
                    totalWinEur += betAmount * 2;
                } else if (betType === 'odd' && wonNum !== 0 && wonNum % 2 !== 0) {
                    totalWinEur += betAmount * 2;
                } else if (betType === '1-18' && wonNum >= 1 && wonNum <= 18) {
                    totalWinEur += betAmount * 2;
                } else if (betType === '19-36' && wonNum >= 19 && wonNum <= 36) {
                    totalWinEur += betAmount * 2;
                } else if (betType === '1st12' && wonNum >= 1 && wonNum <= 12) {
                    totalWinEur += betAmount * 3;
                } else if (betType === '2nd12' && wonNum >= 13 && wonNum <= 24) {
                    totalWinEur += betAmount * 3;
                } else if (betType === '3rd12' && wonNum >= 25 && wonNum <= 36) {
                    totalWinEur += betAmount * 3;
                }
            });

            const winCents = Math.round(totalWinEur * 100);
            const finalBal = balanceAfterBet + winCents;
            setBalance(finalBal);
            setLastWin(winCents);
            if (onUpdateBalance) onUpdateBalance(finalBal);

            if (winCents > 0) {
                setMessage(`🎉 ${wonNum} (${wonColor.toUpperCase()})! Gewinn: +${totalWinEur.toFixed(2)} €`);
            } else {
                setMessage(`${wonNum} (${wonColor.toUpperCase()}). Kein Gewinn.`);
            }
        }, 3000);
    };

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            padding: '24px',
            maxWidth: '1100px',
            margin: '0 auto',
            boxShadow: '0 16px 40px rgba(0,0,0,0.5)'
        }}>
            {/* Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
                        <span style={{ fontSize: '1.4rem' }}>🎡</span>
                        <h2 style={{ margin: 0, fontSize: '1.35rem', color: 'var(--text-white)', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                            European 3D Live Roulette
                        </h2>
                        <span className="stake-badge stake-badge-vip">3D CASINO ORIGINAL</span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* History */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Historie:</span>
                        {history.map((h, i) => {
                            const color = getNumberColor(h);
                            const bg = color === 'green' ? '#059669' : (color === 'red' ? '#dc2626' : '#1e293b');
                            return (
                                <span
                                    key={i}
                                    style={{
                                        background: bg,
                                        color: '#fff',
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.72rem',
                                        fontWeight: 800
                                    }}
                                >
                                    {h}
                                </span>
                            );
                        })}
                    </div>

                    <div style={{ color: 'var(--stake-green)', fontWeight: 800, fontSize: '1.05rem' }}>
                        {(balance / 100).toFixed(2)} €
                    </div>
                </div>
            </div>

            {/* 3D Wheel Canvas */}
            <div style={{
                height: '280px',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: 'radial-gradient(circle at center, #1b2636 0%, #0d1622 100%)',
                position: 'relative',
                border: '1px solid var(--border-subtle)',
                marginBottom: '20px'
            }}>
                <Canvas camera={{ position: [0, 4.5, 3.2], fov: 42 }}>
                    <ambientLight intensity={0.8} />
                    <directionalLight position={[5, 10, 5]} intensity={2.2} />
                    <pointLight position={[0, 2, 0]} intensity={1.5} color="#f59e0b" />
                    <RouletteWheelMesh isSpinning={spinning} winningIndex={winningNumber || 0} />
                </Canvas>

                {/* Number Highlight Box in Corner */}
                {winningNumber !== null && (
                    <div style={{
                        position: 'absolute',
                        top: '16px',
                        left: '16px',
                        background: getNumberColor(winningNumber) === 'green' ? '#059669' : (getNumberColor(winningNumber) === 'red' ? '#dc2626' : '#111827'),
                        color: '#fff',
                        padding: '10px 20px',
                        borderRadius: '12px',
                        fontWeight: 900,
                        fontSize: '1.6rem',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
                        border: '2px solid rgba(255,255,255,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <span>{winningNumber}</span>
                        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {getNumberColor(winningNumber)}
                        </span>
                    </div>
                )}

                {/* Spin / Win Message Banner */}
                <div style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(15, 33, 46, 0.9)',
                    backdropFilter: 'blur(6px)',
                    color: lastWin > 0 ? 'var(--stake-green)' : 'var(--text-white)',
                    padding: '6px 20px',
                    borderRadius: '20px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    border: '1px solid var(--border-subtle)'
                }}>
                    {message}
                </div>
            </div>

            {/* Betting Felt / Table */}
            <div style={{
                background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                border: '3px solid #047857',
                boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)',
                marginBottom: '20px'
            }}>
                {/* 0 (Green) on left + 1-36 grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '6px', marginBottom: '8px' }}>
                    {/* 0 */}
                    <button
                        onClick={() => placeBet(0)}
                        style={{
                            background: bets.has(0) ? '#10b981' : '#059669',
                            color: '#fff',
                            border: bets.has(0) ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '6px',
                            fontWeight: 900,
                            fontSize: '1.2rem',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <span>0</span>
                        {bets.has(0) && (
                            <span style={{ fontSize: '0.68rem', color: '#fbbf24' }}>{bets.get(0)}€</span>
                        )}
                    </button>

                    {/* 1-36 grid (3 rows of 12 numbers) */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(12, 1fr)',
                        gridTemplateRows: 'repeat(3, 42px)',
                        gap: '4px'
                    }}>
                        {[
                            [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
                            [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
                            [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]
                        ].map((row) =>
                            row.map((num) => {
                                const isRed = RED_NUMBERS.has(num);
                                const hasBet = bets.has(num);
                                return (
                                    <button
                                        key={num}
                                        onClick={() => placeBet(num)}
                                        style={{
                                            background: hasBet ? (isRed ? '#ef4444' : '#334155') : (isRed ? '#b91c1c' : '#0f172a'),
                                            color: '#fff',
                                            border: hasBet ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.2)',
                                            borderRadius: '4px',
                                            fontWeight: 800,
                                            fontSize: '0.9rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <span>{num}</span>
                                        {hasBet && (
                                            <span style={{ fontSize: '0.62rem', color: '#fbbf24', marginTop: '-2px' }}>{bets.get(num)}€</span>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Dozens & Outside Bets */}
                <div style={{ marginLeft: '66px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {/* Dozens */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                        {[
                            { key: '1st12', label: '1. Dutzend (1-12)' },
                            { key: '2nd12', label: '2. Dutzend (13-24)' },
                            { key: '3rd12', label: '3. Dutzend (25-36)' }
                        ].map(d => (
                            <button
                                key={d.key}
                                onClick={() => placeBet(d.key as BetType)}
                                style={{
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: bets.has(d.key as BetType) ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.25)',
                                    background: bets.has(d.key as BetType) ? 'rgba(245, 158, 11, 0.25)' : 'rgba(0,0,0,0.35)',
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    cursor: 'pointer'
                                }}
                            >
                                {d.label} {bets.has(d.key as BetType) && `(${bets.get(d.key as BetType)}€)`}
                            </button>
                        ))}
                    </div>

                    {/* Even-money bets (1-18, Even, Red, Black, Odd, 19-36) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                        {[
                            { key: '1-18', label: '1 - 18' },
                            { key: 'even', label: 'GERADE' },
                            { key: 'red', label: 'ROT', color: '#b91c1c' },
                            { key: 'black', label: 'SCHWARZ', color: '#0f172a' },
                            { key: 'odd', label: 'UNGERADE' },
                            { key: '19-36', label: '19 - 36' }
                        ].map(b => (
                            <button
                                key={b.key}
                                onClick={() => placeBet(b.key as BetType)}
                                style={{
                                    padding: '10px 4px',
                                    borderRadius: '4px',
                                    border: bets.has(b.key as BetType) ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.25)',
                                    background: b.color || (bets.has(b.key as BetType) ? 'rgba(245, 158, 11, 0.3)' : 'rgba(0,0,0,0.4)'),
                                    color: '#fff',
                                    fontWeight: 800,
                                    fontSize: '0.8rem',
                                    cursor: 'pointer'
                                }}
                            >
                                {b.label} {bets.has(b.key as BetType) && `(${bets.get(b.key as BetType)}€)`}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Chip Selection & Action Controls */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
            }}>
                {/* Chip values */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Chip:</span>
                    {[0.5, 1, 5, 25, 100].map(val => (
                        <button
                            key={val}
                            onClick={() => setSelectedChip(val)}
                            disabled={spinning}
                            style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                border: selectedChip === val ? '3px solid #fff' : '2px dashed rgba(255,255,255,0.4)',
                                background: val === 0.5 ? '#64748b' : (val === 1 ? '#0284c7' : (val === 5 ? '#dc2626' : (val === 25 ? '#16a34a' : '#1e1b4b'))),
                                color: '#fff',
                                fontWeight: 900,
                                fontSize: '0.78rem',
                                cursor: 'pointer',
                                boxShadow: selectedChip === val ? '0 0 14px rgba(255,255,255,0.7)' : 'none',
                                transform: selectedChip === val ? 'scale(1.1)' : 'scale(1)',
                                transition: 'all 0.15s'
                            }}
                        >
                            {val}€
                        </button>
                    ))}

                    <button
                        onClick={clearBets}
                        disabled={spinning || totalBetEur === 0}
                        className="stake-btn stake-btn-secondary"
                        style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                    >
                        Löschen
                    </button>
                    <button
                        onClick={doubleBets}
                        disabled={spinning || totalBetEur === 0}
                        className="stake-btn stake-btn-secondary"
                        style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                    >
                        2×
                    </button>
                </div>

                {/* Total Bet & Spin Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Gesamteinsatz:</div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-white)' }}>
                            {totalBetEur.toFixed(2)} €
                        </div>
                    </div>

                    <button
                        onClick={spinWheel}
                        disabled={spinning || totalBetEur <= 0}
                        className="stake-btn stake-btn-green glow-green"
                        style={{
                            padding: '14px 44px',
                            fontSize: '1.1rem',
                            fontWeight: 900,
                            letterSpacing: '0.5px'
                        }}
                    >
                        {spinning ? 'Dreht...' : 'DREHEN'}
                    </button>
                </div>
            </div>
        </div>
    );
};
