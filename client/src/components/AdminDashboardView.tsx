import React, { useState, useEffect } from 'react';
import { getRtpSettings, saveRtpSettings, applyRtpPreset, RtpSettings } from '../utils/rtpManager';

interface AdminDashboardViewProps {
    onBackToLobby: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onBackToLobby }) => {
    const [activeTab, setActiveTab] = useState<'rtp' | 'users' | 'analytics' | 'logs'>('rtp');
    const [settings, setSettings] = useState<RtpSettings>(getRtpSettings());
    const [saveNotice, setSaveNotice] = useState<string | null>(null);

    // Mock Users Data for Admin Management
    const [users, setUsers] = useState([
        { id: '1', email: 'vip_player@stake.local', balance: 100.00, kyc: 'VERIFIED', status: 'ACTIVE', totalWagered: 1450.00, netProfit: -230.00 },
        { id: '2', email: 'highroller_drake@stake.local', balance: 25000.00, kyc: 'VERIFIED', status: 'ACTIVE', totalWagered: 120000.00, netProfit: +4500.00 },
        { id: '3', email: 'test_user@gmail.com', balance: 15.50, kyc: 'PENDING', status: 'ACTIVE', totalWagered: 350.00, netProfit: -84.50 },
        { id: '4', email: 'banned_bot@crypto.org', balance: 0.00, kyc: 'REJECTED', status: 'SUSPENDED', totalWagered: 45.00, netProfit: -45.00 },
    ]);

    // Mock Live Bets Log
    const [liveLogs] = useState([
        { id: 'tx-101', user: 'highroller_drake@stake.local', game: '🎡 Roulette 3D', bet: '500.00 €', win: '18,000.00 €', status: 'WIN', time: 'Vor 12 Sek' },
        { id: 'tx-102', user: 'vip_player@stake.local', game: '🎰 5-Reel Slot', bet: '2.00 €', win: '0.00 €', status: 'LOSS', time: 'Vor 45 Sek' },
        { id: 'tx-103', user: 'test_user@gmail.com', game: '💣 Mines Game', bet: '10.00 €', win: '32.50 €', status: 'WIN', time: 'Vor 2 Min' },
        { id: 'tx-104', user: 'vip_player@stake.local', game: '🚀 Crash Game', bet: '25.00 €', win: '0.00 €', status: 'LOSS', time: 'Vor 4 Min' },
    ]);

    useEffect(() => {
        const handleChanged = () => setSettings(getRtpSettings());
        window.addEventListener('rtp-settings-changed', handleChanged);
        return () => window.removeEventListener('rtp-settings-changed', handleChanged);
    }, []);

    const handleChange = <K extends keyof RtpSettings>(key: K, value: RtpSettings[K]) => {
        const updated = { ...settings, [key]: value, globalPreset: 'CUSTOM' as any };
        setSettings(updated);
        saveRtpSettings(updated);
        notify('Wahrscheinlichkeiten erfolgreich in Echtzeit aktualisiert!');
    };

    const handlePreset = (preset: RtpSettings['globalPreset']) => {
        const updated = applyRtpPreset(preset);
        setSettings(updated);
        notify(`Preset "${preset}" für das gesamte Casino aktiviert!`);
    };

    const notify = (msg: string) => {
        setSaveNotice(msg);
        setTimeout(() => setSaveNotice(null), 3000);
    };

    const handleModifyBalance = (userId: string, delta: number) => {
        setUsers(users.map(u => u.id === userId ? { ...u, balance: Math.max(0, parseFloat((u.balance + delta).toFixed(2))) } : u));
        notify('Benutzerguthaben geändert.');
    };

    const handleToggleStatus = (userId: string) => {
        setUsers(users.map(u => u.id === userId ? { ...u, status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' } : u));
        notify('Benutzerstatus aktualisiert.');
    };

    return (
        <div style={{
            background: 'var(--bg-main)',
            minHeight: '100vh',
            color: '#fff',
            fontFamily: 'var(--font-sans)',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Admin Header Banner */}
            <header style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #090d16 100%)',
                borderBottom: '2px solid #f59e0b',
                padding: '20px 32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 10px 30px rgba(245, 158, 11, 0.2)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '2.4rem' }}>👑</span>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h1 style={{ margin: 0, fontSize: '1.6rem', color: '#f59e0b', fontWeight: 900, fontFamily: 'var(--font-display)' }}>
                                STAKE.ROYAL ADMIN DASHBOARD
                            </h1>
                            <span style={{ background: '#f59e0b', color: '#000', padding: '2px 8px', borderRadius: '4px', fontWeight: 900, fontSize: '0.75rem' }}>
                                MASTER CONTROL
                            </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                            Vollständige Kontrolle über Gewinnraten, Spielerkonten, Haus-Profit & Live-Spiele
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <button
                        onClick={onBackToLobby}
                        className="stake-btn stake-btn-secondary"
                        style={{ padding: '10px 20px', fontSize: '0.9rem', border: '1px solid #334155' }}
                    >
                        ← Zurück zur Casino Lobby
                    </button>
                </div>
            </header>

            {/* Top KPI Metric Cards */}
            <div style={{ padding: '24px 32px 0 32px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '12px' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Gesamter Haus-Profit</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10b981', marginTop: '4px' }}>+142.850,00 €</div>
                    <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px' }}>▲ +12.4% diesen Monat</div>
                </div>

                <div style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '12px' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Aktiver Casino RTP</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f59e0b', marginTop: '4px' }}>
                        {settings.slotWinChance}%
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Preset: {settings.globalPreset}</div>
                </div>

                <div style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '12px' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Registrierte Spieler</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#38bdf8', marginTop: '4px' }}>1.248</div>
                    <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '4px' }}>4 Online jetzt</div>
                </div>

                <div style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '12px' }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Einsatz-Volumen (24h)</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#a855f7', marginTop: '4px' }}>84.320,00 €</div>
                    <div style={{ fontSize: '0.75rem', color: '#a855f7', marginTop: '4px' }}>3.410 Spielrunden</div>
                </div>
            </div>

            {/* Notification Bar */}
            {saveNotice && (
                <div style={{ margin: '16px 32px 0 32px', background: '#059669', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontWeight: 800, fontSize: '0.9rem', textAlign: 'center' }}>
                    ✓ {saveNotice}
                </div>
            )}

            {/* Navigation Tabs */}
            <div style={{ padding: '24px 32px 0 32px' }}>
                <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
                    {[
                        { id: 'rtp', label: '🎛️ RTP & Wahrscheinlichkeiten', icon: '⚡' },
                        { id: 'users', label: '👥 Benutzer-Verwaltung & Guthaben', icon: '👤' },
                        { id: 'analytics', label: '📊 Haus-Statistiken & Profit', icon: '📈' },
                        { id: 'logs', label: '📜 Live-Wetten Log', icon: '📝' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            style={{
                                background: activeTab === tab.id ? '#f59e0b' : '#0f172a',
                                color: activeTab === tab.id ? '#000' : '#94a3b8',
                                border: '1px solid #334155',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                fontWeight: 800,
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab 1: RTP & Wahrscheinlichkeiten */}
            {activeTab === 'rtp' && (
                <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Global Presets */}
                    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '24px' }}>
                        <h3 style={{ margin: '0 0 16px 0', color: '#f59e0b', fontSize: '1.1rem', fontWeight: 900 }}>
                            ⚡ GLOBALE CASINO-MODI PRESETS
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                            <button
                                onClick={() => handlePreset('STANDARD')}
                                style={{
                                    background: settings.globalPreset === 'STANDARD' ? '#1e293b' : '#020617',
                                    border: settings.globalPreset === 'STANDARD' ? '2px solid #38bdf8' : '1px solid #334155',
                                    padding: '16px',
                                    borderRadius: '10px',
                                    color: '#fff',
                                    textAlign: 'left',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#38bdf8' }}>⚖️ Standard Casino</div>
                                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '6px' }}>Faire Zufalls-Quoten (~96% RTP). Normaler Spielablauf.</div>
                            </button>

                            <button
                                onClick={() => handlePreset('HOUSE_WINS')}
                                style={{
                                    background: settings.globalPreset === 'HOUSE_WINS' ? '#450a0a' : '#020617',
                                    border: settings.globalPreset === 'HOUSE_WINS' ? '2px solid #ef4444' : '1px solid #334155',
                                    padding: '16px',
                                    borderRadius: '10px',
                                    color: '#fff',
                                    textAlign: 'left',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#ef4444' }}>🔴 Haus Gewinnt Immer</div>
                                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '6px' }}>0% Gewinnchance. Erzeugt maximale Verluste bei allen Spielen.</div>
                            </button>

                            <button
                                onClick={() => handlePreset('HIGH_RTP')}
                                style={{
                                    background: settings.globalPreset === 'HIGH_RTP' ? '#064e3b' : '#020617',
                                    border: settings.globalPreset === 'HIGH_RTP' ? '2px solid #10b981' : '1px solid #334155',
                                    padding: '16px',
                                    borderRadius: '10px',
                                    color: '#fff',
                                    textAlign: 'left',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#10b981' }}>🟢 Hohe Gewinne (85%)</div>
                                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '6px' }}>Sehr hohe Trefferquote für Slots & Roulette.</div>
                            </button>

                            <button
                                onClick={() => handlePreset('GOD_MODE')}
                                style={{
                                    background: settings.globalPreset === 'GOD_MODE' ? '#78350f' : '#020617',
                                    border: settings.globalPreset === 'GOD_MODE' ? '2px solid #f59e0b' : '1px solid #334155',
                                    padding: '16px',
                                    borderRadius: '10px',
                                    color: '#fff',
                                    textAlign: 'left',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#f59e0b' }}>💎 Gott Modus (100%)</div>
                                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '6px' }}>100% Hits + Röntgenblick für Minen aktivieren.</div>
                            </button>
                        </div>
                    </div>

                    {/* Detailed Game Controls */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                        
                        {/* Slot Machine */}
                        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                <h4 style={{ margin: 0, color: '#f59e0b', fontSize: '1.05rem', fontWeight: 800 }}>🎰 Royal 3D Slot Machine</h4>
                                <span style={{ background: '#f59e0b', color: '#000', padding: '2px 10px', borderRadius: '6px', fontWeight: 900, fontSize: '0.85rem' }}>
                                    {settings.slotWinChance}% Chance
                                </span>
                            </div>
                            <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
                                Trefferwahrscheinlichkeit auf den 20 Paylines:
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={settings.slotWinChance}
                                onChange={(e) => handleChange('slotWinChance', Number(e.target.value))}
                                style={{ width: '100%', accentColor: '#f59e0b', height: '8px', cursor: 'pointer' }}
                            />
                        </div>

                        {/* Roulette */}
                        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                <h4 style={{ margin: 0, color: '#00c853', fontSize: '1.05rem', fontWeight: 800 }}>🎡 European 3D Roulette</h4>
                                <span style={{ background: '#00c853', color: '#000', padding: '2px 10px', borderRadius: '6px', fontWeight: 900, fontSize: '0.85rem' }}>
                                    {settings.rouletteMode}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                {(['RANDOM', 'FORCE_WIN', 'FORCE_LOSS'] as const).map(m => (
                                    <button
                                        key={m}
                                        onClick={() => handleChange('rouletteMode', m)}
                                        style={{
                                            flex: 1,
                                            padding: '8px',
                                            borderRadius: '6px',
                                            background: settings.rouletteMode === m ? '#064e3b' : '#020617',
                                            border: settings.rouletteMode === m ? '2px solid #00c853' : '1px solid #334155',
                                            color: '#fff',
                                            fontWeight: 700,
                                            fontSize: '0.8rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {m === 'RANDOM' ? '🎲 Zufall' : (m === 'FORCE_WIN' ? '🎯 Win' : '🚫 Loss')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Mines */}
                        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
                            <h4 style={{ margin: '0 0 14px 0', color: '#ef4444', fontSize: '1.05rem', fontWeight: 800 }}>💣 Mines Game Steuerung</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={settings.minesShowLocations}
                                        onChange={(e) => handleChange('minesShowLocations', e.target.checked)}
                                        style={{ width: '18px', height: '18px', accentColor: '#ef4444' }}
                                    />
                                    <span>👁️ Röntgenblick (Transparente Bomben auf dem Feld anzeigen)</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={settings.minesRiggedLoss}
                                        onChange={(e) => handleChange('minesRiggedLoss', e.target.checked)}
                                        style={{ width: '18px', height: '18px', accentColor: '#ef4444' }}
                                    />
                                    <span>💥 Sofort-Explosion beim 1. Klick erzwingen</span>
                                </label>
                            </div>
                        </div>

                        {/* Crash */}
                        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '20px' }}>
                            <h4 style={{ margin: '0 0 14px 0', color: '#a855f7', fontSize: '1.05rem', fontWeight: 800 }}>🚀 Crash Game Steuerung</h4>
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
                </div>
            )}

            {/* Tab 2: User Management */}
            {activeTab === 'users' && (
                <div style={{ padding: '24px 32px' }}>
                    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ background: '#020617', borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>
                                    <th style={{ padding: '16px' }}>Benutzer E-Mail</th>
                                    <th style={{ padding: '16px' }}>Guthaben</th>
                                    <th style={{ padding: '16px' }}>KYC Status</th>
                                    <th style={{ padding: '16px' }}>Gesamt Wagered</th>
                                    <th style={{ padding: '16px' }}>Status</th>
                                    <th style={{ padding: '16px', textAlign: 'right' }}>Aktionen</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid #1e293b' }}>
                                        <td style={{ padding: '16px', fontWeight: 700 }}>{u.email}</td>
                                        <td style={{ padding: '16px', color: '#10b981', fontWeight: 900 }}>{u.balance.toFixed(2)} €</td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{
                                                background: u.kyc === 'VERIFIED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                                color: u.kyc === 'VERIFIED' ? '#10b981' : '#f59e0b',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                fontWeight: 800
                                            }}>
                                                {u.kyc}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', color: '#94a3b8' }}>{u.totalWagered.toFixed(2)} €</td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ color: u.status === 'ACTIVE' ? '#10b981' : '#ef4444', fontWeight: 800 }}>
                                                {u.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleModifyBalance(u.id, 100)}
                                                style={{ background: '#064e3b', color: '#10b981', border: 'none', padding: '6px 10px', borderRadius: '4px', marginRight: '6px', cursor: 'pointer', fontWeight: 800 }}
                                            >
                                                +100€
                                            </button>
                                            <button
                                                onClick={() => handleModifyBalance(u.id, -100)}
                                                style={{ background: '#450a0a', color: '#ef4444', border: 'none', padding: '6px 10px', borderRadius: '4px', marginRight: '6px', cursor: 'pointer', fontWeight: 800 }}
                                            >
                                                -100€
                                            </button>
                                            <button
                                                onClick={() => handleToggleStatus(u.id)}
                                                style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 700 }}
                                            >
                                                {u.status === 'ACTIVE' ? 'Sperren' : 'Entsperren'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tab 4: Live Logs */}
            {activeTab === 'logs' && (
                <div style={{ padding: '24px 32px' }}>
                    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ background: '#020617', borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>
                                    <th style={{ padding: '16px' }}>Tx ID</th>
                                    <th style={{ padding: '16px' }}>Spieler</th>
                                    <th style={{ padding: '16px' }}>Spiel</th>
                                    <th style={{ padding: '16px' }}>Einsatz</th>
                                    <th style={{ padding: '16px' }}>Gewinn</th>
                                    <th style={{ padding: '16px' }}>Zeit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {liveLogs.map(l => (
                                    <tr key={l.id} style={{ borderBottom: '1px solid #1e293b' }}>
                                        <td style={{ padding: '16px', color: '#94a3b8' }}>{l.id}</td>
                                        <td style={{ padding: '16px', fontWeight: 700 }}>{l.user}</td>
                                        <td style={{ padding: '16px', color: '#38bdf8' }}>{l.game}</td>
                                        <td style={{ padding: '16px' }}>{l.bet}</td>
                                        <td style={{ padding: '16px', color: l.status === 'WIN' ? '#10b981' : '#ef4444', fontWeight: 900 }}>{l.win}</td>
                                        <td style={{ padding: '16px', color: '#94a3b8' }}>{l.time}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
