import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Environment } from '@react-three/drei';
import { SlotMachine3D } from './SlotMachine3D';
import { Roulette3D } from './games/Roulette3D';

interface CasinoLobbyProps {
    initialBalance: number;
    onSelectGame?: (game: string) => void;
}

export const CasinoLobby3D: React.FC<CasinoLobbyProps> = ({ initialBalance, onSelectGame }) => {
    const [activeGame, setActiveGame] = useState<'LOBBY' | 'SLOT' | 'ROULETTE'>('LOBBY');

    if (activeGame === 'SLOT') {
        return <SlotMachine3D initialBalance={initialBalance} onBackToLobby={() => setActiveGame('LOBBY')} />;
    }

    if (activeGame === 'ROULETTE') {
        return <Roulette3D initialBalance={initialBalance} onBackToLobby={() => setActiveGame('LOBBY')} />;
    }

    return (
        <div style={{ width: '100%', height: '100%', minHeight: '520px', background: '#0a0a0c', color: '#fff', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, background: 'rgba(15, 33, 46, 0.88)', padding: '14px 20px', borderRadius: '8px', border: '1px solid #243b4a' }}>
                <h2 style={{ color: 'var(--stake-gold)', margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-display)' }}>
                    Grand 3D Casino Walkthrough
                </h2>
                <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Klicke auf die <strong>Slot Machine</strong> oder den <strong>Roulette-Tisch</strong> in der 3D-Welt, um direkt zu spielen!
                </p>
            </div>
            
            <Canvas camera={{ position: [0, 3, 9], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
                <pointLight position={[3, 2, -5]} intensity={2.0} color="#00e701" />
                <pointLight position={[-3, 2, -5]} intensity={2.0} color="#f59e0b" />
                <Environment preset="night" />
                
                {/* Floor */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
                    <planeGeometry args={[50, 50]} />
                    <meshStandardMaterial color="#141c28" roughness={0.15} metalness={0.6} />
                </mesh>

                {/* Back Wall */}
                <mesh position={[0, 3, -10]} receiveShadow>
                    <boxGeometry args={[32, 12, 1]} />
                    <meshStandardMaterial color="#0f172a" roughness={0.8} />
                </mesh>

                {/* 1. Slot Machine Station (Interactive 3D group on Left) */}
                <group 
                    position={[-3.5, 0, -5]} 
                    onClick={() => {
                        if (onSelectGame) onSelectGame('SLOT3D');
                        else setActiveGame('SLOT');
                    }}
                >
                    <mesh position={[0, 0, 0]} castShadow>
                        <boxGeometry args={[2.2, 4.2, 2.2]} />
                        <meshStandardMaterial color="#222" metalness={0.85} roughness={0.15} />
                    </mesh>
                    {/* Golden Marquee */}
                    <mesh position={[0, 2.3, 0]}>
                        <boxGeometry args={[2.4, 0.6, 2.4]} />
                        <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.1} />
                    </mesh>
                    <Text position={[0, 2.3, 1.25]} fontSize={0.35} color="#000000" anchorX="center" anchorY="middle">
                        ROYAL 3D SLOT
                    </Text>
                    <Text position={[0, -1.2, 1.15]} fontSize={0.25} color="#00e701" anchorX="center" anchorY="middle">
                        [ HIER KLICKEN ]
                    </Text>
                </group>

                {/* 2. Roulette Station (Interactive 3D group on Right) */}
                <group 
                    position={[3.5, 0, -5]} 
                    onClick={() => {
                        if (onSelectGame) onSelectGame('ROULETTE3D');
                        else setActiveGame('ROULETTE');
                    }}
                >
                    {/* Roulette Wooden Table Base */}
                    <mesh position={[0, -0.6, 0]} castShadow>
                        <cylinderGeometry args={[2.2, 2.4, 1.2, 36]} />
                        <meshStandardMaterial color="#451a03" roughness={0.4} metalness={0.3} />
                    </mesh>
                    {/* Green Felt Rim */}
                    <mesh position={[0, 0.05, 0]}>
                        <cylinderGeometry args={[2.3, 2.3, 0.1, 36]} />
                        <meshStandardMaterial color="#047857" roughness={0.6} />
                    </mesh>
                    {/* Center Wheel */}
                    <mesh position={[0, 0.25, 0]}>
                        <cylinderGeometry args={[1.5, 1.5, 0.3, 36]} />
                        <meshStandardMaterial color="#d97706" metalness={0.85} roughness={0.15} />
                    </mesh>
                    <Text position={[0, 2.3, 0]} fontSize={0.4} color="#f59e0b" anchorX="center" anchorY="middle">
                        3D LIVE ROULETTE
                    </Text>
                    <Text position={[0, -1.2, 1.15]} fontSize={0.25} color="#00e701" anchorX="center" anchorY="middle">
                        [ HIER KLICKEN ]
                    </Text>
                </group>

                <OrbitControls 
                    enableZoom={true} 
                    maxPolarAngle={Math.PI / 2 - 0.05}
                    minDistance={3}
                    maxDistance={15}
                />
            </Canvas>
        </div>
    );
};
