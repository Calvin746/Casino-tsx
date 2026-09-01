import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WalletModal } from './WalletModal';

interface ReelProps {
    position: [number, number, number];
    isSpinning: boolean;
}

const ReelMesh: React.FC<ReelProps> = ({ position, isSpinning }) => {
    const meshRef = useRef<THREE.Mesh>(null!);

    useFrame((_, delta) => {
        if (isSpinning && meshRef.current) {
            meshRef.current.rotation.x += delta * 18;
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            <cylinderGeometry args={[1.2, 1.2, 0.8, 32]} />
            <meshStandardMaterial color="#c5a059" metalness={0.85} roughness={0.15} />
        </mesh>
    );
};

export const SlotMachine3D: React.FC<{ initialBalance: number, onBackToLobby?: () => void }> = ({ initialBalance, onBackToLobby }) => {
    const [spinning, setSpinning] = useState(false);
    const [balance, setBalance] = useState<number>(initialBalance); // 100.00 €
    const [kycStatus, setKycStatus] = useState<string>('UNVERIFIED');
    const [result, setResult] = useState<string[] | null>(null);
    const [lastWin, setLastWin] = useState<number>(0);
    const [showWallet, setShowWallet] = useState(false);

    useEffect(() => {
        // Fetch full user data on mount
        const fetchUserData = async () => {
            try {
                const res = await fetch('http://localhost:4000/api/users/me', {
                    credentials: 'include'
                });
                if (res.ok) {
                    const data = await res.json();
                    setBalance(data.balanceCents);
                    setKycStatus(data.kycStatus);
                }
            } catch (e) {
                console.error("Failed to fetch user data", e);
            }
        };
        fetchUserData();
    }, []);

    const handleSpin = async () => {
        if (spinning || balance < 100) return;

        setSpinning(true);
        setResult(null);
        setLastWin(0);

        try {
            const res = await fetch('http://localhost:4000/api/games/slot/spin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    betCents: 100
                })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || 'Fehler aufgetreten');
                setSpinning(false);
                return;
            }

            // Drehanimation für 1.2 Sekunden laufen lassen
            setTimeout(() => {
                setSpinning(false);
                setResult(data.reels);
                setLastWin(data.winCents);
                setBalance(data.newBalanceCents);
            }, 1200);

        } catch (err) {
            setSpinning(false);
            alert('Verbindungsfehler zum Spielserver.');
        }
    };

    return (
        <div style={{ width: '100vw', height: '100vh', background: '#0a0a0c', color: '#fff', display: 'flex', flexDirection: 'column' }}>
            <header style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {onBackToLobby && (
                        <button onClick={onBackToLobby} style={{ padding: '8px 12px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            ← Lobby
                        </button>
                    )}
                    <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#c5a059' }}>Royal 3D Slot</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                        {(balance / 100).toFixed(2)} €
                    </span>
                    <button 
                        onClick={() => setShowWallet(true)}
                        style={{ padding: '8px 16px', background: '#222', color: '#c5a059', border: '1px solid #c5a059', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Wallet
                    </button>
                </div>
            </header>

            <div style={{ flex: 1, position: 'relative' }}>
                <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }}>
                    <ambientLight intensity={0.6} />
                    <directionalLight position={[5, 10, 7]} intensity={1.5} />
                    <ReelMesh position={[-1.6, 0, 0]} isSpinning={spinning} />
                    <ReelMesh position={[0, 0, 0]} isSpinning={spinning} />
                    <ReelMesh position={[1.6, 0, 0]} isSpinning={spinning} />
                </Canvas>
            </div>

            <footer style={{ padding: '24px', textAlign: 'center', background: '#121216', borderTop: '1px solid #222' }}>
                <div style={{ minHeight: '32px', marginBottom: '12px' }}>
                    {result && (
                        <span style={{ fontSize: '1.2rem', color: lastWin > 0 ? '#4ade80' : '#f87171' }}>
                            [{result.join(' - ')}] {lastWin > 0 ? `→ Gewinn: +${(lastWin / 100).toFixed(2)} €` : '→ Kein Gewinn'}
                        </span>
                    )}
                </div>
                <button
                    onClick={handleSpin}
                    disabled={spinning || balance < 100}
                    style={{
                        padding: '14px 40px',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: spinning ? '#444' : '#22c55e',
                        color: '#fff',
                        cursor: spinning ? 'not-allowed' : 'pointer',
                        boxShadow: spinning ? 'none' : '0 4px 14px rgba(34, 197, 94, 0.4)'
                    }}
                >
                    {spinning ? 'Dreht...' : 'Drehen (1,00 €)'}
                </button>
            </footer>

            {showWallet && (
                <WalletModal 
                    onClose={() => setShowWallet(false)}
                    currentBalance={balance}
                    kycStatus={kycStatus}
                    onUpdateBalance={setBalance}
                    onKycUpdate={setKycStatus}
                />
            )}
        </div>
    );
};