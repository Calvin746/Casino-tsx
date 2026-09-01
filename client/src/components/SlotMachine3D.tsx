import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ReelProps {
    position: [number, number, number];
    isSpinning: boolean;
    speedMultiplier: number;
}

// 3D Golden Cylinder Reel (The authentic original design with enhanced chrome ribs and shiny gold finish)
const ReelMesh: React.FC<ReelProps> = ({ position, isSpinning, speedMultiplier }) => {
    const meshRef = useRef<THREE.Mesh>(null!);

    useFrame((_, delta) => {
        if (isSpinning && meshRef.current) {
            meshRef.current.rotation.x += delta * 18 * speedMultiplier;
        }
    });

    return (
        <group position={position}>
            {/* Main golden cylinder reel */}
            <mesh ref={meshRef}>
                <cylinderGeometry args={[1.2, 1.2, 0.82, 36]} />
                <meshStandardMaterial 
                    color="#c5a059" 
                    metalness={0.88} 
                    roughness={0.12} 
                />
            </mesh>
            {/* Outer silver chrome dividers */}
            <mesh>
                <cylinderGeometry args={[1.23, 1.23, 0.05, 36]} />
                <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.05} />
            </mesh>
        </group>
    );
};

// 3D Physical Slot Machine Cabinet frame
const SlotCabinet3D: React.FC<{ isSpinning: boolean; speed: number }> = ({ isSpinning, speed }) => {
    return (
        <group position={[0, 0, 0]}>
            {/* Outer Machine Housing / Chassis */}
            <mesh position={[0, 0, -0.6]}>
                <boxGeometry args={[5.2, 3.8, 1.2]} />
                <meshStandardMaterial color="#111827" roughness={0.4} metalness={0.8} />
            </mesh>

            {/* Top Marquee Header Crown */}
            <mesh position={[0, 2.05, -0.4]}>
                <boxGeometry args={[5.0, 0.8, 1.0]} />
                <meshStandardMaterial color="#1e1b4b" roughness={0.2} metalness={0.7} />
            </mesh>
            <mesh position={[0, 2.05, 0.12]}>
                <boxGeometry args={[4.7, 0.6, 0.05]} />
                <meshStandardMaterial color="#f59e0b" roughness={0.1} metalness={0.9} />
            </mesh>

            {/* Chrome Bevel Trim around reels window */}
            <mesh position={[0, 0, 0.42]}>
                <ringGeometry args={[2.5, 2.65, 4]} />
                <meshStandardMaterial color="#d1d5db" metalness={1} roughness={0.05} />
            </mesh>

            {/* Machine Base */}
            <mesh position={[0, -2.0, -0.2]}>
                <boxGeometry args={[5.4, 0.6, 1.6]} />
                <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.7} />
            </mesh>

            {/* 3 Golden Spinning Reels */}
            <ReelMesh position={[-1.6, 0, 0]} isSpinning={isSpinning} speedMultiplier={speed} />
            <ReelMesh position={[0, 0, 0]} isSpinning={isSpinning} speedMultiplier={speed} />
            <ReelMesh position={[1.6, 0, 0]} isSpinning={isSpinning} speedMultiplier={speed} />

            {/* Red Center Payline Wire */}
            <mesh position={[0, 0, 1.25]}>
                <boxGeometry args={[4.8, 0.04, 0.02]} />
                <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.8} />
            </mesh>
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
    const [balance, setBalance] = useState<number>(initialBalance || 10000);
    const [betEur, setBetEur] = useState<number>(1.00);
    const [turbo, setTurbo] = useState<boolean>(false);
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [result, setResult] = useState<string[] | null>(null);
    const [lastWin, setLastWin] = useState<number>(0);
    const [isJackpot, setIsJackpot] = useState<boolean>(false);

    useEffect(() => {
        if (initialBalance !== undefined) {
            setBalance(initialBalance);
        }
    }, [initialBalance]);

    // Audio synthesizer
    const playAudio = (type: 'spin' | 'win' | 'jackpot') => {
        if (!soundEnabled) return;
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            if (type === 'spin') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(140, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.12);
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.12);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.12);
            } else if (type === 'win') {
                [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
                    gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.08);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.3);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(ctx.currentTime + i * 0.08);
                    osc.stop(ctx.currentTime + i * 0.08 + 0.3);
                });
            } else if (type === 'jackpot') {
                [440, 554, 659, 880, 1108].forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
                    gain.gain.setValueAtTime(0.35, ctx.currentTime + i * 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.5);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(ctx.currentTime + i * 0.1);
                    osc.stop(ctx.currentTime + i * 0.1 + 0.5);
                });
            }
        } catch (e) {}
    };

    const SYMBOLS = ['7️⃣', '💎', '👑', '🍒', '🔔', '⭐'];

    const handleSpin = async () => {
        const betCents = Math.round(betEur * 100);
        if (spinning || balance < betCents) {
            if (balance < betCents && onOpenWallet) {
                onOpenWallet();
            }
            return;
        }

        setSpinning(true);
        setResult(null);
        setLastWin(0);
        setIsJackpot(false);
        playAudio('spin');

        let newBal = balance - betCents;
        let winCents = 0;
        let reels: string[] = [];

        try {
            const res = await fetch('http://localhost:4000/api/games/slot/spin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ betCents })
            });

            if (res.ok) {
                const data = await res.json();
                winCents = data.winCents;
                reels = data.reels;
                newBal = data.newBalanceCents;
            } else {
                throw new Error('Local fallback');
            }
        } catch (e) {
            const r1 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
            const r2 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
            const r3 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
            reels = [r1, r2, r3];

            if (r1 === r2 && r2 === r3) {
                if (r1 === '7️⃣' || r1 === '👑') {
                    winCents = betCents * 25;
                } else {
                    winCents = betCents * 10;
                }
            } else if (r1 === r2 || r2 === r3 || r1 === r3) {
                winCents = Math.round(betCents * 1.8);
            } else {
                winCents = 0;
            }
            newBal = newBal + winCents;
        }

        const duration = turbo ? 500 : 1200;

        setTimeout(() => {
            setSpinning(false);
            setResult(reels);
            setLastWin(winCents);
            setBalance(newBal);
            if (onUpdateBalance) onUpdateBalance(newBal);

            if (winCents > betCents * 10) {
                setIsJackpot(true);
                playAudio('jackpot');
            } else if (winCents > 0) {
                playAudio('win');
            }
        }, duration);
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
                        <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#c5a059', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                            Royal 3D Slot Machine
                        </h2>
                        <span className="stake-badge stake-badge-original">ORIGINAL 3D</span>
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

                    <button
                        onClick={() => setTurbo(!turbo)}
                        style={{
                            background: turbo ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-elevated)',
                            border: `1px solid ${turbo ? 'var(--stake-gold)' : 'var(--border-subtle)'}`,
                            borderRadius: 'var(--radius-md)',
                            color: turbo ? 'var(--stake-gold)' : 'var(--text-secondary)',
                            fontWeight: 700,
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                        }}
                    >
                        ⚡ Turbo {turbo ? 'ON' : 'OFF'}
                    </button>

                    <div style={{ color: 'var(--stake-green)', fontWeight: 800, fontSize: '1.05rem', marginLeft: '8px' }}>
                        {(balance / 100).toFixed(2)} €
                    </div>
                </div>
            </header>

            {/* 3D Realistic Slot Cabinet Stage */}
            <div style={{
                height: '420px',
                position: 'relative',
                background: 'radial-gradient(circle at center, #1b2636 0%, #070d14 100%)',
                overflow: 'hidden'
            }}>
                <Canvas camera={{ position: [0, 0, 5.8], fov: 45 }}>
                    <ambientLight intensity={0.7} />
                    <directionalLight position={[5, 10, 7]} intensity={2.2} castShadow />
                    <pointLight position={[0, 0, 3.5]} intensity={2.0} color="#fbbf24" />
                    <pointLight position={[-2, -1, 2]} intensity={1.2} color="#00e701" />

                    <SlotCabinet3D isSpinning={spinning} speed={turbo ? 2.5 : 1} />
                </Canvas>

                {/* Machine Marquee Ribbon Text in center top */}
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #f59e0b 100%)',
                    color: '#000',
                    fontWeight: 900,
                    padding: '4px 28px',
                    borderRadius: '6px',
                    letterSpacing: '2px',
                    fontSize: '0.95rem',
                    boxShadow: '0 0 20px rgba(245, 158, 11, 0.7)',
                    border: '1px solid #fff'
                }}>
                    ★ ROYAL 777 JACKPOT ★
                </div>

                {/* Symbols Overlay on the Reels */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    gap: '68px',
                    pointerEvents: 'none',
                    zIndex: 10
                }}>
                    {result && !spinning ? (
                        result.map((sym, idx) => (
                            <div
                                key={idx}
                                style={{
                                    fontSize: '3.6rem',
                                    filter: 'drop-shadow(0 0 16px rgba(255,255,255,0.9))',
                                    animation: 'pulseGlow 1.5s infinite ease'
                                }}
                            >
                                {sym}
                            </div>
                        ))
                    ) : (
                        <div style={{
                            display: 'flex',
                            gap: '68px',
                            fontSize: '3.6rem',
                            opacity: spinning ? 0.35 : 0.85
                        }}>
                            <span>7️⃣</span>
                            <span>👑</span>
                            <span>💎</span>
                        </div>
                    )}
                </div>

                {/* Win / Result Notification */}
                {lastWin > 0 && !spinning && (
                    <div style={{
                        position: 'absolute',
                        bottom: '24px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: isJackpot ? 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)' : 'rgba(0, 231, 1, 0.95)',
                        color: '#000',
                        fontWeight: 900,
                        padding: '8px 30px',
                        borderRadius: '30px',
                        boxShadow: isJackpot ? '0 0 35px rgba(245, 158, 11, 0.9)' : '0 0 25px rgba(0, 231, 1, 0.8)',
                        fontSize: '1.25rem',
                        letterSpacing: '1px',
                        zIndex: 20
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
                {/* Bet Sizing Selector */}
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

                {/* Spin Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={handleSpin}
                        disabled={spinning || balance < Math.round(betEur * 100)}
                        className="stake-btn stake-btn-green glow-green"
                        style={{
                            padding: '14px 48px',
                            fontSize: '1.15rem',
                            fontWeight: 900,
                            letterSpacing: '0.5px'
                        }}
                    >
                        {spinning ? 'Dreht...' : `DREHEN (${betEur.toFixed(2)} €)`}
                    </button>
                </div>
            </footer>
        </div>
    );
};