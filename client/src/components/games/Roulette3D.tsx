import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Text, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { getRtpSettings } from '../../utils/rtpManager';

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
    const pocketMaterials = useRef<(THREE.MeshPhysicalMaterial | null)[]>([]);

    const rotorSpeed = useRef<number>(0.6);
    const ballSpeed = useRef<number>(0);
    const ballRadius = useRef<number>(2.45);
    const ballHeight = useRef<number>(0.55);
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
            // Realistic casino wheel colors
            const hexColor = colorType === 'green' ? '#00c853' : (colorType === 'red' ? '#d50000' : '#111111');
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
            ballRadius.current = 2.45;
            ballHeight.current = 0.55;
            rotorSpeed.current = 2.4;
            dropTimer.current = 0;
            settleTimer.current = 0;
            targetLocalAngle.current = numberToLocalAngle.get(targetNumber ?? 0) ?? 0;
        }
    }, [isSpinning, targetNumber, numberToLocalAngle]);

    useFrame((_, delta) => {
        const dt = Math.min(delta, 0.1);

        if (rotorRef.current) {
            rotorSpeed.current = THREE.MathUtils.lerp(rotorSpeed.current, isSpinning ? 1.2 : 0.4, dt * 0.5);
            rotorRef.current.rotation.y += rotorSpeed.current * dt;
        }

        // Animate winning pocket highlight
        pocketMaterials.current.forEach((mat, idx) => {
            if (mat) {
                if (ballState.current === 'settled' && pockets[idx].num === targetNumber) {
                    mat.emissive.setHex(0xfbbf24); // Gold glow
                    mat.emissiveIntensity = (Math.sin(performance.now() * 0.006) + 1) * 0.6 + 0.2; // Pulsing 0.2 to 1.4
                } else {
                    mat.emissiveIntensity = 0;
                }
            }
        });

        if (!ballRef.current || !rotorRef.current) return;

        if (ballState.current === 'rolling') {
            ballSpeed.current *= (1 - dt * 0.55);
            ballAngle.current -= ballSpeed.current * dt;

            if (ballSpeed.current < 4.0) {
                ballState.current = 'dropping';
                dropTimer.current = 0;
            }
        } else if (ballState.current === 'dropping') {
            dropTimer.current += dt;
            const dropDuration = 1.0;
            const t = Math.min(dropTimer.current / dropDuration, 1);
            const eased = easeOutCubic(t);

            ballRadius.current = THREE.MathUtils.lerp(2.45, 1.45, eased);
            ballHeight.current = THREE.MathUtils.lerp(0.55, 0.10, eased);
            ballSpeed.current = THREE.MathUtils.lerp(ballSpeed.current, rotorSpeed.current * 1.5, dt * 2.5);
            ballAngle.current -= ballSpeed.current * dt;

            // Chaotic multi-bounce during drop
            const bounceAmp = 0.12 * (1 - eased);
            const bounce = Math.abs(Math.sin(ballAngle.current * 25)) * bounceAmp;
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
            ballAngle.current += diff * Math.min(dt * 8, 1);

            ballRadius.current = THREE.MathUtils.lerp(ballRadius.current, 1.35, dt * 8);

            const settleBounce = Math.abs(Math.sin(t * Math.PI * 5)) * 0.04 * (1 - t);
            ballRef.current.position.y = 0.09 + settleBounce;

            if (t >= 1) {
                ballState.current = 'settled';
                ballAngle.current = targetWorldAngle;
            }
        } else if (ballState.current === 'settled') {
            ballAngle.current += rotorSpeed.current * dt;
            ballRef.current.position.y = 0.09;
        } else {
            ballAngle.current += rotorSpeed.current * dt;
        }

        ballRef.current.position.x = Math.cos(ballAngle.current) * ballRadius.current;
        ballRef.current.position.z = Math.sin(ballAngle.current) * ballRadius.current;
    });

    return (
        <group position={[0, -0.4, 0]}>
            {/* Outer Wood Rim */}
            <mesh position={[0, 0.7, 0]} receiveShadow>
                <torusGeometry args={[2.7, 0.25, 32, 128]} />
                <meshPhysicalMaterial 
                    color="#2a1005" 
                    roughness={0.15} 
                    metalness={0.1} 
                    clearcoat={0.8}
                    clearcoatRoughness={0.2}
                />
            </mesh>

            {/* Inner Sloped Bowl (where the ball rolls) */}
            <mesh position={[0, 0.35, 0]} receiveShadow>
                <cylinderGeometry args={[2.7, 1.8, 0.7, 128, 1, true]} />
                <meshPhysicalMaterial 
                    color="#1a0a03" 
                    roughness={0.1} 
                    metalness={0.2} 
                    clearcoat={1.0}
                    clearcoatRoughness={0.1}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* 8 Brass Diamond Deflectors on the slope */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                const a = (i * Math.PI) / 4;
                // Positioned on the inner slope
                return (
                    <mesh key={i} position={[Math.cos(a) * 2.25, 0.45, Math.sin(a) * 2.25]} rotation={[0, -a, 0]} castShadow>
                        <boxGeometry args={[0.06, 0.04, 0.16]} />
                        <meshStandardMaterial color="#fbbf24" metalness={1.0} roughness={0.1} />
                    </mesh>
                );
            })}

            {/* Rotating Rotor */}
            <group ref={rotorRef} position={[0, 0.05, 0]}>
                
                {/* Rotor Base / Number Ring Background */}
                <mesh position={[0, 0.15, 0]}>
                    {/* A cone for the number ring, sloping slightly downwards towards the center */}
                    <cylinderGeometry args={[1.78, 1.45, 0.15, 128]} />
                    <meshPhysicalMaterial 
                        color="#0f172a" 
                        roughness={0.2} 
                        metalness={0.6}
                        clearcoat={0.5}
                    />
                </mesh>

                {/* 37 Pockets and Numbers */}
                <group position={[0, 0.15, 0]}>
                    {pockets.map((p, idx) => {
                        const midAngle = p.midAngle;
                        
                        // Pocket color slice (using a thin cylinder segment)
                        const thetaLength = (Math.PI * 2) / 37;
                        
                        return (
                            <group key={idx}>
                                {/* Pocket colored base */}
                                <mesh position={[0, 0, 0]} rotation={[0, -p.angle, 0]}>
                                    <cylinderGeometry args={[1.45, 1.25, 0.15, 3, 1, false, 0, thetaLength]} />
                                    <meshPhysicalMaterial 
                                        ref={(el) => pocketMaterials.current[idx] = el}
                                        color={p.hexColor} 
                                        roughness={0.1} 
                                        metalness={0.1} 
                                        clearcoat={0.8}
                                        clearcoatRoughness={0.1}
                                    />
                                </mesh>

                                {/* Pocket Number Text on the sloped ring */}
                                <Text
                                    position={[Math.cos(midAngle) * 1.62, 0.076, Math.sin(midAngle) * 1.62]}
                                    rotation={[-1.2, 0, -midAngle + Math.PI / 2]}
                                    fontSize={0.09}
                                    color="#ffffff"
                                    anchorX="center"
                                    anchorY="middle"
                                    outlineWidth={0.005}
                                    outlineColor="#000000"
                                >
                                    {p.num.toString()}
                                </Text>

                                {/* Brass Fret (Separator between pockets) */}
                                <mesh position={[Math.cos(p.angle) * 1.35, 0.08, Math.sin(p.angle) * 1.35]} rotation={[0, -p.angle, 0]}>
                                    <boxGeometry args={[0.02, 0.16, 0.22]} />
                                    <meshStandardMaterial color="#fbbf24" metalness={1.0} roughness={0.1} />
                                </mesh>
                            </group>
                        );
                    })}
                </group>

                {/* Center Turret (The gold cross/cone in the middle) */}
                {/* Turret Base */}
                <mesh position={[0, 0.25, 0]}>
                    <cylinderGeometry args={[1.25, 1.25, 0.1, 64]} />
                    <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.5} />
                </mesh>
                
                {/* Turret Cone */}
                <mesh position={[0, 0.45, 0]} castShadow>
                    <coneGeometry args={[0.55, 0.5, 64]} />
                    <meshStandardMaterial color="#f59e0b" roughness={0.1} metalness={0.9} />
                </mesh>
                <mesh position={[0, 0.7, 0]} castShadow>
                    <sphereGeometry args={[0.15, 32, 32]} />
                    <meshStandardMaterial color="#f59e0b" roughness={0.1} metalness={0.9} />
                </mesh>
                
                {/* Turret Crossbars */}
                <mesh position={[0, 0.45, 0]} castShadow>
                    <boxGeometry args={[1.4, 0.06, 0.06]} />
                    <meshStandardMaterial color="#fbbf24" roughness={0.1} metalness={0.9} />
                </mesh>
                <mesh position={[0, 0.45, 0]} castShadow>
                    <boxGeometry args={[0.06, 0.06, 1.4]} />
                    <meshStandardMaterial color="#fbbf24" roughness={0.1} metalness={0.9} />
                </mesh>
            </group>

            {/* Ivory Ball */}
            <mesh ref={ballRef} position={[2.45, 0.55, 0]} castShadow>
                <sphereGeometry args={[0.07, 32, 32]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    roughness={0.1}
                    metalness={0.0}
                    clearcoat={1.0}
                    clearcoatRoughness={0.05}
                />
            </mesh>
        </group>
    );
};

const DynamicCamera: React.FC<{ isSpinning: boolean }> = ({ isSpinning }) => {
    useFrame((state, delta) => {
        // Zoom in dynamically when spinning
        const targetZ = isSpinning ? 2.5 : 3.2;
        const targetY = isSpinning ? 3.9 : 4.4;
        state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, delta * 2);
        state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, delta * 2);
        state.camera.lookAt(0, -0.4, 0);
    });
    return null;
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

    const triggerWinAnimation = () => {
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#fbbf24', '#f59e0b', '#10b981', '#ffffff']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#fbbf24', '#f59e0b', '#10b981', '#ffffff']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
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

        const wonNumRandom = Math.floor(Math.random() * 37);
        let wonNum = wonNumRandom;
        const rtpSettings = getRtpSettings();

        if (rtpSettings.rouletteMode === 'FORCE_WIN') {
            const numberBets = Array.from(bets.keys()).filter(k => typeof k === 'number') as number[];
            if (numberBets.length > 0) {
                wonNum = numberBets[Math.floor(Math.random() * numberBets.length)];
            } else if (bets.has('red')) {
                const reds = Array.from(RED_NUMBERS);
                wonNum = reds[Math.floor(Math.random() * reds.length)];
            } else if (bets.has('black')) {
                const blacks = Array.from({ length: 36 }, (_, i) => i + 1).filter(n => !RED_NUMBERS.has(n));
                wonNum = blacks[Math.floor(Math.random() * blacks.length)];
            }
        } else if (rtpSettings.rouletteMode === 'FORCE_LOSS') {
            const unbetNumbers = Array.from({ length: 37 }, (_, i) => i).filter(n => !bets.has(n as any));
            if (unbetNumbers.length > 0) {
                wonNum = unbetNumbers[Math.floor(Math.random() * unbetNumbers.length)];
            }
        } else if (Math.random() < (rtpSettings.rouletteWinChance / 100) && bets.size > 0) {
            const numberBets = Array.from(bets.keys()).filter(k => typeof k === 'number') as number[];
            if (numberBets.length > 0) {
                wonNum = numberBets[Math.floor(Math.random() * numberBets.length)];
            }
        }

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
                const isBigWin = winCents >= betCents * 5;
                if (isBigWin) {
                    triggerBigWinAnimation();
                } else {
                    triggerWinAnimation();
                }
                setMessage(`🎉 ${wonNum} ${wonColor.toUpperCase()}! Gewinn: +${totalWinEur.toFixed(2)} €!`);
            } else {
                setMessage(`${wonNum} ${wonColor.toUpperCase()}. Kein Gewinn.`);
            }
        }, 3400);
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
                    const betCents = Math.round(totalBetEur * 100);
                    if (balance >= betCents && betCents > 0) {
                        spinWheel();
                    } else {
                        setAutoSpinning(false);
                    }
                }
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [spinning, balance, totalBetEur]);

    const toggleAutoSpin = () => {
        if (!autoSpinning) {
            setAutoSpinning(true);
            if (!spinning && totalBetEur > 0) spinWheel();
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

    const isBigWinNow = lastWin >= Math.round(totalBetEur * 100) * 5 && lastWin > 0;

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            padding: '24px',
            maxWidth: '1140px',
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
                    animation: 'fadeIn 0.5s ease-out',
                    borderRadius: 'var(--radius-lg)'
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
                            const bg = color === 'green' ? '#00c853' : (color === 'red' ? '#d50000' : '#111111');
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

                    <div style={{ color: 'var(--stake-green)', fontWeight: 900, fontSize: '1.15rem' }}>
                        {(balance / 100).toFixed(2)} €
                    </div>
                </div>
            </div>

            {/* 3D Wheel Stage */}
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
                    <DynamicCamera isSpinning={spinning} />
                    <ambientLight intensity={1.1} />
                    <directionalLight position={[6, 12, 6]} intensity={3.0} castShadow />
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
                        background: getNumberColor(winningNumber) === 'green' ? '#00c853' : (getNumberColor(winningNumber) === 'red' ? '#d50000' : '#111111'),
                        color: '#fff',
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
                background: '#047857',
                padding: '15px',
                borderRadius: '8px',
                border: '6px solid #022c22',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
                marginBottom: '20px',
                position: 'relative'
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '60px repeat(12, 1fr) 60px',
                    gridTemplateRows: 'repeat(5, 50px)',
                    gap: '2px',
                    background: '#ffffff',
                    border: '2px solid #ffffff'
                }}>
                    {/* 0 (Green) */}
                    <button
                        onClick={() => placeBet(0)}
                        disabled={spinning || autoSpinning}
                        style={{
                            gridColumn: '1 / 2',
                            gridRow: '1 / 4',
                            background: '#059669',
                            color: '#fff',
                            border: 'none',
                            fontWeight: 900,
                            fontSize: '1.6rem',
                            cursor: (spinning || autoSpinning) ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                        }}
                    >
                        <span>0</span>
                        {winningNumber === 0 && <span style={{ position: 'absolute', top: '2px', right: '2px', fontSize: '1rem' }}>📌</span>}
                        {bets.has(0) && <span style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 900, background: 'rgba(0,0,0,0.5)', padding: '2px 4px', borderRadius: '4px' }}>{bets.get(0)}€</span>}
                    </button>

                    {/* 1-36 Numbers */}
                    {[
                        [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
                        [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
                        [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]
                    ].map((row, rowIndex) =>
                        row.map((num, colIndex) => {
                            const isRed = RED_NUMBERS.has(num);
                            const hasBet = bets.has(num);
                            const isWinner = winningNumber === num;
                            return (
                                <button
                                    key={num}
                                    onClick={() => placeBet(num)}
                                    disabled={spinning || autoSpinning}
                                    style={{
                                        gridRow: rowIndex + 1,
                                        gridColumn: colIndex + 2,
                                        background: isRed ? '#d50000' : '#111111',
                                        color: '#ffffff',
                                        border: 'none',
                                        fontWeight: 900,
                                        fontSize: '1.2rem',
                                        cursor: (spinning || autoSpinning) ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'relative',
                                        boxShadow: isWinner ? 'inset 0 0 15px #fbbf24' : 'none',
                                        animation: isWinner ? 'pulseGlow 1s infinite' : 'none',
                                        zIndex: isWinner ? 10 : 1
                                    }}
                                >
                                    <span style={{ transform: 'rotate(-90deg)' }}>{num}</span>
                                    {isWinner && <span style={{ position: 'absolute', top: '2px', right: '2px', fontSize: '0.85rem' }}>📌</span>}
                                    {hasBet && <span style={{ position: 'absolute', bottom: '2px', fontSize: '0.65rem', color: '#fbbf24', fontWeight: 900, background: 'rgba(0,0,0,0.6)', padding: '1px 3px', borderRadius: '4px', transform: 'rotate(-90deg)' }}>{bets.get(num)}€</span>}
                                </button>
                            );
                        })
                    )}

                    {/* 2:1 Column Bets */}
                    {[
                        { key: 'row3', label: '2:1', row: 1 },
                        { key: 'row2', label: '2:1', row: 2 },
                        { key: 'row1', label: '2:1', row: 3 }
                    ].map((btn) => (
                        <button
                            key={btn.key}
                            disabled={spinning || autoSpinning}
                            style={{
                                gridRow: btn.row,
                                gridColumn: '14 / 15',
                                background: '#047857',
                                color: '#fff',
                                border: 'none',
                                fontWeight: 800,
                                fontSize: '1rem',
                                cursor: 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative'
                            }}
                        >
                            <span style={{ transform: 'rotate(-90deg)' }}>{btn.label}</span>
                        </button>
                    ))}

                    {/* Dozens */}
                    {[
                        { key: '1st12', label: '1st 12', colStart: 2, colEnd: 6 },
                        { key: '2nd12', label: '2nd 12', colStart: 6, colEnd: 10 },
                        { key: '3rd12', label: '3rd 12', colStart: 10, colEnd: 14 }
                    ].map(d => (
                        <button
                            key={d.key}
                            onClick={() => placeBet(d.key as BetType)}
                            disabled={spinning || autoSpinning}
                            style={{
                                gridRow: '4 / 5',
                                gridColumn: `${d.colStart} / ${d.colEnd}`,
                                background: '#047857',
                                color: '#fff',
                                border: 'none',
                                fontWeight: 800,
                                fontSize: '1.2rem',
                                cursor: (spinning || autoSpinning) ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative'
                            }}
                        >
                            {d.label}
                            {bets.has(d.key as BetType) && <span style={{ position: 'absolute', right: '10px', fontSize: '0.8rem', color: '#fbbf24', background: 'rgba(0,0,0,0.6)', padding: '2px 4px', borderRadius: '4px' }}>{bets.get(d.key as BetType)}€</span>}
                        </button>
                    ))}

                    {/* Outside Bets */}
                    {[
                        { key: '1-18', label: '1 to 18', colStart: 2, colEnd: 4 },
                        { key: 'even', label: 'EVEN', colStart: 4, colEnd: 6 },
                        { key: 'red', label: 'RED', colStart: 6, colEnd: 8, bg: '#d50000' },
                        { key: 'black', label: 'BLACK', colStart: 8, colEnd: 10, bg: '#111111' },
                        { key: 'odd', label: 'ODD', colStart: 10, colEnd: 12 },
                        { key: '19-36', label: '19 to 36', colStart: 12, colEnd: 14 }
                    ].map(b => (
                        <button
                            key={b.key}
                            onClick={() => placeBet(b.key as BetType)}
                            disabled={spinning || autoSpinning}
                            style={{
                                gridRow: '5 / 6',
                                gridColumn: `${b.colStart} / ${b.colEnd}`,
                                background: b.bg || '#047857',
                                color: '#fff',
                                border: 'none',
                                fontWeight: 800,
                                fontSize: '1.1rem',
                                cursor: (spinning || autoSpinning) ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative'
                            }}
                        >
                            {b.label !== 'RED' && b.label !== 'BLACK' ? b.label : ''}
                            {bets.has(b.key as BetType) && <span style={{ position: 'absolute', right: '10px', fontSize: '0.8rem', color: '#fbbf24', background: 'rgba(0,0,0,0.6)', padding: '2px 4px', borderRadius: '4px' }}>{bets.get(b.key as BetType)}€</span>}
                        </button>
                    ))}

                    {/* Empty corner bottom right */}
                    <div style={{ gridRow: '4 / 6', gridColumn: '14 / 15', background: '#047857' }}></div>
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
                            disabled={spinning || autoSpinning}
                            style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '50%',
                                border: selectedChip === val ? '3px solid #fff' : '2px dashed rgba(255,255,255,0.4)',
                                background: val === 0.5 ? '#64748b' : (val === 1 ? '#0284c7' : (val === 5 ? '#ef4444' : (val === 25 ? '#16a34a' : '#1e1b4b'))),
                                color: '#fff',
                                fontWeight: 900,
                                fontSize: '0.8rem',
                                cursor: (spinning || autoSpinning) ? 'not-allowed' : 'pointer',
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
                        disabled={spinning || autoSpinning || totalBetEur === 0}
                        className="stake-btn stake-btn-secondary"
                        style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                    >
                        Löschen
                    </button>
                    <button
                        onClick={doubleBets}
                        disabled={spinning || autoSpinning || totalBetEur === 0}
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
                        onClick={toggleAutoSpin}
                        className={autoSpinning ? "stake-btn stake-btn-secondary" : "stake-btn stake-btn-secondary"}
                        style={{
                            padding: '14px 24px',
                            fontSize: '1rem',
                            fontWeight: 800,
                            border: autoSpinning ? '2px solid #ef4444' : '2px solid transparent',
                            color: autoSpinning ? '#ef4444' : '#fff'
                        }}
                    >
                        {autoSpinning ? '⏹ AUTO STOP' : '🔄 AUTO SPIN'}
                    </button>

                    <button
                        onClick={spinWheel}
                        disabled={spinning || autoSpinning || totalBetEur <= 0}
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