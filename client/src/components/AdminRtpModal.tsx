import React, { useState, useEffect } from 'react';
import { getRtpSettings, saveRtpSettings, applyRtpPreset, RtpSettings } from '../utils/rtpManager';

interface AdminRtpModalProps {
    onClose: () => void;
}

export const AdminRtpModal: React.FC<AdminRtpModalProps> = ({ onClose }) => {
    const [settings, setSettings] = useState<RtpSettings>(getRtpSettings());
    const [savedNotice, setSavedNotice] = useState<boolean>(false);

    useEffect(() => {
        const handleChanged = () => setSettings(getRtpSettings());
        window.addEventListener('rtp-settings-changed', handleChanged);
        return () => window.removeEventListener('rtp-settings-changed', handleChanged);
    }, []);

    const handleChange = <K extends keyof RtpSettings>(key: K, value: RtpSettings[K]) => {
        const updated = { ...settings, [key]: value, globalPreset: 'CUSTOM' as any };
        setSettings(updated);
        saveRtpSettings(updated);
        showSaveNotification();
    };

    const handlePresetSelect = (preset: RtpSettings['globalPreset']) => {
        const updated = applyRtpPreset(preset);
        setSettings(updated);
        showSaveNotification();
    };

    const showSaveNotification = () => {
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 2000);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                background: '#0f172a',
                border: '2px solid #f59e0b',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '720px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 0 50px rgba(245, 158, 11, 0.4)',
                padding: '28px',
                color: '#fff',
                position: 'relative'
            }}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '18px',
                        right: '18px',
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        fontSize: '1.4rem',
                        cursor: 'pointer'
                    }}
                >
                    ✕
                </button>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '16px' }}>
                    <span style={{ fontSize: '2rem' }}>👑</span>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#f59e0b', fontWeight: 900, fontFamily: 'var(--font-display)' }}>
                            ADMIN CASINO RTP & ODDS CONTROL
                        </h2>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                            Verändere die Gewinnwahrscheinlichkeiten & Algorithmen für alle Spiele in Echtzeit!
                        </p>
                    </div>
                </div>

                {savedNotice && (
                    <div style={{
                        background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                        color: '#fff',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        marginBottom: '16px',
                        textAlign: 'center',
                        animation: 'fadeIn 0.3s'
                    }}>
                        ✓ Einstellungen gespeichert & für alle Spiele übernommen!
                    </div>
                )}

                {/* Section 1: Global Presets */}
                <div style={{ marginBottom: '28px' }}>
                    <h3 style={{ fontSize: '1rem', color: '#38bdf8', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        ⚡ Schnellauswahl / Globale Modus-Presets
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                        <button
                            onClick={() => handlePresetSelect('STANDARD')}
                            style={{
                                background: settings.globalPreset === 'STANDARD' ? '#1e293b' : '#020617',
                                border: settings.globalPreset === 'STANDARD' ? '2px solid #38bdf8' : '1px solid #334155',
                                padding: '14px',
                                borderRadius: '10px',
                                color: '#fff',
                                textAlign: 'left',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#38bdf8' }}>⚖️ Standard Faires Casino</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Normale Quoten (RTP ~96%). Zufallsmuster.</div>
                        </button>

                        <button
                            onClick={() => handlePresetSelect('HOUSE_WINS')}
                            style={{
                                background: settings.globalPreset === 'HOUSE_WINS' ? '#450a0a' : '#020617',
                                border: settings.globalPreset === 'HOUSE_WINS' ? '2px solid #ef4444' : '1px solid #334155',
                                padding: '14px',
                                borderRadius: '10px',
                                color: '#fff',
                                textAlign: 'left',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ef4444' }}>🔴 Haus Gewinnt Immer (0% Win)</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Maximale Verluste für Spieler. Rigged Mode.</div>
                        </button>

                        <button
                            onClick={() => handlePresetSelect('HIGH_RTP')}
                            style={{
                                background: settings.globalPreset === 'HIGH_RTP' ? '#064e3b' : '#020617',
                                border: settings.globalPreset === 'HIGH_RTP' ? '2px solid #10b981' : '1px solid #334155',
                                padding: '14px',
                                borderRadius: '10px',
                                color: '#fff',
                                textAlign: 'left',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#10b981' }}>🟢 Hohe Gewinne (85% Win)</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Häufige Gewinne & hohe Multiplikatoren.</div>
                        </button>

                        <button
                            onClick={() => handlePresetSelect('GOD_MODE')}
                            style={{
                                background: settings.globalPreset === 'GOD_MODE' ? '#78350f' : '#020617',
                                border: settings.globalPreset === 'GOD_MODE' ? '2px solid #f59e0b' : '1px solid #334155',
                                padding: '14px',
                                borderRadius: '10px',
                                color: '#fff',
                                textAlign: 'left',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#f59e0b' }}>💎 Gott Modus (100% Win Guarantee)</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Zeigt Minen-Standorte & 100% Slot Hits.</div>
                        </button>
                    </div>
                </div>

                {/* Section 2: Slot Machine Controls */}
                <div style={{ background: '#020617', padding: '18px', borderRadius: '12px', border: '1px solid #1e293b', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, color: '#f59e0b', fontSize: '1rem', fontWeight: 800 }}>🎰 3D Slot Machine Wahrscheinlichkeiten</h4>
                        <span style={{ background: '#f59e0b', color: '#000', padding: '2px 8px', borderRadius: '4px', fontWeight: 900, fontSize: '0.8rem' }}>
                            {settings.slotWinChance}% Chance
                        </span>
                    </div>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                        Gewinnchance pro Drehung (0% = immer Verlust, 100% = immer Gewinn):
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={settings.slotWinChance}
                        onChange={(e) => handleChange('slotWinChance', Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }}
                    />
                </div>

                {/* Section 3: Roulette Controls */}
                <div style={{ background: '#020617', padding: '18px', borderRadius: '12px', border: '1px solid #1e293b', marginBottom: '20px' }}>
                    <h4 style={{ margin: 0, color: '#00c853', fontSize: '1rem', fontWeight: 800, marginBottom: '12px' }}>
                        🎡 European 3D Roulette Steuerung
                    </h4>
                    
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                        {(['RANDOM', 'FORCE_WIN', 'FORCE_LOSS'] as const).map(mode => (
                            <button
                                key={mode}
                                onClick={() => handleChange('rouletteMode', mode)}
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    borderRadius: '6px',
                                    border: settings.rouletteMode === mode ? '2px solid #00c853' : '1px solid #334155',
                                    background: settings.rouletteMode === mode ? '#064e3b' : '#0f172a',
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    cursor: 'pointer'
                                }}
                            >
                                {mode === 'RANDOM' ? '🎲 Normaler Zufall' : (mode === 'FORCE_WIN' ? '🎯 Spieler Gewinnt' : '🚫 Haus Gewinnt')}
                            </button>
                        ))}
                    </div>

                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                        Kugel-Trefferwahrscheinlichkeit für Spielerwette: ({settings.rouletteWinChance}%)
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={settings.rouletteWinChance}
                        onChange={(e) => handleChange('rouletteWinChance', Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#00c853', cursor: 'pointer' }}
                    />
                </div>

                {/* Section 4: Mines Controls */}
                <div style={{ background: '#020617', padding: '18px', borderRadius: '12px', border: '1px solid #1e293b', marginBottom: '20px' }}>
                    <h4 style={{ margin: 0, color: '#ef4444', fontSize: '1rem', fontWeight: 800, marginBottom: '12px' }}>
                        💣 Mines Game Manipulations-Optionen
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={settings.minesShowLocations}
                                onChange={(e) => handleChange('minesShowLocations', e.target.checked)}
                                style={{ width: '18px', height: '18px', accentColor: '#ef4444' }}
                            />
                            <span>👁️ Röntgenblick (Zeige verdeckte Bombensymbole transparent an)</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={settings.minesRiggedLoss}
                                onChange={(e) => handleChange('minesRiggedLoss', e.target.checked)}
                                style={{ width: '18px', height: '18px', accentColor: '#ef4444' }}
                            />
                            <span>💥 Sofortige Explosion beim 1. Klick erzwingen</span>
                        </label>
                    </div>
                </div>

                {/* Section 5: Crash Game Controls */}
                <div style={{ background: '#020617', padding: '18px', borderRadius: '12px', border: '1px solid #1e293b' }}>
                    <h4 style={{ margin: 0, color: '#a855f7', fontSize: '1rem', fontWeight: 800, marginBottom: '12px' }}>
                        🚀 Crash Game Kurven-Steuerung
                    </h4>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={settings.crashInstantBust}
                                onChange={(e) => handleChange('crashInstantBust', e.target.checked)}
                                style={{ width: '18px', height: '18px', accentColor: '#a855f7' }}
                            />
                            <span>💥 Sofortiger Bust bei 1.00x (Instant Loss)</span>
                        </label>
                    </div>
                </div>

                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    <button
                        onClick={onClose}
                        className="stake-btn stake-btn-green"
                        style={{ padding: '12px 36px', fontSize: '1rem', fontWeight: 900 }}
                    >
                        Fertig & Schließen
                    </button>
                </div>
            </div>
        </div>
    );
};
