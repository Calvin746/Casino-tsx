import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Environment } from '@react-three/drei';
import { SlotMachine3D } from './SlotMachine3D';

interface CasinoLobbyProps {
    initialBalance: number;
    onSelectGame?: (game: string) => void;
}

export const CasinoLobby3D: React.FC<CasinoLobbyProps> = ({ initialBalance, onSelectGame }) => {
    const [activeGame, setActiveGame] = useState<'LOBBY' | 'SLOT'>('LOBBY');

    if (activeGame === 'SLOT') {
        return <SlotMachine3D initialBalance={initialBalance} onBackToLobby={() => setActiveGame('LOBBY')} />;
    }

    return (
        <div style={{ width: '100%', height: '100%', minHeight: '520px', background: '#0a0a0c', color: '#fff', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, background: 'rgba(15, 33, 46, 0.85)', padding: '12px 18px', borderRadius: '8px', border: '1px solid #243b4a' }}>
                <h2 style={{ color: 'var(--stake-gold)', margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>VIP 3D Casino Lounge</h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Klicke auf die Stationen in der 3D-Welt oder bewege die Kamera mit der Maus</p>
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

                {/* Walls */}
                <mesh position={[0, 3, -10]} receiveShadow>
                    <boxGeometry args={[30, 10, 1]} />
                    <meshStandardMaterial color="#0f0f13" roughness={0.8} />
                </mesh>

                {/* Slot Machine Station (Interactive) */}
                <group position={[-3, 0, -5]} onClick={() => {
                    if (onSelectGame) onSelectGame('SLOT3D');
                    else setActiveGame('SLOT');
                }}>
                    <mesh position={[0, 0, 0]} castShadow>
                        <boxGeometry args={[2, 4, 2]} />
                        <meshStandardMaterial color="#333" metalness={0.8} />
                    </mesh>
                    <Text position={[0, 2.5, 0]} fontSize={0.4} color="#f59e0b" anchorX="center" anchorY="middle">
                        ROYAL 3D SLOT
                    </Text>
                </group>

                {/* Mines / Roulette Station */}
                <group position={[3, 0, -5]} onClick={() => {
                    if (onSelectGame) onSelectGame('MINES');
                }}>
                    <mesh position={[0, -0.5, 0]} castShadow>
                        <cylinderGeometry args={[2, 2, 1, 32]} />
                        <meshStandardMaterial color="#00e701" roughness={0.5} metalness={0.6} />
                    </mesh>
                    <Text position={[0, 1, 0]} fontSize={0.4} color="#ffffff" anchorX="center" anchorY="middle">
                        STAKE MINES
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
