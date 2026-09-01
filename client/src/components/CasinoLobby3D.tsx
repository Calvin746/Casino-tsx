import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Environment } from '@react-three/drei';
import { SlotMachine3D } from './SlotMachine3D';

interface CasinoLobbyProps {
    initialBalance: number;
}

export const CasinoLobby3D: React.FC<CasinoLobbyProps> = ({ initialBalance }) => {
    const [activeGame, setActiveGame] = useState<'LOBBY' | 'SLOT'>('SLOT');

    if (activeGame === 'SLOT') {
        return <SlotMachine3D initialBalance={initialBalance} onBackToLobby={() => setActiveGame('LOBBY')} />;
    }

    return (
        <div style={{ width: '100vw', height: '100vh', background: '#0a0a0c', color: '#fff', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
                <h1 style={{ color: '#c5a059', margin: 0, textShadow: '0 0 10px rgba(197, 160, 89, 0.5)' }}>Grand Casino Lobby</h1>
                <p>Wähle dein Spiel durch Klicken in der 3D-Welt (oder Navigation)</p>
            </div>
            
            <Canvas camera={{ position: [0, 2, 8], fov: 50 }}>
                <ambientLight intensity={0.4} />
                <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
                <Environment preset="night" />
                
                {/* Floor */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
                    <planeGeometry args={[50, 50]} />
                    <meshStandardMaterial color="#1a1a24" roughness={0.1} metalness={0.5} />
                </mesh>

                {/* Walls (Simple) */}
                <mesh position={[0, 3, -10]} receiveShadow>
                    <boxGeometry args={[30, 10, 1]} />
                    <meshStandardMaterial color="#0f0f13" roughness={0.8} />
                </mesh>

                {/* Slot Machine Station (Interactive) */}
                <group position={[-3, 0, -5]} onClick={() => setActiveGame('SLOT')}>
                    <mesh position={[0, 0, 0]} castShadow>
                        <boxGeometry args={[2, 4, 2]} />
                        <meshStandardMaterial color="#333" metalness={0.8} />
                    </mesh>
                    <Text position={[0, 2.5, 0]} fontSize={0.5} color="#c5a059" anchorX="center" anchorY="middle">
                        SLOT MACHINE
                    </Text>
                </group>

                {/* Roulette Station (Placeholder) */}
                <group position={[3, 0, -5]}>
                    <mesh position={[0, -0.5, 0]} castShadow>
                        <cylinderGeometry args={[2, 2, 1, 32]} />
                        <meshStandardMaterial color="#005500" roughness={0.8} />
                    </mesh>
                    <Text position={[0, 1, 0]} fontSize={0.5} color="#c5a059" anchorX="center" anchorY="middle">
                        ROULETTE (Bald)
                    </Text>
                </group>

                <OrbitControls 
                    enableZoom={true} 
                    maxPolarAngle={Math.PI / 2 - 0.05} // Don't go below floor
                    minDistance={3}
                    maxDistance={15}
                />
            </Canvas>
        </div>
    );
};
