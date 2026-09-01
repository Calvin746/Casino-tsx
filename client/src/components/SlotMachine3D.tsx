import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// 10 Premium Casino Symbols
const SYMBOLS = ['7️⃣', '💎', '👑', '🍒', '🔔', '⭐', '🍇', 'BAR', '⚡', '🃏'];

// 20 Paylines definition for 5x3 Grid
const PAYLINES = [
    [1, 1, 1, 1, 1], // Line 1: Middle horizontal
    [0, 0, 0, 0, 0], // Line 2: Top horizontal
    [2, 2, 2, 2, 2], // Line 3: Bottom horizontal
    [0, 1, 2, 1, 0], // Line 4: V-Shape down
    [2, 1, 0, 1, 2], // Line 5: V-Shape up
    [0, 0, 1, 2, 2], // Line 6: Diagonal down
    [2, 2, 1, 0, 0], // Line 7: Diagonal up
    [1, 0, 0, 0, 1], // Line 8: Top arch
    [1, 2, 2, 2, 1], // Line 9: Bottom arch
    [1, 0, 1, 2, 1], // Line 10: Zig-Zag
];

// 3D Physical Cabinet with Animated 3D Pull Lever (Stab zum Ziehen)
const SlotCabinetWithLever3D: React.FC<{
    isSpinning: boolean;
    leverPulled: boolean;
    onLeverClick: () => void;
}> = ({ isSpinning, leverPulled, onLeverClick }) => {
    const leverArmRef = useRef<THREE.Group>(null!);

    useFrame((_, delta) => {
        if (leverArmRef.current) {
            const targetZ = leverPulled ? 0.95 : 0;
            leverArmRef.current.rotation.z = THREE.MathUtils.lerp(
                leverArmRef.current.rotation.z,
                targetZ,
                delta * 14
            );
        }
    });

    return (
        <group position={[0, 0, 0]}>
            {/* Main Cabinet Frame */}
            <mesh position={[0, 0, -0.6]} castShadow receiveShadow>
                <boxGeometry args={[5.8, 3.8, 1.4]} />
                <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
            </mesh>

            {/* Vegas Gold Header */}
            <mesh position={[0, 2.05, -0.2]}>
                <boxGeometry args={[5.6, 0.7, 1.0]} />
                <meshStandardMaterial color="#1e1b4b" roughness={0.2} metalness={0.8} />
            </mesh>
            <mesh position={[0, 2.05, 0.32]}>
                <boxGeometry args={[5.2, 0.5, 0.06]} />
                <meshStandardMaterial color="#f59e0b" roughness={0.1} metalness={0.9} />
            </mesh>

            {/* Chrome Window Bevel */}
            <mesh position={[0, 0, 0.2]}>
                <boxGeometry args={[5.4, 2.7, 0.1]} />
                <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.05} />
            </mesh>

            {/* 3D Physical Pull Lever (Der Stab zum Ziehen auf der rechten Seite) */}
            <group 
                position={[3.1, -0.2, 0.1]} 
                onClick={(e) => {
                    e.stopPropagation();
                    onLeverClick();
                }}
            >
                {/* Brass Base Hub */}
                <mesh rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.26, 0.26, 0.35, 24]} />
                    <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.1} />
                </mesh>

                {/* Animated Rotating Shaft */}
                <group ref={leverArmRef}>
                    {/* Metallic Rod / Stab */}
                    <mesh position={[0.1, 0.8, 0]}>
                        <cylinderGeometry args={[0.055, 0.055, 1.6, 20]} />
                        <meshStandardMaterial color="#f8fafc" metalness={0.98} roughness={0.02} />
                    </mesh>
                    {/* Red Grip Ball at Top */}
                    <mesh position={[0.1, 1.65, 0]} castShadow>
                        <sphereGeometry args={[0.24, 24, 24]} />
                        <meshStandardMaterial 
                            color="#dc2626" 
                            roughness={0.1} 
                            metalness={0.3} 
                            emissive="#b91c1c"
                            emissiveIntensity={0.2}
                        />
                    </mesh>
                </group>
            </group>
        </group>
    );
};

interface VideoSlot5x3Props {
    initialBalance: number;
    onBackToLobby?: () => void;
    onUpdateBalance?: (newBalance: number) => void;
    onOpenWallet?: () => void;
}

export const SlotMachine3D: React.FC<VideoSlot5x3Props> = ({
    initialBalance,
    onBackToLobby,
    onUpdateBalance,
    onOpenWallet
}) => {
    const [balance, setBalance] = useState<number>(initialBalance || 10000);
    const [betEur, setBetEur] = useState<number>(1.00);
    const [spinning, setSpinning] = useState<boolean>(false);
    const [leverPulled, setLeverPulled] = useState<boolean>(false);
    const [reelStates, setReelStates] = useState<boolean[]>([false, false, false, false, false]);
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [lastWin, setLastWin] = useState<number>(0);
    const [winningLines, setWinningLines] = useState<number[]>([]);
    
    // Current 5x3 Grid Symbols (5 columns, 3 rows each)
    const [grid, setGrid] = useState<string[][]>([
        ['7️⃣', '💎', '👑'],
        ['🍒', '🔔', '⭐'],
        ['🍇', 'BAR', '⚡'],
        ['💎', '7️⃣', '🍒'],
        ['👑', '⭐', '🔔']
    ]);

    const playSlotSound = (type: 'lever' | 'spin' | 'reelStop' | 'win' | 'bigwin') => {
        if (!soundEnabled) return;
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            if (type === 'lever') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(140, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.18);
                gain.gain.setValueAtTime(0.35, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.18);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.18);
            } else if (type === 'spin') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.25, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.15);
            } else if (type === 'reelStop') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(260, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.08);
                gain.gain.setValueAtTime(0.4, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.08);
            } else if (type === 'win' || type === 'bigwin') {
                [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
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

    const handleSpin = () => {
        const betCents = Math.round(betEur * 100);
        if (spinning || balance < betCents) {
            if (balance < betCents && onOpenWallet) onOpenWallet();
            return;
        }

        // Pull 3D Lever animation
        setLeverPulled(true);
        playSlotSound('lever');
        setTimeout(() => setLeverPulled(false), 380);

        setSpinning(true);
        setLastWin(0);
        setWinningLines([]);

        const balAfterBet = balance - betCents;
        setBalance(balAfterBet);
        if (onUpdateBalance) onUpdateBalance(balAfterBet);

        setReelStates([true, true, true, true, true]);

        // Generate target 5x3 Grid
        const newGrid: string[][] = [];
        const isWin = Math.random() < 0.42;

        if (isWin) {
            const winSym = SYMBOLS[Math.floor(Math.random() * 5)];
            for (let c = 0; c < 5; c++) {
                const col = [
                    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
                    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
                    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
                ];
                if (c < 3 || Math.random() < 0.6) {
                    col[1] = winSym;
                }
                newGrid.push(col);
            }
        } else {
            for (let c = 0; c < 5; c++) {
                newGrid.push([
                    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
                    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
                    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
                ]);
            }
        }

        [400, 750, 1100, 1450, 1800].forEach((delay, idx) => {
            setTimeout(() => {
                setReelStates(prev => {
                    const next = [...prev];
                    next[idx] = false;
                    return next;
                });
                playSlotSound('reelStop');

                if (idx === 4) {
                    setGrid(newGrid);
                    setSpinning(false);

                    let winTotalEur = 0;
                    const hitLines: number[] = [];

                    PAYLINES.forEach((line, lineIdx) => {
                        const s0 = newGrid[0][line[0]];
                        const s1 = newGrid[1][line[1]];
                        const s2 = newGrid[2][line[2]];
                        const s3 = newGrid[3][line[3]];
                        const s4 = newGrid[4][line[4]];

                        if (s0 === s1 && s1 === s2) {
                            hitLines.push(lineIdx);
                            let mult = (s0 === '7️⃣' || s0 === '👑' || s0 === '💎') ? 12 : 5;
                            if (s2 === s3) mult *= 2.5;
                            if (s3 === s4) mult *= 4;
                            winTotalEur += (betEur / 10) * mult;
                        }
                    });

                    const winCents = Math.round(winTotalEur * 100);
                    if (winCents > 0) {
                        setLastWin(winCents);
                        setWinningLines(hitLines);
                        playSlotSound(winCents > betCents * 8 ? 'bigwin' : 'win');
                        const finalBal = balAfterBet + winCents;
                        setBalance(finalBal);
                        if (onUpdateBalance) onUpdateBalance(finalBal);
                    }
                }
            }, delay);
        });
    };

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '1160px',
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
                            Royal 5-Reel Slot mit 3D-Ziehhobel (20 Paylines)
                        </h2>
                        <span className="stake-badge stake-badge-original">3D HEBEL & 5 WALZEN</span>
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

            {/* Main Stage with 3D Canvas Cabinet & 3D Pull Lever */}
            <div style={{
                background: 'radial-gradient(circle at center, #1e293b 0%, #030712 100%)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '480px',
                borderBottom: '1px solid var(--border-subtle)',
                overflow: 'hidden'
            }}>
                {/* 3D WebGL Scene with Mechanical Lever on the Right */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
                    <Canvas camera={{ position: [0, 0, 6.2], fov: 45 }}>
                        <ambientLight intensity={0.8} />
                        <directionalLight position={[6, 12, 8]} intensity={2.8} castShadow />
                        <pointLight position={[3.2, 0, 2]} intensity={2.5} color="#dc2626" />
                        <SlotCabinetWithLever3D
                            isSpinning={spinning}
                            leverPulled={leverPulled}
                            onLeverClick={handleSpin}
                        />
                        <Environment preset="night" />
                        <ContactShadows position={[0, -2.1, 0]} opacity={0.65} scale={10} blur={2} />
                    </Canvas>
                </div>

                {/* Vegas Golden Marquee Header */}
                <div style={{
                    position: 'relative',
                    zIndex: 10,
                    background: 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #f59e0b 100%)',
                    color: '#000',
                    fontWeight: 900,
                    padding: '6px 40px',
                    borderRadius: '8px',
                    letterSpacing: '3px',
                    fontSize: '1.1rem',
                    boxShadow: '0 0 30px rgba(245, 158, 11, 0.9)',
                    border: '2px solid #fff',
                    marginBottom: '20px',
                    textAlign: 'center',
                    pointerEvents: 'none'
                }}>
                    ★ STAKE 5-REEL CASINO SLOT ★
                </div>

                {/* 5-Reel Grid Frame overlay in center */}
                <div style={{
                    position: 'relative',
                    zIndex: 10,
                    background: '#020617',
                    border: '5px solid #334155',
                    borderRadius: '16px',
                    padding: '14px',
                    boxShadow: '0 0 50px rgba(0,0,0,0.8), inset 0 0 30px rgba(0,0,0,0.9)',
                    width: '100%',
                    maxWidth: '820px'
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: '10px'
                    }}>
                        {grid.map((columnSymbols, colIdx) => {
                            const isReelSpinning = reelStates[colIdx];
                            return (
                                <div
                                    key={colIdx}
                                    style={{
                                        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
                                        borderRadius: '10px',
                                        border: '2px solid var(--border-subtle)',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px',
                                        padding: '8px 4px',
                                        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)'
                                    }}
                                >
                                    {columnSymbols.map((symbol, rowIdx) => {
                                        const isCellWinning = winningLines.some(lineIdx => PAYLINES[lineIdx][colIdx] === rowIdx);
                                        return (
                                            <div
                                                key={rowIdx}
                                                style={{
                                                    height: '86px',
                                                    borderRadius: '8px',
                                                    background: isCellWinning ? 'rgba(245, 158, 11, 0.28)' : 'rgba(255,255,255,0.03)',
                                                    border: isCellWinning ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.06)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '3.4rem',
                                                    boxShadow: isCellWinning ? '0 0 25px rgba(245, 158, 11, 0.9)' : 'none',
                                                    animation: isReelSpinning ? 'pulse 0.1s infinite alternate' : (isCellWinning ? 'pulseGlow 1s infinite' : 'none'),
                                                    filter: isReelSpinning ? 'blur(4px)' : 'none',
                                                    transition: 'all 0.15s'
                                                }}
                                            >
                                                {isReelSpinning ? SYMBOLS[(rowIdx + Math.floor(Math.random() * 8)) % SYMBOLS.length] : symbol}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Lever Prompt Banner on Right */}
                <div 
                    onClick={handleSpin}
                    style={{
                        position: 'absolute',
                        right: '18px',
                        top: '48%',
                        zIndex: 10,
                        background: 'rgba(220, 38, 38, 0.85)',
                        color: '#fff',
                        padding: '8px 14px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 900,
                        letterSpacing: '1px',
                        cursor: 'pointer',
                        boxShadow: '0 0 20px rgba(220, 38, 38, 0.8)',
                        border: '2px solid #fff'
                    }}
                >
                    [ 🕹️ HEBEL ZIEHEN ]
                </div>

                {/* Win Banner */}
                {lastWin > 0 && !spinning && (
                    <div style={{
                        position: 'relative',
                        zIndex: 10,
                        marginTop: '18px',
                        background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                        color: '#fff',
                        fontWeight: 900,
                        padding: '10px 40px',
                        borderRadius: '30px',
                        boxShadow: '0 0 35px rgba(16, 185, 129, 0.9)',
                        fontSize: '1.35rem',
                        letterSpacing: '1px',
                        animation: 'pulseGlow 1.2s infinite ease-in-out'
                    }}>
                        🎉 20 LINIEN GEWINN: +{(lastWin / 100).toFixed(2)} €!
                    </div>
                )}
            </div>

            {/* Bottom Dashboard Controls */}
            <footer style={{
                padding: '24px 32px',
                background: 'var(--bg-main)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '20px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Einsatz (20 Linien):</span>
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
                                    cursor: spinning ? 'not-allowed' : 'pointer'
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
                        {spinning ? 'HEBEL GEZOGEN...' : `HEBEL ZIEHEN / DREHEN (${betEur.toFixed(2)} €)`}
                    </button>
                </div>
            </footer>
        </div>
    );
};