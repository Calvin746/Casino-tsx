import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { SlotMachine3D } from './SlotMachine3D';
import { Roulette3D } from './games/Roulette3D';

interface CasinoLobbyProps {
    initialBalance: number;
    onSelectGame?: (game: string) => void;
}

type CameraViewPreset = 'OVERVIEW' | 'SLOT' | 'ROULETTE' | 'MINES';

// --- Kamera-Controller mit sanfter Bewegung, Höhen-Lock & Kollisionsschutz ---
const CameraRig: React.FC<{
    targetPreset: CameraViewPreset;
    controlsRef: React.RefObject<any>;
    keysPressed: React.MutableRefObject<Record<string, boolean>>;
}> = ({ targetPreset, controlsRef, keysPressed }) => {
    const { camera } = useThree();

    // Kamerapositionen für die Schnellnavigation
    const presetPositions: Record<CameraViewPreset, { pos: [number, number, number]; target: [number, number, number] }> = {
        OVERVIEW: { pos: [0, 2.4, 6.2], target: [0, 0.4, -4.5] },
        SLOT: { pos: [-3.5, 1.4, -2.0], target: [-3.5, 0.8, -5.0] },
        ROULETTE: { pos: [3.5, 1.4, -2.0], target: [3.5, 0.6, -5.0] },
        MINES: { pos: [0, 1.4, -2.5], target: [0, 0.6, -5.5] }
    };

    const isTransitioning = useRef(false);
    const lastPreset = useRef(targetPreset);

    useEffect(() => {
        if (lastPreset.current !== targetPreset) {
            isTransitioning.current = true;
            lastPreset.current = targetPreset;
        }
    }, [targetPreset]);

    useFrame((_, delta) => {
        const dt = Math.min(delta, 0.05);

        // 1. Sanfte Überblendung bei Preset-Wechsel
        if (isTransitioning.current && controlsRef.current) {
            const dest = presetPositions[targetPreset];
            camera.position.lerp(new THREE.Vector3(...dest.pos), dt * 4.5);
            controlsRef.current.target.lerp(new THREE.Vector3(...dest.target), dt * 4.5);
            controlsRef.current.update();

            const distPos = camera.position.distanceTo(new THREE.Vector3(...dest.pos));
            const distTarget = controlsRef.current.target.distanceTo(new THREE.Vector3(...dest.target));
            if (distPos < 0.08 && distTarget < 0.08) {
                isTransitioning.current = false;
            }
        }

        // 2. WASD / Pfeiltasten Geh-Steuerung (Walkthrough)
        const keys = keysPressed.current;
        const isWalking = keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD'] ||
            keys['ArrowUp'] || keys['ArrowDown'] || keys['ArrowLeft'] || keys['ArrowRight'];

        if (isWalking && controlsRef.current) {
            isTransitioning.current = false;
            const moveSpeed = 4.5 * dt;

            // Blickrichtung horizontal ermitteln
            const forward = new THREE.Vector3();
            camera.getWorldDirection(forward);
            forward.y = 0;
            forward.normalize();

            const right = new THREE.Vector3();
            right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

            const moveDelta = new THREE.Vector3();
            if (keys['KeyW'] || keys['ArrowUp']) moveDelta.addScaledVector(forward, moveSpeed);
            if (keys['KeyS'] || keys['ArrowDown']) moveDelta.addScaledVector(forward, -moveSpeed);
            if (keys['KeyD'] || keys['ArrowRight']) moveDelta.addScaledVector(right, moveSpeed);
            if (keys['KeyA'] || keys['ArrowLeft']) moveDelta.addScaledVector(right, -moveSpeed);

            // Position anpassen und innerhalb des Raumes begrenzen
            camera.position.add(moveDelta);
            camera.position.x = THREE.MathUtils.clamp(camera.position.x, -7.5, 7.5);
            camera.position.z = THREE.MathUtils.clamp(camera.position.z, -6.5, 7.5);

            // Target mitbewegen, damit die Orbit-Achse nicht verloren geht
            controlsRef.current.target.add(moveDelta);
            controlsRef.current.target.x = THREE.MathUtils.clamp(controlsRef.current.target.x, -7.5, 7.5);
            controlsRef.current.target.z = THREE.MathUtils.clamp(controlsRef.current.target.z, -8.0, 5.0);
            controlsRef.current.update();
        }

        // 3. STRIKTE BODENSPERRE (Verhindert Absinken in den Boden / Hänger)
        // Boden liegt bei Y = -2.0 -> Kamera darf NIEMALS unter Y = 0.5 (Augenhöhe) sinken!
        if (camera.position.y < 0.5) {
            camera.position.y = 0.5;
        }

        // Auch das Orbit-Target darf nicht in den Boden geraten
        if (controlsRef.current && controlsRef.current.target.y < -0.5) {
            controlsRef.current.target.y = -0.5;
        }
    });

    return null;
};

export const CasinoLobby3D: React.FC<CasinoLobbyProps> = ({ initialBalance, onSelectGame }) => {
    const [activeGame, setActiveGame] = useState<'LOBBY' | 'SLOT' | 'ROULETTE'>('LOBBY');
    const [activePreset, setActivePreset] = useState<CameraViewPreset>('OVERVIEW');
    const [hoveredStation, setHoveredStation] = useState<string | null>(null);
    const controlsRef = useRef<any>(null);
    const keysPressed = useRef<Record<string, boolean>>({});

    // Tastatur-Events für Geh-Steuerung registrieren
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['KeyW', 'KeyS', 'KeyA', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                keysPressed.current[e.code] = true;
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            delete keysPressed.current[e.code];
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const handleSelectGame = (gameId: string) => {
        if (onSelectGame) {
            onSelectGame(gameId);
        } else {
            if (gameId === 'SLOT3D') setActiveGame('SLOT');
            else if (gameId === 'ROULETTE3D') setActiveGame('ROULETTE');
        }
    };

    if (activeGame === 'SLOT') {
        return <SlotMachine3D initialBalance={initialBalance} onBackToLobby={() => setActiveGame('LOBBY')} />;
    }

    if (activeGame === 'ROULETTE') {
        return <Roulette3D initialBalance={initialBalance} onBackToLobby={() => setActiveGame('LOBBY')} />;
    }

    return (
        <div style={{
            width: '100%',
            height: '100%',
            minHeight: '560px',
            background: '#070b12',
            color: '#fff',
            position: 'relative',
            userSelect: 'none',
            overflow: 'hidden'
        }}>
            {/* Header Overlay mit Titel & Steuerungshinweisen */}
            <div style={{
                position: 'absolute',
                top: 18,
                left: 20,
                zIndex: 10,
                background: 'rgba(11, 23, 38, 0.92)',
                backdropFilter: 'blur(10px)',
                padding: '12px 18px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🏛️</span>
                    <h2 style={{ color: 'var(--stake-gold)', margin: 0, fontSize: '1.15rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
                        Grand VIP 3D Casino Walkthrough
                    </h2>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Mit <strong>W / A / S / D</strong> oder Pfeiltasten durch den Raum gehen &bull; Maus ziehen zum Umschauen &bull; Station anklicken zum Spielen
                </p>
            </div>

            {/* Kamera-Schnellwahltasten (Waypoints) */}
            <div style={{
                position: 'absolute',
                top: 18,
                right: 20,
                zIndex: 10,
                display: 'flex',
                gap: '8px',
                background: 'rgba(11, 23, 38, 0.92)',
                backdropFilter: 'blur(10px)',
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.12)'
            }}>
                {[
                    { id: 'OVERVIEW', label: '👁️ Übersicht' },
                    { id: 'SLOT', label: '🎰 Zur Slot' },
                    { id: 'ROULETTE', label: '🎡 Zum Roulette' },
                    { id: 'MINES', label: '💣 Mines & Crash' }
                ].map(b => (
                    <button
                        key={b.id}
                        onClick={() => setActivePreset(b.id as CameraViewPreset)}
                        style={{
                            background: activePreset === b.id ? 'var(--stake-gold)' : 'rgba(255, 255, 255, 0.08)',
                            color: activePreset === b.id ? '#000' : '#fff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        {b.label}
                    </button>
                ))}
            </div>

            {/* 3D WebGL Canvas */}
            <Canvas
                camera={{ position: [0, 2.4, 6.2], fov: 50 }}
                gl={{ antialias: true, powerPreference: 'high-performance' }}
                dpr={[1, 2]}
            >
                {/* Kamera-Logik */}
                <CameraRig
                    targetPreset={activePreset}
                    controlsRef={controlsRef}
                    keysPressed={keysPressed}
                />

                {/* Beleuchtung für echtes Casino-Ambiente */}
                <ambientLight intensity={0.65} />
                <directionalLight position={[8, 12, 6]} intensity={1.8} />
                <pointLight position={[-3.5, 3, -4]} intensity={2.5} color="#f59e0b" distance={10} />
                <pointLight position={[3.5, 3, -4]} intensity={2.5} color="#00e701" distance={10} />
                <pointLight position={[0, 4, 0]} intensity={1.5} color="#38bdf8" distance={14} />

                {/* Luxus-Marmor-/Teppich-Boden */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
                    <planeGeometry args={[30, 30]} />
                    <meshStandardMaterial
                        color="#0c1322"
                        roughness={0.25}
                        metalness={0.4}
                    />
                </mesh>

                {/* VIP Casino Teppich-Insel */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.98, -3.5]} receiveShadow>
                    <planeGeometry args={[14, 9]} />
                    <meshStandardMaterial
                        color="#111c30"
                        roughness={0.65}
                        metalness={0.1}
                    />
                </mesh>

                {/* Goldene Zierleiste um den Teppich */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.97, -3.5]}>
                    <ringGeometry args={[5.2, 5.3, 4]} />
                    <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
                </mesh>

                {/* Rückwand mit VIP Logo-Glow */}
                <mesh position={[0, 3, -10]} receiveShadow>
                    <boxGeometry args={[30, 12, 0.8]} />
                    <meshStandardMaterial color="#080e18" roughness={0.8} />
                </mesh>

                {/* Linke & Rechte Wand */}
                <mesh position={[-12, 3, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <boxGeometry args={[24, 12, 0.8]} />
                    <meshStandardMaterial color="#09101d" roughness={0.85} />
                </mesh>
                <mesh position={[12, 3, 0]} rotation={[0, -Math.PI / 2, 0]}>
                    <boxGeometry args={[24, 12, 0.8]} />
                    <meshStandardMaterial color="#09101d" roughness={0.85} />
                </mesh>

                {/* Decke mit indirektem LED-Licht */}
                <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 6, 0]}>
                    <planeGeometry args={[30, 30]} />
                    <meshStandardMaterial color="#060910" roughness={0.9} />
                </mesh>

                {/* Casino Banner an der Rückwand */}
                <Text position={[0, 4.2, -9.5]} fontSize={0.7} color="#fbbf24" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#000">
                    ROYAL STAKE CASINO LOUNGE
                </Text>

                {/* 1. SLOT MACHINE STATION (Links) */}
                <group
                    position={[-3.5, 0, -5]}
                    onClick={() => handleSelectGame('SLOT3D')}
                    onPointerOver={() => setHoveredStation('SLOT')}
                    onPointerOut={() => setHoveredStation(null)}
                    scale={hoveredStation === 'SLOT' ? 1.04 : 1.0}
                >
                    {/* Podest */}
                    <mesh position={[0, -1.8, 0]}>
                        <cylinderGeometry args={[1.8, 2.0, 0.35, 32]} />
                        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
                    </mesh>

                    {/* Gehäuse */}
                    <mesh position={[0, 0, 0]} castShadow>
                        <boxGeometry args={[2.2, 3.4, 1.8]} />
                        <meshStandardMaterial color="#18181b" metalness={0.85} roughness={0.2} />
                    </mesh>

                    {/* Goldenes Marquee Top */}
                    <mesh position={[0, 1.9, 0]}>
                        <boxGeometry args={[2.3, 0.55, 1.9]} />
                        <meshStandardMaterial color="#f59e0b" metalness={0.95} roughness={0.1} />
                    </mesh>

                    {/* Bildschirm */}
                    <mesh position={[0, 0.3, 0.92]}>
                        <planeGeometry args={[1.8, 1.5]} />
                        <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.6} />
                    </mesh>

                    {/* Textanzeige */}
                    <Text position={[0, 1.9, 0.98]} fontSize={0.26} color="#000000" anchorX="center" anchorY="middle">
                        ROYAL 3D SLOT
                    </Text>
                    <Text position={[0, 0.3, 0.95]} fontSize={0.38} color="#ffffff" anchorX="center" anchorY="middle">
                        🎰 7️⃣ 👑 🍒
                    </Text>
                    <Text position={[0, -0.9, 0.95]} fontSize={0.22} color="#00e701" anchorX="center" anchorY="middle">
                        [ JETZT SPIELEN ]
                    </Text>
                </group>

                {/* 2. ROULETTE TISCH STATION (Rechts) */}
                <group
                    position={[3.5, 0, -5]}
                    onClick={() => handleSelectGame('ROULETTE3D')}
                    onPointerOver={() => setHoveredStation('ROULETTE')}
                    onPointerOut={() => setHoveredStation(null)}
                    scale={hoveredStation === 'ROULETTE' ? 1.04 : 1.0}
                >
                    {/* Podest */}
                    <mesh position={[0, -1.8, 0]}>
                        <cylinderGeometry args={[2.4, 2.6, 0.35, 32]} />
                        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
                    </mesh>

                    {/* Mahagoni Holztisch Basis */}
                    <mesh position={[0, -0.6, 0]} castShadow>
                        <cylinderGeometry args={[2.2, 2.4, 1.2, 36]} />
                        <meshStandardMaterial color="#381504" roughness={0.3} metalness={0.2} />
                    </mesh>

                    {/* Grüner Filzring */}
                    <mesh position={[0, 0.05, 0]}>
                        <cylinderGeometry args={[2.3, 2.3, 0.1, 36]} />
                        <meshStandardMaterial color="#047857" roughness={0.7} />
                    </mesh>

                    {/* Kessel Zentrum */}
                    <mesh position={[0, 0.25, 0]}>
                        <cylinderGeometry args={[1.5, 1.5, 0.3, 36]} />
                        <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
                    </mesh>

                    {/* Turm in Kesselmitte */}
                    <mesh position={[0, 0.55, 0]}>
                        <coneGeometry args={[0.3, 0.4, 32]} />
                        <meshStandardMaterial color="#d97706" metalness={0.95} roughness={0.05} />
                    </mesh>

                    {/* Beschriftung */}
                    <Text position={[0, 1.9, 0]} fontSize={0.3} color="#f59e0b" anchorX="center" anchorY="middle">
                        3D LIVE ROULETTE
                    </Text>
                    <Text position={[0, -0.9, 1.3]} fontSize={0.22} color="#00e701" anchorX="center" anchorY="middle">
                        [ JETZT SPIELEN ]
                    </Text>
                </group>

                {/* 3. MINES & CRASH STATION (Mitte hinten) */}
                <group
                    position={[0, 0, -6.5]}
                    onClick={() => handleSelectGame('MINES')}
                    onPointerOver={() => setHoveredStation('MINES')}
                    onPointerOut={() => setHoveredStation(null)}
                    scale={hoveredStation === 'MINES' ? 1.04 : 1.0}
                >
                    {/* Podest */}
                    <mesh position={[0, -1.8, 0]}>
                        <cylinderGeometry args={[1.6, 1.8, 0.35, 32]} />
                        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
                    </mesh>

                    {/* Terminal Säule */}
                    <mesh position={[0, -0.4, 0]}>
                        <boxGeometry args={[1.6, 1.6, 1.2]} />
                        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
                    </mesh>

                    {/* Screen */}
                    <mesh position={[0, 0.6, 0.2]} rotation={[-0.3, 0, 0]}>
                        <boxGeometry args={[1.8, 1.2, 0.15]} />
                        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.1} />
                    </mesh>

                    <Text position={[0, 1.5, 0]} fontSize={0.26} color="#38bdf8" anchorX="center" anchorY="middle">
                        STAKE MINES & CRASH
                    </Text>
                    <Text position={[0, 0.6, 0.35]} rotation={[-0.3, 0, 0]} fontSize={0.32} color="#ffffff" anchorX="center" anchorY="middle">
                        💣 🚀 💎
                    </Text>
                    <Text position={[0, -0.8, 0.7]} fontSize={0.2} color="#00e701" anchorX="center" anchorY="middle">
                        [ JETZT SPIELEN ]
                    </Text>
                </group>

                {/* ORBIT CONTROLS - PERFEKT ABGESTIMMT OHNE HÄNGER ODER ABSINKEN */}
                <OrbitControls
                    ref={controlsRef}
                    target={[0, 0.5, -4.5]}
                    enableZoom={true}
                    enablePan={false}
                    enableDamping={true}
                    dampingFactor={0.06}
                    minDistance={2.5}
                    maxDistance={12.0}
                    minPolarAngle={Math.PI / 4}
                    maxPolarAngle={Math.PI / 2 - 0.15}
                />
            </Canvas>

            {/* Kleines Steuerungs-Badge unten links */}
            <div style={{
                position: 'absolute',
                bottom: 16,
                left: 20,
                zIndex: 10,
                background: 'rgba(11, 23, 38, 0.85)',
                backdropFilter: 'blur(8px)',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                border: '1px solid rgba(255,255,255,0.08)',
                pointerEvents: 'none'
            }}>
                🎮 Steuerung: WASD zum Laufen &bull; Maus ziehen zum Umschauen &bull; Scrollen zum Zoomen
            </div>
        </div>
    );
};

