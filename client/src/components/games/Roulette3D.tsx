import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// European Roulette Numbers in precise wheel pocket order
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
    winningNumber: number | null;
    onBallSettled: () => void;
}

// 3D Realistic Roulette Wheel with colored pockets, brass frets, and ball physics
const RealisticRouletteWheel: React.FC<RouletteWheelMeshProps> = ({ isSpinning, winningNumber, onBallSettled }) => {
    const rotorRef = useRef<THREE.Group>(null!);
    const ballGroupRef = useRef<THREE.Group>(null!);
    const ballMeshRef = useRef<THREE.Mesh>(null!);

    // Rotor physics state
    const rotorAngleRef = useRef<number>(0);
    const rotorSpeedRef = useRef<number>(0.5);

    // Ball physics state
    const ballAngleRef = useRef<number>(0);
    const ballSpeedRef = useRef<number>(0);
    const ballRadiusRef = useRef<number>(2.05);
    const ballHeightRef = useRef<number>(0.32);
    const ballStateRef = useRef<'idle' | 'rolling' | 'dropping' | 'settled'>('idle');
    const hasReportedSettled = useRef<boolean>(false);

    // Build the 37 colored pocket segments with brass frets
    const pockets = useMemo(() => {
        const items = [];
        const count = ROULETTE_NUMBERS.length; // 37
        const angleStep = (Math.PI * 2) / count;

        for (let i = 0; i < count; i++) {
            const num = ROULETTE_NUMBERS[i];
            const colorType = getNumberColor(num);
            const hexColor = colorType === 'green' ? '#059669' : (colorType === 'red' ? '#dc2626' : '#18181b');
            const angle = i * angleStep;

            items.push({
                num,
                colorType,
                hexColor,
                angle
            });
        }
        return items;
    }, []);

    useEffect(() => {
        if (isSpinning) {
            ballStateRef.current = 'rolling';
            ballSpeedRef.current = 14.0; // High speed in opposite direction
            ballRadiusRef.current = 2.05; // Outer track
            ballHeightRef.current = 0.32;
            rotorSpeedRef.current = 2.5; // Fast wheel
            hasReportedSettled.current = false;
        }
    }, [isSpinning]);

    useFrame((_, delta) => {
        const dt = Math.min(delta, 0.1);

        // 1. Wheel (Rotor) rotation
        if (rotorRef.current) {
            if (isSpinning) {
                // Decelerate rotor slightly to normal cruise speed
                rotorSpeedRef.current = THREE.MathUtils.lerp(rotorSpeedRef.current, 0.8, dt * 0.4);
            } else {
                rotorSpeedRef.current = THREE.MathUtils.lerp(rotorSpeedRef.current, 0.4, dt * 0.5);
            }
            rotorAngleRef.current += rotorSpeedRef.current * dt;
            rotorRef.current.rotation.y = rotorAngleRef.current;
        }

        // 2. Ball physics simulation
        if (ballGroupRef.current && ballMeshRef.current) {
            if (ballStateRef.current === 'rolling') {
                // Ball decelerates on outer track
                ballSpeedRef.current -= dt * 2.2;
                ballAngleRef.current -= ballSpeedRef.current * dt;

                if (ballSpeedRef.current < 4.5) {
                    ballStateRef.current = 'dropping';
                }
            } else if (ballStateRef.current === 'dropping') {
                // Ball drops down the conical slope toward the pockets
                ballSpeedRef.current = THREE.MathUtils.lerp(ballSpeedRef.current, rotorSpeedRef.current, dt * 3.0);
                ballRadiusRef.current = THREE.MathUtils.lerp(ballRadiusRef.current, 1.45, dt * 3.5);
                ballHeightRef.current = THREE.MathUtils.lerp(ballHeightRef.current, 0.12, dt * 3.5);
                ballAngleRef.current -= ballSpeedRef.current * dt;

                // Add bounce jitter over brass frets
                const bounce = Math.abs(Math.sin(ballAngleRef.current * 18.5)) * 0.05 * (ballSpeedRef.current / 4);
                ballMeshRef.current.position.y = ballHeightRef.current + bounce;

                if (ballRadiusRef.current <= 1.48 && Math.abs(ballSpeedRef.current - rotorSpeedRef.current) < 0.8) {
                    ballStateRef.current = 'settled';
                }
            } else if (ballStateRef.current === 'settled') {
                // Locked inside pocket, moves synchronously with the rotor
                ballAngleRef.current += rotorSpeedRef.current * dt;
                ballMeshRef.current.position.y = 0.11;

                if (!hasReportedSettled.current && !isSpinning) {
                    hasReportedSettled.current = true;
                    onBallSettled();
                }
            } else {
                // Idle slowly orbiting with wheel
                ballAngleRef.current += rotorSpeedRef.current * dt;
            }

            // Position the ball in 3D polar coordinates
            const bx = Math.cos(ballAngleRef.current) * ballRadiusRef.current;
            const bz = Math.sin(ballAngleRef.current) * ballRadiusRef.current;
            ballMeshRef.current.position.x = bx;
            ballMeshRef.current.position.z = bz;
            if (ballStateRef.current !== 'dropping') {
                ballMeshRef.current.position.y = ballHeightRef.current;
            }
        }
    });

    return (
        <group position={[0, -0.3, 0]}>
            {/* Outer Mahogany Polished Wood Bowl */}
            <mesh>
                <cylinderGeometry args={[2.55, 2.75, 0.5, 48]} />
                <meshStandardMaterial color="#381808" roughness={0.2} metalness={0.3} />
            </mesh>
            <mesh position={[0, 0.26, 0]}>
                <torusGeometry args={[2.55, 0.12, 16, 48]} />
                <meshStandardMaterial color="#270e03" roughness={0.15} metalness={0.4} />
            </mesh>

            {/* Ball Track / Upper Flange with Polished Brass */}
            <mesh position={[0, 0.16, 0]}>
                <cylinderGeometry args={[2.42, 2.42, 0.38, 48, 1, true]} />
                <meshStandardMaterial color="#d97706" metalness={0.88} roughness={0.15} />
            </mesh>

            {/* Brass Deflectors / Diamond Pins around the rim */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                const angle = (i * Math.PI) / 4;
                return (
                    <mesh key={i} position={[Math.cos(angle) * 2.2, 0.24, Math.sin(angle) * 2.2]}>
                        <boxGeometry args={[0.08, 0.08, 0.14]} />
                        <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.05} />
                    </mesh>
                );
            })}

            {/* Rotating Inner Wheel Assembly (Rotor) */}
            <group ref={rotorRef} position={[0, 0.08, 0]}>
                {/* Sloping Cone Apron with Chrome / Mirror Accent */}
                <mesh position={[0, 0.02, 0]}>
                    <cylinderGeometry args={[1.65, 2.2, 0.24, 48]} />
                    <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.6} />
                </mesh>

                {/* The 37 Realistic Colored Pockets with Brass Frets */}
                <group position={[0, 0.04, 0]}>
                    {pockets.map((p, idx) => {
                        const nextAngle = p.angle + (Math.PI * 2) / 37;
                        const midAngle = p.angle + (Math.PI / 37);
                        const r = 1.58;
                        const px = Math.cos(midAngle) * r;
                        const pz = Math.sin(midAngle) * r;

                        return (
                            <group key={idx}>
                                {/* Pocket colored plate (Green / Red / Black) */}
                                <mesh position={[px, 0.06, pz]} rotation={[0, -midAngle, 0]}>
                                    <boxGeometry args={[0.24, 0.04, 0.34]} />
                                    <meshStandardMaterial 
                                        color={p.hexColor} 
                                        roughness={0.25} 
                                        metalness={0.4} 
                                    />
                                </mesh>

                                {/* Brass Fret separator bar between pockets */}
                                <mesh position={[Math.cos(p.angle) * 1.62, 0.085, Math.sin(p.angle) * 1.62]} rotation={[0, -p.angle, 0]}>
                                    <boxGeometry args={[0.03, 0.05, 0.38]} />
                                    <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.08} />
                                </mesh>
                            </group>
                        );
                    })}
                </group>

                {/* Inner Gold Cone / Turret */}
                <mesh position={[0, 0.28, 0]}>
                    <coneGeometry args={[0.65, 0.65, 36]} />
                    <meshStandardMaterial color="#f59e0b" roughness={0.1} metalness={0.92} />
                </mesh>

                {/* Classical 4-arm Gold Turret Cross */}
                <mesh position={[0, 0.52, 0]}>
                    <boxGeometry args={[1.5, 0.07, 0.07]} />
                    <meshStandardMaterial color="#fbbf24" roughness={0.08} metalness={0.95} />
                </mesh>
                <mesh position={[0, 0.52, 0]}>
                    <boxGeometry args={[0.07, 0.07, 1.5]} />
                    <meshStandardMaterial color="#fbbf24" roughness={0.08} metalness={0.95} />
                </mesh>
                {/* Turret Center Sphere Cap */}
                <mesh position={[0, 0.55, 0]}>
                    <sphereGeometry args={[0.14, 16, 16]} />
                    <meshStandardMaterial color="#fbbf24" roughness={0.05} metalness={0.95} />
                </mesh>
            </group>

            {/* The Rolling Ivory / Ceramic Ball */}
            <group ref={ballGroupRef}>
                <mesh ref={ballMeshRef} castShadow>
                    <sphereGeometry args={[0.075, 24, 24]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.05} metalness={0.15} />
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
    const [message, setMessage] = useState<string>('Wähle Chips und klicke auf Zahlen oder Felder!');

    const totalBetEur = Array.from(bets.values()).reduce((sum, v) => sum + v, 0);

    // Audio synthesizer for realistic roulette wheel spin and winning fanfares
    const playRouletteAudio = (type: 'chip' | 'spin' | 'ball' | 'win') => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            if (type === 'chip') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.05);
            } else if (type === 'spin') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(180, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 1.2);
                gain.gain.setValueAtTime(0.25, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 1.2);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 1.2);
            } else if (type === 'win') {
                [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
                    gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.4);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(ctx.currentTime + i * 0.1);
                    osc.stop(ctx.currentTime + i * 0.1 + 0.4);
                });
            }
        } catch (e) {}
    };

    const placeBet = (type: BetType) => {
        if (spinning) return;
        const currentBet = bets.get(type) || 0;
        const newTotal = totalBetEur + selectedChip;
        if (newTotal * 100 > balance) {
            alert('Nicht genügend Guthaben!');
            return;
        }

        playRouletteAudio('chip');
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
        playRouletteAudio('chip');
        setBets(newBets);
    };

    const spinWheel = () => {
        if (spinning || totalBetEur <= 0) return;

        const betCents = Math.round(totalBetEur * 100);
        if (balance < betCents) return;

        const balanceAfterBet = balance - betCents;
        setBalance(balanceAfterBet);
        if (onUpdateBalance) onUpdateBalance(balanceAfterBet);

        setSpinning(true);
        setWinningNumber(null);
        setLastWin(0);
        setMessage('Kugel saust durch den Kessel...');
        playRouletteAudio('spin');

        // Draw random winning number (0 - 36)
        const wonNum = Math.floor(Math.random() * 37);
        const wonColor = getNumberColor(wonNum);

        // Simulated spin duration
        setTimeout(() => {
            setWinningNumber(wonNum);
            setSpinning(false);
            setHistory(prev => [wonNum, ...prev.slice(0, 8)]);

            let totalWinEur = 0;

            bets.forEach((betAmount, betType) => {
                if (typeof betType === 'number') {
                    if (betType === wonNum) totalWinEur += betAmount * 36;
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
                playRouletteAudio('win');
                setMessage(`🎉 ${wonNum} ${wonColor.toUpperCase()}! Gewinn: +${totalWinEur.toFixed(2)} €!`);
            } else {
                setMessage(`${wonNum} ${wonColor.toUpperCase()}. Kein Treffer in dieser Runde.`);
            }
        }, 3400);
    };

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            padding: '24px',
            maxWidth: '1120px',
            margin: '0 auto',
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)'
        }}>
            {/* Header */}
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
                        <span className="stake-badge stake-badge-vip">REAL POCKETS 3D</span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Historie:</span>
                        {history.map((h, i) => {
                            const color = getNumberColor(h);
                            const bg = color === 'green' ? '#059669' : (color === 'red' ? '#dc2626' : '#18181b');
                            return (
                                <span
                                    key={i}
                                    style={{
                                        background: bg,
                                        color: '#fff',
                                        width: '26px',
                                        height: '26px',
                                        borderRadius: '50%',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.75rem',
                                        fontWeight: 800,
                                        border: '1px solid rgba(255,255,255,0.2)'
                                    }}
                                >
                                    {h}
                                </span>
                            );
                        })}
                    </div>

                    <div style={{ color: 'var(--stake-green)', fontWeight: 800, fontSize: '1.1rem' }}>
                        {(balance / 100).toFixed(2)} €
                    </div>
                </div>
            </div>

            {/* 3D Realistic Roulette Wheel Stage */}
            <div style={{
                height: '320px',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: 'radial-gradient(circle at center, #1e293b 0%, #090e15 100%)',
                position: 'relative',
                border: '1px solid var(--border-subtle)',
                marginBottom: '22px'
            }}>
                <Canvas camera={{ position: [0, 4.4, 3.2], fov: 43 }}>
                    <ambientLight intensity={0.85} />
                    <directionalLight position={[6, 12, 6]} intensity={2.5} castShadow />
                    <directionalLight position={[-6, 8, -6]} intensity={1.2} />
                    <pointLight position={[0, 2.8, 0]} intensity={2.0} color="#fbbf24" />

                    <RealisticRouletteWheel 
                        isSpinning={spinning} 
                        winningNumber={winningNumber} 
                        onBallSettled={() => {}} 
                    />
                </Canvas>

                {/* Big winning number badge in corner */}
                {winningNumber !== null && (
                    <div style={{
                        position: 'absolute',
                        top: '16px',
                        left: '16px',
                        background: getNumberColor(winningNumber) === 'green' ? '#059669' : (getNumberColor(winningNumber) === 'red' ? '#dc2626' : '#111827'),
                        color: '#fff',
                        padding: '10px 22px',
                        borderRadius: '12px',
                        fontWeight: 900,
                        fontSize: '1.8rem',
                        boxShadow: '0 6px 25px rgba(0,0,0,0.7)',
                        border: '2px solid rgba(255,255,255,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        animation: 'pulseGlow 1.5s infinite ease'
                    }}>
                        <span>{winningNumber}</span>
                        <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#fbbf24' }}>
                            {getNumberColor(winningNumber)}
                        </span>
                    </div>
                )}

                {/* Status Bar */}
                <div style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(15, 33, 46, 0.92)',
                    backdropFilter: 'blur(8px)',
                    color: lastWin > 0 ? 'var(--stake-green)' : 'var(--text-white)',
                    padding: '8px 24px',
                    borderRadius: '24px',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    border: '1px solid var(--border-subtle)'
                }}>
                    {message}
                </div>
            </div>

            {/* Casino Felt Table */}
            <div style={{
                background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
                padding: '22px',
                borderRadius: 'var(--radius-md)',
                border: '3px solid #047857',
                boxShadow: 'inset 0 0 50px rgba(0,0,0,0.6)',
                marginBottom: '20px'
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: '8px', marginBottom: '10px' }}>
                    {/* 0 (Green) */}
                    <button
                        onClick={() => placeBet(0)}
                        style={{
                            background: bets.has(0) ? '#10b981' : '#059669',
                            color: '#fff',
                            border: bets.has(0) ? '3px solid #fbbf24' : '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '6px',
                            fontWeight: 900,
                            fontSize: '1.4rem',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <span>0</span>
                        {bets.has(0) && (
                            <span style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 800 }}>{bets.get(0)}€</span>
                        )}
                    </button>

                    {/* 1-36 Numbers grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(12, 1fr)',
                        gridTemplateRows: 'repeat(3, 46px)',
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
                                            background: hasBet ? (isRed ? '#ef4444' : '#334155') : (isRed ? '#dc2626' : '#18181b'),
                                            color: '#fff',
                                            border: hasBet ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.2)',
                                            borderRadius: '4px',
                                            fontWeight: 800,
                                            fontSize: '0.95rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <span>{num}</span>
                                        {hasBet && (
                                            <span style={{ fontSize: '0.65rem', color: '#fbbf24', marginTop: '-2px' }}>{bets.get(num)}€</span>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Dozens & Outside Bets */}
                <div style={{ marginLeft: '72px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                                    padding: '10px',
                                    borderRadius: '4px',
                                    border: bets.has(d.key as BetType) ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.25)',
                                    background: bets.has(d.key as BetType) ? 'rgba(245, 158, 11, 0.3)' : 'rgba(0,0,0,0.4)',
                                    color: '#fff',
                                    fontWeight: 800,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer'
                                }}
                            >
                                {d.label} {bets.has(d.key as BetType) && `(${bets.get(d.key as BetType)}€)`}
                            </button>
                        ))}
                    </div>

                    {/* Even-money bets */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                        {[
                            { key: '1-18', label: '1 - 18' },
                            { key: 'even', label: 'GERADE' },
                            { key: 'red', label: 'ROT', color: '#dc2626' },
                            { key: 'black', label: 'SCHWARZ', color: '#18181b' },
                            { key: 'odd', label: 'UNGERADE' },
                            { key: '19-36', label: '19 - 36' }
                        ].map(b => (
                            <button
                                key={b.key}
                                onClick={() => placeBet(b.key as BetType)}
                                style={{
                                    padding: '12px 4px',
                                    borderRadius: '4px',
                                    border: bets.has(b.key as BetType) ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.25)',
                                    background: b.color || (bets.has(b.key as BetType) ? 'rgba(245, 158, 11, 0.35)' : 'rgba(0,0,0,0.4)'),
                                    color: '#fff',
                                    fontWeight: 800,
                                    fontSize: '0.82rem',
                                    cursor: 'pointer'
                                }}
                            >
                                {b.label} {bets.has(b.key as BetType) && `(${bets.get(b.key as BetType)}€)`}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Chips & Controls */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Chip:</span>
                    {[0.5, 1, 5, 25, 100].map(val => (
                        <button
                            key={val}
                            onClick={() => { setSelectedChip(val); playRouletteAudio('chip'); }}
                            disabled={spinning}
                            style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '50%',
                                border: selectedChip === val ? '3px solid #fff' : '2px dashed rgba(255,255,255,0.4)',
                                background: val === 0.5 ? '#64748b' : (val === 1 ? '#0284c7' : (val === 5 ? '#dc2626' : (val === 25 ? '#16a34a' : '#1e1b4b'))),
                                color: '#fff',
                                fontWeight: 900,
                                fontSize: '0.8rem',
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Gesamteinsatz:</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-white)' }}>
                            {totalBetEur.toFixed(2)} €
                        </div>
                    </div>

                    <button
                        onClick={spinWheel}
                        disabled={spinning || totalBetEur <= 0}
                        className="stake-btn stake-btn-green glow-green"
                        style={{
                            padding: '14px 44px',
                            fontSize: '1.15rem',
                            fontWeight: 900,
                            letterSpacing: '0.5px'
                        }}
                    >
                        {spinning ? 'Kugel rollt...' : 'DREHEN'}
                    </button>
                </div>
            </div>
        </div>
    );
};
