import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Text, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// European Roulette Numbers in exact wheel pocket order
const ROULETTE_NUMBERS = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
    5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

function getNumberColor(num: number): 'green' | 'red' | 'black' {
    if (num === 0) return 'green';
    return RED_NUMBERS.has(num) ? 'red' : 'black';
}

function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
}

interface Wheel3DProps {
    isSpinning: boolean;
    targetNumber: number | null;
}

// Photorealistic 3D Roulette Wheel with Vibrant Glossy Red, Black & Green Pockets
const PhotorealisticRouletteWheel: React.FC<Wheel3DProps> = ({ isSpinning, targetNumber }) => {
    const rotorRef = useRef<THREE.Group>(null!);
    const ballRef = useRef<THREE.Mesh>(null!);

    const rotorSpeed = useRef<number>(0.6);
    const ballSpeed = useRef<number>(0);
    const ballRadius = useRef<number>(2.05);
    const ballHeight = useRef<number>(0.32);
    const ballAngle = useRef<number>(0);
    const ballState = useRef<'idle' | 'rolling' | 'dropping' | 'settling' | 'settled'>('idle');

    const dropTimer = useRef<number>(0);
    const settleTimer = useRef<number>(0);
    const targetLocalAngle = useRef<number>(0);

    // 37 pockets with vibrant casino hex colors
    const pockets = useMemo(() => {
        const count = ROULETTE_NUMBERS.length;
        const angleStep = (Math.PI * 2) / count;
        return ROULETTE_NUMBERS.map((num, i) => {
            const colorType = getNumberColor(num);
            // Ultra-vibrant colors: Neon Green 0 (#00e701), Casino Crimson Red (#ef4444), Onyx Black (#09090b)
            const hexColor = colorType === 'green' ? '#00e701' : (colorType === 'red' ? '#ef4444' : '#09090b');
            const angle = i * angleStep;
            return {
                num,
                colorType,
                hexColor,
                angle,
                midAngle: angle + angleStep / 2
            };
        });
    }, []);

    const numberToLocalAngle = useMemo(() => {
        const map = new Map<number, number>();
        pockets.forEach(p => map.set(p.num, p.midAngle));
        return map;
    }, [pockets]);

    useEffect(() => {
        if (isSpinning) {
            ballState.current = 'rolling';
            ballSpeed.current = 14.0;
            ballRadius.current = 2.05;
            ballHeight.current = 0.32;
            rotorSpeed.current = 2.4;
            dropTimer.current = 0;
            settleTimer.current = 0;
            targetLocalAngle.current = numberToLocalAngle.get(targetNumber ?? 0) ?? 0;
        }
    }, [isSpinning, targetNumber, numberToLocalAngle]);

    useFrame((_, delta) => {
        const dt = Math.min(delta, 0.1);

        if (rotorRef.current) {
            rotorSpeed.current = THREE.MathUtils.lerp(rotorSpeed.current, isSpinning ? 1.0 : 0.4, dt * 0.5);
            rotorRef.current.rotation.y += rotorSpeed.current * dt;
        }

        if (!ballRef.current || !rotorRef.current) return;

        if (ballState.current === 'rolling') {
            ballSpeed.current *= (1 - dt * 0.75);
            ballAngle.current -= ballSpeed.current * dt;

            if (ballSpeed.current < 4.0) {
                ballState.current = 'dropping';
                dropTimer.current = 0;
            }
        } else if (ballState.current === 'dropping') {
            dropTimer.current += dt;
            const dropDuration = 1.1;
            const t = Math.min(dropTimer.current / dropDuration, 1);
            const eased = easeOutCubic(t);

            ballRadius.current = THREE.MathUtils.lerp(2.05, 1.60, eased);
            ballHeight.current = THREE.MathUtils.lerp(0.32, 0.10, eased);
            ballSpeed.current = THREE.MathUtils.lerp(ballSpeed.current, rotorSpeed.current * 1.4, dt * 2.2);
            ballAngle.current -= ballSpeed.current * dt;

            const bounceAmp = 0.055 * (1 - eased);
            const bounce = Math.abs(Math.sin(ballAngle.current * 18.5)) * bounceAmp;
            ballRef.current.position.y = ballHeight.current + bounce;

            if (t >= 1) {
                ballState.current = 'settling';
                settleTimer.current = 0;
            }
        } else if (ballState.current === 'settling') {
            settleTimer.current += dt;
            const settleDuration = 0.6;
            const t = Math.min(settleTimer.current / settleDuration, 1);

            const targetWorldAngle = targetLocalAngle.current + rotorRef.current.rotation.y;
            let diff = ((targetWorldAngle - ballAngle.current + Math.PI) % (Math.PI * 2)) - Math.PI;
            ballAngle.current += diff * Math.min(dt * 6, 1);

            ballRadius.current = THREE.MathUtils.lerp(ballRadius.current, 1.50, dt * 5);

            const settleBounce = Math.abs(Math.sin(t * Math.PI * 3)) * 0.028 * (1 - t);
            ballRef.current.position.y = 0.085 + settleBounce;

            if (t >= 1) {
                ballState.current = 'settled';
                ballAngle.current = targetWorldAngle;
            }
        } else if (ballState.current === 'settled') {
            ballAngle.current += rotorSpeed.current * dt;
            ballRef.current.position.y = 0.085;
        } else {
            ballAngle.current += rotorSpeed.current * dt;
        }

        ballRef.current.position.x = Math.cos(ballAngle.current) * ballRadius.current;
        ballRef.current.position.z = Math.sin(ballAngle.current) * ballRadius.current;
    });

    return (
        <group position={[0, -0.2, 0]}>
            {/* Outer Polished Mahogany Wood Bowl */}
            <mesh receiveShadow>
                <cylinderGeometry args={[2.55, 2.75, 0.5, 48]} />
                <meshStandardMaterial color="#381808" roughness={0.2} metalness={0.3} />
            </mesh>
            <mesh position={[0, 0.26, 0]}>
                <torusGeometry args={[2.55, 0.12, 16, 48]} />
                <meshStandardMaterial color="#270e03" roughness={0.15} metalness={0.4} />
            </mesh>

            {/* Brass Outer Track Flange */}
            <mesh position={[0, 0.16, 0]}>
                <cylinderGeometry args={[2.42, 2.42, 0.38, 48, 1, true]} />
                <meshStandardMaterial color="#fbbf24" metalness={0.92} roughness={0.08} />
            </mesh>

            {/* 8 Brass Diamond Deflectors (Pins) */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                const a = (i * Math.PI) / 4;
                return (
                    <mesh key={i} position={[Math.cos(a) * 2.2, 0.24, Math.sin(a) * 2.2]}>
                        <boxGeometry args={[0.08, 0.08, 0.14]} />
                        <meshStandardMaterial color="#f59e0b" metalness={0.95} roughness={0.05} />
                    </mesh>
                );
            })}

            {/* Rotating Rotor */}
            <group ref={rotorRef} position={[0, 0.08, 0]}>
                <mesh position={[0, 0.02, 0]}>
                    <cylinderGeometry args={[1.65, 2.2, 0.24, 48]} />
                    <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.7} />
                </mesh>

                {/* 37 Vibrant Colored Pockets with Glossy Finish */}
                <group position={[0, 0.04, 0]}>
                    {pockets.map((p, idx) => {
                        const midAngle = p.midAngle;
                        const r = 1.58;
                        const px = Math.cos(midAngle) * r;
                        const pz = Math.sin(midAngle) * r;

                        return (
                            <group key={idx}>
                                {/* Pocket colored box - Glossy High-Contrast Red, Black, Green */}
                                <mesh position={[px, 0.045, pz]} rotation={[0, -midAngle, 0]}>
                                    <boxGeometry args={[0.24, 0.05, 0.34]} />
                                    <meshStandardMaterial 
                                        color={p.hexColor} 
                                        roughness={0.1} 
                                        metalness={0.1} 
                                        emissive={p.hexColor}
                                        emissiveIntensity={0.25}
                                    />
                                </mesh>

                                {/* Pocket Number Text */}
                                <Text
                                    position={[Math.cos(midAngle) * 1.78, 0.1, Math.sin(midAngle) * 1.78]}
                                    rotation={[-Math.PI / 2, 0, -midAngle + Math.PI / 2]}
                                    fontSize={0.12}
                                    color="#ffffff"
                                    anchorX="center"
                                    anchorY="middle"
                                >
                                    {p.num.toString()}
                                </Text>

                                {/* Brass Fret separator bar */}
                                <mesh position={[Math.cos(p.angle) * 1.62, 0.085, Math.sin(p.angle) * 1.62]} rotation={[0, -p.angle, 0]}>
                                    <boxGeometry args={[0.03, 0.05, 0.38]} />
                                    <meshStandardMaterial color="#fbbf24" metalness={0.98} roughness={0.05} />
                                </mesh>
                            </group>
                        );
                    })}
                </group>

                {/* Center Gold Turret */}
                <mesh position={[0, 0.28, 0]}>
                    <coneGeometry args={[0.65, 0.65, 36]} />
                    <meshStandardMaterial color="#f59e0b" roughness={0.08} metalness={0.95} />
                </mesh>
                <mesh position={[0, 0.52, 0]}>
                    <boxGeometry args={[1.5, 0.07, 0.07]} />
                    <meshStandardMaterial color="#fbbf24" roughness={0.08} metalness={0.95} />
                </mesh>
                <mesh position={[0, 0.52, 0]}>
                    <boxGeometry args={[0.07, 0.07, 1.5]} />
                    <meshStandardMaterial color="#fbbf24" roughness={0.08} metalness={0.95} />
                </mesh>
            </group>

            {/* Ivory Ball */}
            <mesh ref={ballRef} position={[2.05, 0.32, 0]} castShadow>
                <sphereGeometry args={[0.08, 32, 32]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    roughness={0.05}
                    metalness={0.05}
                    clearcoat={1}
                    clearcoatRoughness={0.05}
                />
            </mesh>
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
    const [targetNumber, setTargetNumber] = useState<number | null>(null);
    const [winningNumber, setWinningNumber] = useState<number | null>(null);
    const [lastWin, setLastWin] = useState<number>(0);
    const [history, setHistory] = useState<number[]>([14, 2, 0, 31, 9, 22, 17]);
    const [message, setMessage] = useState<string>('Platziere deine Krypto-Chips auf dem Roulettetisch!');

    const totalBetEur = Array.from(bets.values()).reduce((sum, v) => sum + v, 0);

    const playAudio = (type: 'chip' | 'spin' | 'win') => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            if (type === 'chip') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(750, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.05);
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
                osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 1.2);
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
        } catch (e) { }
    };

    const placeBet = (type: BetType) => {
        if (spinning) return;
        const currentBet = bets.get(type) || 0;
        const newTotal = totalBetEur + selectedChip;
        if (newTotal * 100 > balance) {
            alert('Nicht genügend Guthaben!');
            return;
        }

        playAudio('chip');
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
        playAudio('chip');
        setBets(newBets);
    };

    const spinWheel = () => {
        if (spinning || totalBetEur <= 0) return;

        const betCents = Math.round(totalBetEur * 100);
        if (balance < betCents) return;

        const balanceAfterBet = balance - betCents;
        setBalance(balanceAfterBet);
        if (onUpdateBalance) onUpdateBalance(balanceAfterBet);

        const wonNum = Math.floor(Math.random() * 37);
        const wonColor = getNumberColor(wonNum);

        setTargetNumber(wonNum);
        setSpinning(true);
        setWinningNumber(null);
        setLastWin(0);
        setMessage('Kugel rollt durch den Kessel...');
        playAudio('spin');

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
                playAudio('win');
                setMessage(`🎉 ${wonNum} ${wonColor.toUpperCase()}! Gewinn: +${totalWinEur.toFixed(2)} €!`);
            } else {
                setMessage(`${wonNum} ${wonColor.toUpperCase()}. Kein Gewinn.`);
            }
        }, 3400);
    };

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            padding: '24px',
            maxWidth: '1140px',
            margin: '0 auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.65)'
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
                        <span className="stake-badge stake-badge-vip">REAL POCKETS 3D</span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Historie:</span>
                        {history.map((h, i) => {
                            const color = getNumberColor(h);
                            const bg = color === 'green' ? '#00e701' : (color === 'red' ? '#ef4444' : '#09090b');
                            return (
                                <span
                                    key={i}
                                    style={{
                                        background: bg,
                                        color: color === 'green' ? '#000' : '#fff',
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

                    <div style={{ color: 'var(--stake-green)', fontWeight: 900, fontSize: '1.15rem' }}>
                        {(balance / 100).toFixed(2)} €
                    </div>
                </div>
            </div>

            {/* 3D Wheel Stage with Direct Overhead Spotlight */}
            <div style={{
                height: '350px',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: 'radial-gradient(circle at center, #1e293b 0%, #080c14 100%)',
                position: 'relative',
                border: '1px solid var(--border-subtle)',
                marginBottom: '22px'
            }}>
                <Canvas camera={{ position: [0, 4.4, 3.2], fov: 43 }}>
                    <ambientLight intensity={1.1} />
                    <directionalLight position={[6, 12, 6]} intensity={3.0} castShadow />
                    {/* Direct Overhead Spotlight for vivid reflection on Red & Black pockets */}
                    <spotLight position={[0, 5, 0]} intensity={4.5} angle={0.6} penumbra={0.5} color="#ffffff" castShadow />
                    <pointLight position={[0, 2.8, 0]} intensity={2.8} color="#fbbf24" />

                    <PhotorealisticRouletteWheel
                        isSpinning={spinning}
                        targetNumber={targetNumber}
                    />
                    <Environment preset="night" />
                    <ContactShadows position={[0, -0.6, 0]} opacity={0.6} scale={6} blur={1.5} />
                </Canvas>

                {/* Winning number badge */}
                {winningNumber !== null && (
                    <div style={{
                        position: 'absolute',
                        top: '16px',
                        left: '16px',
                        background: getNumberColor(winningNumber) === 'green' ? '#00e701' : (getNumberColor(winningNumber) === 'red' ? '#ef4444' : '#111827'),
                        color: getNumberColor(winningNumber) === 'green' ? '#000' : '#fff',
                        padding: '10px 24px',
                        borderRadius: '12px',
                        fontWeight: 900,
                        fontSize: '1.8rem',
                        boxShadow: '0 6px 25px rgba(0,0,0,0.7)',
                        border: '2px solid rgba(255,255,255,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
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

            {/* High-Contrast Casino Felt Table Layout */}
            <div style={{
                background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
                padding: '22px',
                borderRadius: 'var(--radius-md)',
                border: '3px solid #047857',
                boxShadow: 'inset 0 0 50px rgba(0,0,0,0.6)',
                marginBottom: '20px',
                position: 'relative'
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: '68px 1fr', gap: '8px', marginBottom: '10px' }}>
                    {/* 0 (Green) */}
                    <button
                        onClick={() => placeBet(0)}
                        style={{
                            background: bets.has(0) ? '#00e701' : '#059669',
                            color: '#000',
                            border: bets.has(0) ? '3px solid #fbbf24' : '2px solid #00e701',
                            borderRadius: '6px',
                            fontWeight: 900,
                            fontSize: '1.4rem',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative'
                        }}
                    >
                        <span>0</span>
                        {winningNumber === 0 && (
                            <span style={{ position: 'absolute', top: '2px', right: '2px', fontSize: '1rem' }}>📌</span>
                        )}
                        {bets.has(0) && (
                            <span style={{ fontSize: '0.72rem', color: '#000', fontWeight: 900 }}>{bets.get(0)}€</span>
                        )}
                    </button>

                    {/* 1-36 Numbers grid with vivid Red (#ef4444) and Onyx Black (#09090b) */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(12, 1fr)',
                        gridTemplateRows: 'repeat(3, 48px)',
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
                                const isWinner = winningNumber === num;
                                return (
                                    <button
                                        key={num}
                                        onClick={() => placeBet(num)}
                                        style={{
                                            background: isWinner ? '#f59e0b' : (isRed ? '#ef4444' : '#09090b'),
                                            color: isWinner ? '#000' : '#ffffff',
                                            border: isWinner ? '3px solid #fff' : (hasBet ? '2px solid #fbbf24' : (isRed ? '1px solid #f87171' : '1px solid #334155')),
                                            borderRadius: '4px',
                                            fontWeight: 900,
                                            fontSize: '1.05rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            position: 'relative',
                                            boxShadow: isWinner ? '0 0 20px #f59e0b' : 'none'
                                        }}
                                    >
                                        <span>{num}</span>
                                        {isWinner && (
                                            <span style={{ position: 'absolute', top: '2px', right: '2px', fontSize: '0.85rem' }}>📌</span>
                                        )}
                                        {hasBet && (
                                            <span style={{ fontSize: '0.65rem', color: isWinner ? '#000' : '#fbbf24', marginTop: '-2px', fontWeight: 900 }}>{bets.get(num)}€</span>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Dozens & Outside Bets */}
                <div style={{ marginLeft: '76px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                                    background: bets.has(d.key as BetType) ? 'rgba(245, 158, 11, 0.3)' : 'rgba(0,0,0,0.5)',
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
                            { key: 'red', label: 'ROT', color: '#ef4444' },
                            { key: 'black', label: 'SCHWARZ', color: '#09090b' },
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
                                    background: b.color || (bets.has(b.key as BetType) ? 'rgba(245, 158, 11, 0.35)' : 'rgba(0,0,0,0.5)'),
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

            {/* Chips & Action Controls */}
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
                            onClick={() => { setSelectedChip(val); playAudio('chip'); }}
                            disabled={spinning}
                            style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '50%',
                                border: selectedChip === val ? '3px solid #fff' : '2px dashed rgba(255,255,255,0.4)',
                                background: val === 0.5 ? '#64748b' : (val === 1 ? '#0284c7' : (val === 5 ? '#ef4444' : (val === 25 ? '#16a34a' : '#1e1b4b'))),
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