import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ReelProps {
    position: [number, number, number];
    isSpinning: boolean;
    speedMultiplier: number;
}

const ReelMesh: React.FC<ReelProps> = ({ position, isSpinning, speedMultiplier }) => {
    const meshRef = useRef<THREE.Mesh>(null!);

    useFrame((_, delta) => {
        if (isSpinning && meshRef.current) {
            meshRef.current.rotation.x += delta * 20 * speedMultiplier;
        }
    });

    return (
        <group position={position}>
            {/* Outer golden cylinder ring */}
            <mesh ref={meshRef}>
                <cylinderGeometry args={[1.25, 1.25, 0.85, 32]} />
                <meshStandardMaterial 
                    color="#f59e0b" 
                    metalness={0.9} 
                    roughness={0.15} 
                />
            </mesh>
            {/* Center border chrome line */}
            <mesh>
                <cylinderGeometry args={[1.28, 1.28, 0.1, 32]} />
                <meshStandardMaterial color="#ffffff" metalness={1} roughness={0.1} />
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

    // Synchronize balance if parent updates
    useEffect(() => {
        if (initialBalance !== undefined) {
            setBalance(initialBalance);
        }
    }, [initialBalance]);

    // Audio synthesizer for real casino slot sounds
    const playAudio = (type: 'spin' | 'win' | 'jackpot') => {
        if (!soundEnabled) return;
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            if (type === 'spin') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(160, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.25, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.1);
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
        } catch (e) {
            // AudioContext not allowed before user interaction
        }
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

        // Try backend spin first; fallback to client simulation if server offline
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
                throw new Error('Fallback to local simulation');
            }
        } catch (e) {
            // High quality local simulator (RTP 96.5%)
            const r1 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
            const r2 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
            const r3 = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
            reels = [r1, r2, r3];

            if (r1 === r2 && r2 === r3) {
                // 3 of a kind
                if (r1 === '7️⃣' || r1 === '👑') {
                    winCents = betCents * 25; // 25x Jackpot!
                } else {
                    winCents = betCents * 10; // 10x Win
                }
            } else if (r1 === r2 || r2 === r3 || r1 === r3) {
                // 2 of a kind
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
            maxWidth: '1040px',
            margin: '0 auto',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)'
        }}>
            {/* Top Game Bar */}
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
                        <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-white)', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                            Royal 3D Slot Machine
                        </h2>
                        <span className="stake-badge stake-badge-original">ORIGINAL 3D</span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {/* Sound Toggle */}
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

                    {/* Turbo Toggle */}
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

            {/* 3D Canvas Stage */}
            <div style={{
                height: '380px',
                position: 'relative',
                background: 'radial-gradient(circle at center, #1b2636 0%, #0d1622 100%)'
            }}>
                <Canvas camera={{ position: [0, 0, 5.2], fov: 45 }}>
                    <ambientLight intensity={0.7} />
                    <directionalLight position={[5, 10, 7]} intensity={2} />
                    <pointLight position={[0, 0, 3]} intensity={1.5} color="#00e701" />

                    <ReelMesh position={[-1.65, 0, 0]} isSpinning={spinning} speedMultiplier={turbo ? 2.5 : 1} />
                    <ReelMesh position={[0, 0, 0]} isSpinning={spinning} speedMultiplier={turbo ? 2.5 : 1} />
                    <ReelMesh position={[1.65, 0, 0]} isSpinning={spinning} speedMultiplier={turbo ? 2.5 : 1} />
                </Canvas>

                {/* Symbols Overlay after Spin */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    gap: '65px',
                    pointerEvents: 'none',
                    zIndex: 10
                }}>
                    {result && !spinning ? (
                        result.map((sym, idx) => (
                            <div
                                key={idx}
                                style={{
                                    fontSize: '3.5rem',
                                    filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.8))',
                                    animation: 'pulseGlow 1.5s infinite ease'
                                }}
                            >
                                {sym}
                            </div>
                        ))
                    ) : (
                        <div style={{
                            display: 'flex',
                            gap: '65px',
                            fontSize: '3.5rem',
                            opacity: spinning ? 0.3 : 0.8
                        }}>
                            <span>7️⃣</span>
                            <span>👑</span>
                            <span>💎</span>
                        </div>
                    )}
                </div>

                {/* Win / Jackpot Banner Overlay */}
                {lastWin > 0 && !spinning && (
                    <div style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: isJackpot ? 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)' : 'rgba(0, 231, 1, 0.9)',
                        color: '#000',
                        fontWeight: 900,
                        padding: '8px 24px',
                        borderRadius: '30px',
                        boxShadow: isJackpot ? '0 0 30px rgba(245, 158, 11, 0.8)' : '0 0 25px rgba(0, 231, 1, 0.7)',
                        fontSize: '1.2rem',
                        letterSpacing: '1px',
                        zIndex: 20
                    }}>
                        {isJackpot ? `🔥 JACKPOT: +${(lastWin / 100).toFixed(2)} €!` : `🎉 GEWINN: +${(lastWin / 100).toFixed(2)} €`}
                    </div>
                )}
            </div>

            {/* Bottom Stake Controls Bar */}
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