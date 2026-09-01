import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows, Text } from '@react-three/drei';
import * as THREE from 'three';

// 8 High-Definition 3D Casino Symbols
const SYMBOLS = ['7️⃣', '💎', '👑', '🍒', '🔔', '⭐', '🍇', 'BAR'];

// Creates a high-resolution 4K-style crisp texture for the reel strip
function createHDReelTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d')!;

    // Rich metallic gold-gradient background strip
    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.2, '#ffffff');
    grad.addColorStop(0.5, '#fef08a');
    grad.addColorStop(0.8, '#ffffff');
    grad.addColorStop(1, '#eab308');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 2048);

    const slotH = 2048 / SYMBOLS.length;

    SYMBOLS.forEach((sym, idx) => {
        const y = idx * slotH;

        // Gold foil divider lines
        const divGrad = ctx.createLinearGradient(0, y, 512, y);
        divGrad.addColorStop(0, '#854d0e');
        divGrad.addColorStop(0.5, '#fef08a');
        divGrad.addColorStop(1, '#854d0e');
        ctx.fillStyle = divGrad;
        ctx.fillRect(0, y, 512, 6);
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(0, y + 6, 512, 4);

        // Render Symbol with drop shadow and crisp typography
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 6;

        if (sym === 'BAR') {
            // Authentic 3D BAR logo
            ctx.fillStyle = '#b91c1c';
            ctx.font = '900 84px "Outfit", "Arial Black", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('BAR', 256, y + slotH / 2);
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 4;
            ctx.strokeText('BAR', 256, y + slotH / 2);
        } else {
            ctx.font = '120px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(sym, 256, y + slotH / 2);
        }
        ctx.shadowBlur = 0;
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
}

interface SingleReelProps {
    position: [number, number, number];
    isSpinning: boolean;
    stopDelay: number;
    targetIndex: number;
    onStopped: () => void;
    texture: THREE.CanvasTexture;
}

// 3D Metallic Reel Cylinder with Realistic Physics Bounce
const Realistic3DReel: React.FC<SingleReelProps> = ({
    position,
    isSpinning,
    stopDelay,
    targetIndex,
    onStopped,
    texture
}) => {
    const meshRef = useRef<THREE.Mesh>(null!);
    const stateRef = useRef<'idle' | 'windup' | 'spinning' | 'stopping' | 'stopped'>('idle');
    const angleRef = useRef<number>(0);
    const speedRef = useRef<number>(0);
    const timeRef = useRef<number>(0);
    const hasTriggeredRef = useRef<boolean>(false);

    useEffect(() => {
        if (isSpinning) {
            stateRef.current = 'windup';
            timeRef.current = 0;
            hasTriggeredRef.current = false;
        }
    }, [isSpinning]);

    useFrame((_, delta) => {
        const dt = Math.min(delta, 0.08);
        timeRef.current += dt;

        if (stateRef.current === 'windup') {
            // Mechanical anticipation wind-up (pulls back slightly before firing)
            speedRef.current = THREE.MathUtils.lerp(speedRef.current, -4.0, dt * 12);
            angleRef.current += speedRef.current * dt;
            if (timeRef.current > 0.14) {
                stateRef.current = 'spinning';
            }
        } else if (stateRef.current === 'spinning') {
            // High-speed rotation blur
            speedRef.current = THREE.MathUtils.lerp(speedRef.current, 32.0, dt * 8);
            angleRef.current += speedRef.current * dt;

            if (timeRef.current >= stopDelay && !isSpinning) {
                stateRef.current = 'stopping';
            }
        } else if (stateRef.current === 'stopping') {
            const step = (Math.PI * 2) / SYMBOLS.length;
            const destAngle = Math.round(angleRef.current / step) * step + (targetIndex * step);

            speedRef.current = THREE.MathUtils.lerp(speedRef.current, 0, dt * 14);
            angleRef.current = THREE.MathUtils.lerp(angleRef.current, destAngle, dt * 18);

            if (Math.abs(speedRef.current) < 0.15 && Math.abs(angleRef.current - destAngle) < 0.02) {
                stateRef.current = 'stopped';
                angleRef.current = destAngle;
                if (!hasTriggeredRef.current) {
                    hasTriggeredRef.current = true;
                    onStopped();
                }
            }
        }

        if (meshRef.current) {
            meshRef.current.rotation.x = angleRef.current;
        }
    });

    return (
        <group position={position}>
            {/* Main Symbol Reel Cylinder */}
            <mesh ref={meshRef} castShadow receiveShadow>
                <cylinderGeometry args={[1.25, 1.25, 0.9, 48]} />
                <meshStandardMaterial 
                    map={texture} 
                    roughness={0.15} 
                    metalness={0.4} 
                />
            </mesh>

            {/* Polished Chrome Bevel Outer Rings */}
            <mesh position={[0, 0.46, 0]}>
                <cylinderGeometry args={[1.28, 1.28, 0.04, 48]} />
                <meshStandardMaterial color="#ffffff" metalness={0.95} roughness={0.05} />
            </mesh>
            <mesh position={[0, -0.46, 0]}>
                <cylinderGeometry args={[1.28, 1.28, 0.04, 48]} />
                <meshStandardMaterial color="#ffffff" metalness={0.95} roughness={0.05} />
            </mesh>
        </group>
    );
};

// Complete 3D Slot Machine Cabinet with Animated Lever, Glass Viewport & Chaser LEDs
const PhotorealisticCabinet3D: React.FC<{
    isSpinning: boolean;
    leverPulled: boolean;
    targetIndexes: number[];
    onReelStop: (idx: number) => void;
    texture: THREE.CanvasTexture;
    isWin: boolean;
}> = ({ isSpinning, leverPulled, targetIndexes, onReelStop, texture, isWin }) => {
    const leverRef = useRef<THREE.Group>(null!);
    const chaserGroupRef = useRef<THREE.Group>(null!);

    useFrame((_, delta) => {
        // Smooth lever pull down and spring back
        if (leverRef.current) {
            const targetZ = leverPulled ? 0.9 : 0;
            leverRef.current.rotation.z = THREE.MathUtils.lerp(
                leverArmRotation(leverRef.current.rotation.z, targetZ, delta * 15),
                targetZ,
                delta * 12
            );
        }

        // Chaser LEDs animation
        if (chaserGroupRef.current) {
            const time = performance.now() * 0.009;
            chaserGroupRef.current.children.forEach((child: any, i: number) => {
                if (child.material) {
                    const wave = (Math.sin(time + i * 0.7) + 1) / 2;
                    child.material.emissiveIntensity = isWin ? 3.0 : (isSpinning ? wave * 2.5 : 0.8);
                }
            });
        }
    });

    const leverArmRotation = (current: number, target: number, speed: number) => {
        return THREE.MathUtils.lerp(current, target, speed);
    };

    return (
        <group position={[0, -0.1, 0]}>
            {/* Outer Heavy Steel Cabinet Body */}
            <mesh position={[0, 0, -0.7]} castShadow receiveShadow>
                <boxGeometry args={[5.4, 4.2, 1.5]} />
                <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
            </mesh>

            {/* Glowing Crown / Marquee Header with Vegas Gold */}
            <mesh position={[0, 2.25, -0.2]} castShadow>
                <boxGeometry args={[5.2, 0.8, 1.1]} />
                <meshStandardMaterial color="#1e1b4b" roughness={0.2} metalness={0.8} />
            </mesh>
            <mesh position={[0, 2.25, 0.32]}>
                <boxGeometry args={[4.8, 0.58, 0.06]} />
                <meshStandardMaterial color="#f59e0b" roughness={0.1} metalness={0.9} />
            </mesh>

            {/* Chaser LED Bulbs around the cabinet rim */}
            <group ref={chaserGroupRef} position={[0, 0, 0.28]}>
                {[-2.4, -1.6, -0.8, 0, 0.8, 1.6, 2.4].map((x, i) => (
                    <mesh key={`t-${i}`} position={[x, 1.8, 0]}>
                        <sphereGeometry args={[0.09, 16, 16]} />
                        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={1.5} />
                    </mesh>
                ))}
                {[-2.4, -1.6, -0.8, 0, 0.8, 1.6, 2.4].map((x, i) => (
                    <mesh key={`b-${i}`} position={[x, -1.8, 0]}>
                        <sphereGeometry args={[0.09, 16, 16]} />
                        <meshStandardMaterial color="#00e701" emissive="#00e701" emissiveIntensity={1.5} />
                    </mesh>
                ))}
            </group>

            {/* Chrome Bevel Frame around Reels Glass */}
            <mesh position={[0, 0, 0.22]}>
                <boxGeometry args={[5.0, 2.8, 0.12]} />
                <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.05} />
            </mesh>

            {/* Inner Dark Viewport Casing */}
            <mesh position={[0, 0, 0.1]}>
                <boxGeometry args={[4.7, 2.5, 0.8]} />
                <meshStandardMaterial color="#020617" roughness={0.6} />
            </mesh>

            {/* 3 Physical 3D Symbol Reels */}
            <Realistic3DReel
                position={[-1.62, 0, 0]}
                isSpinning={isSpinning}
                stopDelay={0.8}
                targetIndex={targetIndexes[0]}
                onStopped={() => onReelStop(0)}
                texture={texture}
            />
            <Realistic3DReel
                position={[0, 0, 0]}
                isSpinning={isSpinning}
                stopDelay={1.4}
                targetIndex={targetIndexes[1]}
                onStopped={() => onReelStop(1)}
                texture={texture}
            />
            <Realistic3DReel
                position={[1.62, 0, 0]}
                isSpinning={isSpinning}
                stopDelay={2.0}
                targetIndex={targetIndexes[2]}
                onStopped={() => onReelStop(2)}
                texture={texture}
            />

            {/* Translucent Glass Glass Overlay with Specular Reflection */}
            <mesh position={[0, 0, 1.15]}>
                <planeGeometry args={[4.7, 2.5]} />
                <meshPhysicalMaterial 
                    color="#ffffff" 
                    transparent={true} 
                    opacity={0.12} 
                    roughness={0.1} 
                    metalness={0.9} 
                    clearcoat={1.0} 
                />
            </mesh>

            {/* Glowing Neon Red Center Payline */}
            <mesh position={[0, 0, 1.22]}>
                <boxGeometry args={[4.7, 0.05, 0.02]} />
                <meshStandardMaterial 
                    color="#ef4444" 
                    emissive="#ef4444" 
                    emissiveIntensity={isWin ? 3.5 : 1.5} 
                />
            </mesh>

            {/* Physical 3D Pull Arm / Mechanical Lever (Right side) */}
            <group position={[2.9, -0.3, 0]}>
                {/* Brass Pivot Joint Base */}
                <mesh rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.25, 0.25, 0.35, 24]} />
                    <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.1} />
                </mesh>

                {/* Rotating Arm */}
                <group ref={leverRef}>
                    <mesh position={[0.1, 0.75, 0]}>
                        <cylinderGeometry args={[0.05, 0.05, 1.5, 20]} />
                        <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.05} />
                    </mesh>
                    {/* Red Sphere Knob */}
                    <mesh position={[0.1, 1.55, 0]}>
                        <sphereGeometry args={[0.22, 24, 24]} />
                        <meshStandardMaterial color="#dc2626" roughness={0.1} metalness={0.3} />
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
    const [targetIndexes, setTargetIndexes] = useState<number[]>([0, 1, 2]);

    const hdTexture = useMemo(() => createHDReelTexture(), []);

    // Synthetic Mechanical Audio
    const playSlotAudio = (type: 'lever' | 'clack' | 'win') => {
        if (!soundEnabled) return;
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            if (type === 'lever') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(140, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.18);
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.18);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.18);
            } else if (type === 'clack') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(240, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.09);
                gain.gain.setValueAtTime(0.5, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.09);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.09);
            } else if (type === 'win') {
                [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
                    gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.08);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.35);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(ctx.currentTime + i * 0.08);
                    osc.stop(ctx.currentTime + i * 0.08 + 0.35);
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

        // Trigger mechanical lever animation
        setLeverPulled(true);
        playSlotAudio('lever');
        setTimeout(() => setLeverPulled(false), 350);

        setSpinning(true);
        setLastWin(0);
        setIsJackpot(false);

        const balAfterBet = balance - betCents;
        setBalance(balAfterBet);
        if (onUpdateBalance) onUpdateBalance(balAfterBet);

        // Determine outcome
        let outcome = [
            Math.floor(Math.random() * SYMBOLS.length),
            Math.floor(Math.random() * SYMBOLS.length),
            Math.floor(Math.random() * SYMBOLS.length)
        ];

        // 38% win probability
        if (Math.random() < 0.38) {
            const symIdx = Math.floor(Math.random() * 4); // 7, Diamant, Krone, Kirsche
            outcome = [symIdx, symIdx, Math.random() < 0.45 ? symIdx : Math.floor(Math.random() * SYMBOLS.length)];
        }

        setTargetIndexes(outcome);

        const s1 = SYMBOLS[outcome[0]];
        const s2 = SYMBOLS[outcome[1]];
        const s3 = SYMBOLS[outcome[2]];

        let winCents = 0;
        if (s1 === s2 && s2 === s3) {
            winCents = (s1 === '7️⃣' || s1 === '👑') ? betCents * 35 : betCents * 18;
        } else if (s1 === s2 || s2 === s3 || s1 === s3) {
            winCents = Math.round(betCents * 2.2);
        }

        // All 3 reels finish after ~2.2s
        setTimeout(() => {
            setSpinning(false);
            setLastWin(winCents);
            const finalBal = balAfterBet + winCents;
            setBalance(finalBal);
            if (onUpdateBalance) onUpdateBalance(finalBal);

            if (winCents > betCents * 10) {
                setIsJackpot(true);
                playSlotAudio('win');
            } else if (winCents > 0) {
                playSlotAudio('win');
            }
        }, 2200);
    };

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '1080px',
            margin: '0 auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.65)'
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
                        <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#f59e0b', fontWeight: 900, fontFamily: 'var(--font-display)' }}>
                            Royal Vegas 3D Slot Machine
                        </h2>
                        <span className="stake-badge stake-badge-original">ULTRA 3D CASINO</span>
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

            {/* 3D Photorealistic WebGL Stage */}
            <div 
                onClick={handleSpin}
                title="Klicke auf den Automaten zum Drehen!"
                style={{
                    height: '450px',
                    position: 'relative',
                    background: 'radial-gradient(circle at center, #1b263b 0%, #050911 100%)',
                    overflow: 'hidden',
                    cursor: spinning ? 'default' : 'pointer'
                }}
            >
                <Canvas camera={{ position: [0, 0, 6.2], fov: 44 }}>
                    <ambientLight intensity={0.8} />
                    <directionalLight position={[6, 12, 8]} intensity={2.8} castShadow />
                    <directionalLight position={[-6, 8, -6]} intensity={1.2} />
                    <pointLight position={[0, 0, 4.0]} intensity={2.5} color="#fbbf24" />
                    <pointLight position={[-2.8, -1.2, 2.8]} intensity={1.8} color="#00e701" />

                    <PhotorealisticCabinet3D
                        isSpinning={spinning}
                        leverPulled={leverPulled}
                        targetIndexes={targetIndexes}
                        onReelStop={() => playSlotAudio('clack')}
                        texture={hdTexture}
                        isWin={lastWin > 0}
                    />

                    <Environment preset="night" />
                    <ContactShadows position={[0, -2.2, 0]} opacity={0.65} scale={10} blur={2} far={4} />
                </Canvas>

                {/* Illuminated Vegas Header Text */}
                <div style={{
                    position: 'absolute',
                    top: '18px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #f59e0b 100%)',
                    color: '#000',
                    fontWeight: 900,
                    padding: '5px 36px',
                    borderRadius: '6px',
                    letterSpacing: '2.5px',
                    fontSize: '1rem',
                    boxShadow: '0 0 30px rgba(245, 158, 11, 0.95)',
                    border: '2px solid #fff',
                    pointerEvents: 'none'
                }}>
                    ★ VEGAS 777 JACKPOT ★
                </div>

                {/* Lever Prompt on Right */}
                <div style={{
                    position: 'absolute',
                    right: '20px',
                    top: '48%',
                    background: 'rgba(0,0,0,0.7)',
                    color: '#f59e0b',
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '1px',
                    border: '1px solid rgba(245,158,11,0.4)',
                    pointerEvents: 'none'
                }}>
                    [ HEBEL ZIEHEN 🕹️ ]
                </div>

                {/* Win Overlay Banner */}
                {lastWin > 0 && !spinning && (
                    <div style={{
                        position: 'absolute',
                        bottom: '28px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: isJackpot ? 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)' : 'rgba(0, 231, 1, 0.95)',
                        color: '#000',
                        fontWeight: 900,
                        padding: '12px 40px',
                        borderRadius: '30px',
                        boxShadow: isJackpot ? '0 0 45px rgba(245, 158, 11, 1.0)' : '0 0 35px rgba(0, 231, 1, 0.9)',
                        fontSize: '1.4rem',
                        letterSpacing: '1px',
                        zIndex: 20,
                        pointerEvents: 'none',
                        animation: 'pulseGlow 1.5s infinite ease'
                    }}>
                        {isJackpot ? `🔥 MEGA JACKPOT: +${(lastWin / 100).toFixed(2)} €!` : `🎉 GEWINN: +${(lastWin / 100).toFixed(2)} €`}
                    </div>
                )}
            </div>

            {/* Bottom Controls Dashboard */}
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
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Einsatz Stufe:</span>
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
                                    fontWeight: 800,
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
                            padding: '16px 54px',
                            fontSize: '1.2rem',
                            fontWeight: 900,
                            letterSpacing: '0.5px'
                        }}
                    >
                        {spinning ? 'Walzen drehen...' : `HEBEL ZIEHEN / DREHEN (${betEur.toFixed(2)} €)`}
                    </button>
                </div>
            </footer>
        </div>
    );
};