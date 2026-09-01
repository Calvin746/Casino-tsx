import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 8 Classical Casino Symbols mapped around the cylinder (45 degrees per symbol)
const SYMBOLS = ['7️⃣', '💎', '👑', '🍒', '🔔', '⭐', '🍇', 'BAR'];

// Creates a real canvas texture with the casino symbols printed along the strip
function createReelTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Background metallic gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 256, 0);
    bgGrad.addColorStop(0, '#fef08a');
    bgGrad.addColorStop(0.5, '#ffffff');
    bgGrad.addColorStop(1, '#fef08a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 256, 1024);

    // Draw symbol slots
    const slotHeight = 1024 / SYMBOLS.length;

    SYMBOLS.forEach((sym, idx) => {
        const y = idx * slotHeight;

        // Separator line
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(0, y, 256, 3);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(0, y + 3, 256, 1);

        // Draw symbol
        ctx.font = 'bold 74px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#0f172a';

        if (sym === 'BAR') {
            ctx.fillStyle = '#b91c1c';
            ctx.font = '900 48px Arial, sans-serif';
            ctx.fillText('BAR', 128, y + slotHeight / 2);
        } else {
            ctx.fillText(sym, 128, y + slotHeight / 2);
        }
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

interface SingleReelProps {
    position: [number, number, number];
    isSpinning: boolean;
    stopDelay: number;
    finalSymbolIndex: number;
    onReelStopped: () => void;
    texture: THREE.CanvasTexture;
}

// Single Realistic 3D Reel with mechanical recoil bounce
const AnimatedSlotReel: React.FC<SingleReelProps> = ({
    position,
    isSpinning,
    stopDelay,
    finalSymbolIndex,
    onReelStopped,
    texture
}) => {
    const meshRef = useRef<THREE.Mesh>(null!);
    const stateRef = useRef<'idle' | 'windup' | 'spinning' | 'stopping' | 'stopped'>('idle');
    const angleRef = useRef<number>(0);
    const speedRef = useRef<number>(0);
    const timerRef = useRef<number>(0);
    const hasTriggeredStopRef = useRef<boolean>(false);

    useEffect(() => {
        if (isSpinning) {
            stateRef.current = 'windup';
            timerRef.current = 0;
            hasTriggeredStopRef.current = false;
        }
    }, [isSpinning]);

    useFrame((_, delta) => {
        const dt = Math.min(delta, 0.1);
        timerRef.current += dt;

        if (stateRef.current === 'windup') {
            // Slight reverse wind-up (anticipation recoil)
            speedRef.current = THREE.MathUtils.lerp(speedRef.current, -3.5, dt * 10);
            angleRef.current += speedRef.current * dt;

            if (timerRef.current > 0.15) {
                stateRef.current = 'spinning';
            }
        } else if (stateRef.current === 'spinning') {
            // Full speed blur
            speedRef.current = THREE.MathUtils.lerp(speedRef.current, 28.0, dt * 8);
            angleRef.current += speedRef.current * dt;

            // When stopDelay elapsed, initiate sharp recoil stop
            if (timerRef.current >= stopDelay && !isSpinning) {
                stateRef.current = 'stopping';
            }
        } else if (stateRef.current === 'stopping') {
            // Calculate target angle corresponding to the final symbol
            const step = (Math.PI * 2) / SYMBOLS.length;
            const targetAngle = Math.round(angleRef.current / step) * step + (finalSymbolIndex * step);

            speedRef.current = THREE.MathUtils.lerp(speedRef.current, 0, dt * 14);
            angleRef.current = THREE.MathUtils.lerp(angleRef.current, targetAngle, dt * 18);

            if (Math.abs(speedRef.current) < 0.2) {
                stateRef.current = 'stopped';
                angleRef.current = targetAngle;
                if (!hasTriggeredStopRef.current) {
                    hasTriggeredStopRef.current = true;
                    onReelStopped();
                }
            }
        }

        if (meshRef.current) {
            meshRef.current.rotation.x = angleRef.current;
        }
    });

    return (
        <group position={position}>
            {/* Cylinder with symbol texture */}
            <mesh ref={meshRef}>
                <cylinderGeometry args={[1.22, 1.22, 0.88, 36]} />
                <meshStandardMaterial 
                    map={texture} 
                    roughness={0.2} 
                    metalness={0.3} 
                />
            </mesh>
            {/* Golden Chrome outer bevels */}
            <mesh>
                <cylinderGeometry args={[1.25, 1.25, 0.06, 36]} />
                <meshStandardMaterial color="#f59e0b" metalness={0.92} roughness={0.08} />
            </mesh>
        </group>
    );
};

// 3D Cabinet with Animated Lever Arm and Chaser Lights
const MachineCabinet3D: React.FC<{
    isSpinning: boolean;
    leverPulled: boolean;
    reel1Stopped: boolean;
    reel2Stopped: boolean;
    reel3Stopped: boolean;
    onReel1Stop: () => void;
    onReel2Stop: () => void;
    onReel3Stop: () => void;
    reelResults: number[];
    texture: THREE.CanvasTexture;
}> = ({
    isSpinning,
    leverPulled,
    onReel1Stop,
    onReel2Stop,
    onReel3Stop,
    reelResults,
    texture
}) => {
    const leverArmRef = useRef<THREE.Group>(null!);
    const chaserLightsRef = useRef<THREE.Group>(null!);

    useFrame((_, delta) => {
        // Lever arm animation
        if (leverArmRef.current) {
            const targetRotation = leverPulled ? 0.85 : 0;
            leverArmRef.current.rotation.z = THREE.MathUtils.lerp(
                leverArmRef.current.rotation.z,
                targetRotation,
                delta * 14
            );
        }

        // Chaser lights pulsing
        if (chaserLightsRef.current) {
            chaserLightsRef.current.children.forEach((child: any, idx: number) => {
                if (child.material) {
                    const time = performance.now() * 0.008;
                    const val = (Math.sin(time + idx * 0.6) + 1) / 2;
                    child.material.emissiveIntensity = isSpinning ? val * 2.5 : 0.8;
                }
            });
        }
    });

    return (
        <group position={[0, 0, 0]}>
            {/* Main Metal Cabinet Body */}
            <mesh position={[0, 0, -0.6]} receiveShadow>
                <boxGeometry args={[5.2, 4.0, 1.4]} />
                <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
            </mesh>

            {/* Glowing Golden Arch / Top Crown */}
            <mesh position={[0, 2.15, -0.2]}>
                <boxGeometry args={[5.0, 0.7, 1.0]} />
                <meshStandardMaterial color="#1e1b4b" roughness={0.2} metalness={0.7} />
            </mesh>
            <mesh position={[0, 2.15, 0.28]}>
                <boxGeometry args={[4.6, 0.5, 0.08]} />
                <meshStandardMaterial color="#f59e0b" roughness={0.1} metalness={0.9} />
            </mesh>

            {/* Chaser LED Bulbs around the machine frame */}
            <group ref={chaserLightsRef} position={[0, 0, 0.25]}>
                {[-2.3, -1.5, -0.8, 0, 0.8, 1.5, 2.3].map((x, i) => (
                    <mesh key={`top-${i}`} position={[x, 1.7, 0]}>
                        <sphereGeometry args={[0.08, 12, 12]} />
                        <meshStandardMaterial 
                            color="#fbbf24" 
                            emissive="#fbbf24" 
                            emissiveIntensity={1.2} 
                        />
                    </mesh>
                ))}
                {[-2.3, -1.5, -0.8, 0, 0.8, 1.5, 2.3].map((x, i) => (
                    <mesh key={`bot-${i}`} position={[x, -1.7, 0]}>
                        <sphereGeometry args={[0.08, 12, 12]} />
                        <meshStandardMaterial 
                            color="#22c55e" 
                            emissive="#22c55e" 
                            emissiveIntensity={1.2} 
                        />
                    </mesh>
                ))}
            </group>

            {/* Polished Chrome Window Bezel */}
            <mesh position={[0, 0, 0.2]}>
                <boxGeometry args={[4.9, 2.7, 0.1]} />
                <meshStandardMaterial color="#334155" roughness={0.1} metalness={0.9} />
            </mesh>

            {/* 3 Physical Reels with Staggered Cascading Timing */}
            <AnimatedSlotReel
                position={[-1.6, 0, 0]}
                isSpinning={isSpinning}
                stopDelay={0.9} // Reel 1 stops first at 0.9s
                finalSymbolIndex={reelResults[0]}
                onReelStopped={onReel1Stop}
                texture={texture}
            />
            <AnimatedSlotReel
                position={[0, 0, 0]}
                isSpinning={isSpinning}
                stopDelay={1.6} // Reel 2 stops at 1.6s
                finalSymbolIndex={reelResults[1]}
                onReelStopped={onReel2Stop}
                texture={texture}
            />
            <AnimatedSlotReel
                position={[1.6, 0, 0]}
                isSpinning={isSpinning}
                stopDelay={2.3} // Reel 3 stops at 2.3s
                finalSymbolIndex={reelResults[2]}
                onReelStopped={onReel3Stop}
                texture={texture}
            />

            {/* Authentic Red Payline Indicator */}
            <mesh position={[0, 0, 1.25]}>
                <boxGeometry args={[4.8, 0.04, 0.02]} />
                <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.2} />
            </mesh>

            {/* Physical 3D Pull Lever (Right side) */}
            <group position={[2.8, -0.2, 0]}>
                {/* Lever Base Hub */}
                <mesh rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.22, 0.22, 0.3, 16]} />
                    <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
                </mesh>

                {/* Rotating Lever Arm */}
                <group ref={leverArmRef}>
                    <mesh position={[0.1, 0.7, 0]}>
                        <cylinderGeometry args={[0.045, 0.045, 1.4, 16]} />
                        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.05} />
                    </mesh>
                    {/* Red Grip Ball */}
                    <mesh position={[0.1, 1.45, 0]}>
                        <sphereGeometry args={[0.18, 16, 16]} />
                        <meshStandardMaterial color="#dc2626" roughness={0.1} metalness={0.4} />
                    </mesh>
                </group>
            </group>
        </group>
    );
};

interface SlotMachine3DProps {
    initialBalance: number;
    onBackToLobby?: () => void;
    onUpdateBalance?: (newBalance: number) => void;
    onOpenWallet?: () => void;
}

export const SlotMachine3D: React.FC<SlotMachine3DProps> = ({
    initialBalance,
    onBackToLobby,
    onUpdateBalance,
    onOpenWallet
}) => {
    const [spinning, setSpinning] = useState(false);
    const [leverPulled, setLeverPulled] = useState(false);
    const [balance, setBalance] = useState<number>(initialBalance || 10000);
    const [betEur, setBetEur] = useState<number>(1.00);
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [lastWin, setLastWin] = useState<number>(0);
    const [isJackpot, setIsJackpot] = useState<boolean>(false);
    const [reelResults, setReelResults] = useState<number[]>([0, 1, 2]);
    const [winningSymbols, setWinningSymbols] = useState<string[] | null>(null);

    const reelTexture = useMemo(() => createReelTexture(), []);

    // Audio synthesizer for authentic slot machine sounds
    const playAudio = (type: 'lever' | 'spin' | 'clack' | 'win' | 'coin') => {
        if (!soundEnabled) return;
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            if (type === 'lever') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(120, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.15);
            } else if (type === 'clack') {
                // Sharp mechanical reel stop
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(220, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.08);
                gain.gain.setValueAtTime(0.45, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.08);
            } else if (type === 'win') {
                [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.09);
                    gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.09);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.09 + 0.35);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(ctx.currentTime + i * 0.09);
                    osc.stop(ctx.currentTime + i * 0.09 + 0.35);
                });
            }
        } catch (e) {}
    };

    const handleSpin = async () => {
        const betCents = Math.round(betEur * 100);
        if (spinning || balance < betCents) {
            if (balance < betCents && onOpenWallet) onOpenWallet();
            return;
        }

        // Pull lever animation
        setLeverPulled(true);
        playAudio('lever');
        setTimeout(() => setLeverPulled(false), 300);

        setSpinning(true);
        setWinningSymbols(null);
        setLastWin(0);
        setIsJackpot(false);

        // Pick outcome
        const betDeducted = balance - betCents;
        setBalance(betDeducted);
        if (onUpdateBalance) onUpdateBalance(betDeducted);

        let finalIndexes = [
            Math.floor(Math.random() * SYMBOLS.length),
            Math.floor(Math.random() * SYMBOLS.length),
            Math.floor(Math.random() * SYMBOLS.length)
        ];

        // 35% chance to hit a winning pair or triplet
        if (Math.random() < 0.35) {
            const sym = Math.floor(Math.random() * 4); // 7, Diamant, Krone oder Kirsche
            finalIndexes = [sym, sym, Math.random() < 0.4 ? sym : Math.floor(Math.random() * SYMBOLS.length)];
        }

        setReelResults(finalIndexes);

        // Calculate winnings
        const s1 = SYMBOLS[finalIndexes[0]];
        const s2 = SYMBOLS[finalIndexes[1]];
        const s3 = SYMBOLS[finalIndexes[2]];

        let winCents = 0;
        if (s1 === s2 && s2 === s3) {
            winCents = (s1 === '7️⃣' || s1 === '👑') ? betCents * 30 : betCents * 15;
        } else if (s1 === s2 || s2 === s3 || s1 === s3) {
            winCents = Math.round(betCents * 2.2);
        }

        // Reel 3 completes after 2.4s
        setTimeout(() => {
            setSpinning(false);
            setWinningSymbols([s1, s2, s3]);
            setLastWin(winCents);
            const newBal = betDeducted + winCents;
            setBalance(newBal);
            if (onUpdateBalance) onUpdateBalance(newBal);

            if (winCents > betCents * 10) {
                setIsJackpot(true);
                playAudio('win');
            } else if (winCents > 0) {
                playAudio('win');
            }
        }, 2400);
    };

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '1060px',
            margin: '0 auto',
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)'
        }}>
            {/* Header */}
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
                        <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#f59e0b', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                            Royal 3D Physical Slot Machine
                        </h2>
                        <span className="stake-badge stake-badge-original">REAL MECHANICAL 3D</span>
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

                    <div style={{ color: 'var(--stake-green)', fontWeight: 800, fontSize: '1.1rem', marginLeft: '8px' }}>
                        {(balance / 100).toFixed(2)} €
                    </div>
                </div>
            </header>

            {/* 3D Realistic Slot Cabinet Stage with Animated Lever */}
            <div 
                onClick={handleSpin}
                title="Klicke auf den Automaten oder Hebel zum Drehen!"
                style={{
                    height: '430px',
                    position: 'relative',
                    background: 'radial-gradient(circle at center, #1b2636 0%, #060b11 100%)',
                    overflow: 'hidden',
                    cursor: spinning ? 'default' : 'pointer'
                }}
            >
                <Canvas camera={{ position: [0, 0, 6.0], fov: 45 }}>
                    <ambientLight intensity={0.7} />
                    <directionalLight position={[6, 10, 8]} intensity={2.4} castShadow />
                    <pointLight position={[0, 0, 3.8]} intensity={2.2} color="#fbbf24" />
                    <pointLight position={[-2.5, -1, 2.5]} intensity={1.5} color="#00e701" />

                    <MachineCabinet3D
                        isSpinning={spinning}
                        leverPulled={leverPulled}
                        reel1Stopped={!spinning}
                        reel2Stopped={!spinning}
                        reel3Stopped={!spinning}
                        onReel1Stop={() => playAudio('clack')}
                        onReel2Stop={() => playAudio('clack')}
                        onReel3Stop={() => playAudio('clack')}
                        reelResults={reelResults}
                        texture={reelTexture}
                    />
                </Canvas>

                {/* Marquee Header Ribbon */}
                <div style={{
                    position: 'absolute',
                    top: '16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #f59e0b 100%)',
                    color: '#000',
                    fontWeight: 900,
                    padding: '4px 32px',
                    borderRadius: '6px',
                    letterSpacing: '2px',
                    fontSize: '1rem',
                    boxShadow: '0 0 25px rgba(245, 158, 11, 0.8)',
                    border: '2px solid #fff',
                    pointerEvents: 'none'
                }}>
                    ★ VEGAS 777 CASINO JACKPOT ★
                </div>

                {/* Lever Click Prompt on right */}
                <div style={{
                    position: 'absolute',
                    right: '18px',
                    top: '45%',
                    background: 'rgba(0,0,0,0.6)',
                    color: '#f59e0b',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    pointerEvents: 'none'
                }}>
                    [ HEBEL ZIEHEN 🕹️ ]
                </div>

                {/* Win / Jackpot Banner Overlay */}
                {lastWin > 0 && !spinning && (
                    <div style={{
                        position: 'absolute',
                        bottom: '24px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: isJackpot ? 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)' : 'rgba(0, 231, 1, 0.95)',
                        color: '#000',
                        fontWeight: 900,
                        padding: '10px 36px',
                        borderRadius: '30px',
                        boxShadow: isJackpot ? '0 0 40px rgba(245, 158, 11, 0.95)' : '0 0 30px rgba(0, 231, 1, 0.85)',
                        fontSize: '1.35rem',
                        letterSpacing: '1px',
                        zIndex: 20,
                        pointerEvents: 'none',
                        animation: 'pulseGlow 1.5s infinite ease'
                    }}>
                        {isJackpot ? `🔥 JACKPOT: +${(lastWin / 100).toFixed(2)} €!` : `🎉 GEWINN: +${(lastWin / 100).toFixed(2)} €`}
                    </div>
                )}
            </div>

            {/* Bottom Controls Bar */}
            <footer style={{
                padding: '24px 32px',
                background: 'var(--bg-main)',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '20px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Einsatz:</span>
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
                                disabled={spinning}
                                style={{
                                    background: betEur === val ? 'var(--stake-green)' : 'transparent',
                                    color: betEur === val ? '#052205' : 'var(--text-white)',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    padding: '10px 14px',
                                    border: 'none',
                                    cursor: spinning ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.15s'
                                }}
                            >
                                {val.toFixed(2)} €
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={handleSpin}
                        disabled={spinning || balance < Math.round(betEur * 100)}
                        className="stake-btn stake-btn-green glow-green"
                        style={{
                            padding: '16px 52px',
                            fontSize: '1.2rem',
                            fontWeight: 900,
                            letterSpacing: '0.5px'
                        }}
                    >
                        {spinning ? 'Walzen drehen...' : `DREHEN (${betEur.toFixed(2)} €)`}
                    </button>
                </div>
            </footer>
        </div>
    );
};