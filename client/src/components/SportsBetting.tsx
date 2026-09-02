import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Match {
    id: string;
    home_team: string;
    away_team: string;
    start_time: string;
    status: string;
}

interface BetOffer {
    id: string;
    creator_team_choice: string;
    stake_cents: number;
    creator_email: string;
}

const API_BASE = 'http://localhost:4000/api';

const SportsBetting: React.FC = () => {
    const [matches, setMatches] = useState<Match[]>([]);
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [openBets, setOpenBets] = useState<BetOffer[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const [teamChoice, setTeamChoice] = useState<'HOME' | 'AWAY' | 'DRAW'>('HOME');
    const [stake, setStake] = useState<number>(50);

    const fetchMatches = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/sports/matches`, { withCredentials: true });
            setMatches(res.data);
        } catch (error) {
            console.error('Error fetching matches', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOpenBets = async (matchId: string) => {
        try {
            const res = await axios.get(`${API_BASE}/sports/bets/open/${matchId}`, { withCredentials: true });
            setOpenBets(res.data);
        } catch (error) {
            console.error('Error fetching open bets', error);
        }
    };

    useEffect(() => {
        fetchMatches();
    }, []);

    const handleSelectMatch = (match: Match) => {
        setSelectedMatch(match);
        fetchOpenBets(match.id);
        setMessage('');
    };

    const handleCreateBet = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMatch) return;
        try {
            await axios.post(`${API_BASE}/sports/bets/create`, {
                matchId: selectedMatch.id,
                teamChoice,
                stakeCents: stake * 100
            }, { withCredentials: true });
            setMessage('Wette erfolgreich erstellt!');
            fetchOpenBets(selectedMatch.id);
        } catch (error: any) {
            setMessage(error.response?.data?.error || 'Fehler beim Erstellen der Wette.');
        }
    };

    const handleAcceptBet = async (betId: string) => {
        try {
            await axios.post(`${API_BASE}/sports/bets/accept`, { betId }, { withCredentials: true });
            setMessage('Wette erfolgreich angenommen!');
            if (selectedMatch) fetchOpenBets(selectedMatch.id);
        } catch (error: any) {
            setMessage(error.response?.data?.error || 'Fehler beim Annehmen der Wette.');
        }
    };

    return (
        <div style={{
            padding: '28px',
            color: 'var(--text-white)',
            background: 'var(--bg-card)',
            minHeight: '80vh',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            animation: 'fadeIn 0.4s ease-out'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <span style={{ fontSize: '2rem' }}>⚽</span>
                <h2 style={{
                    margin: 0,
                    fontSize: '1.6rem',
                    fontWeight: 900,
                    fontFamily: 'var(--font-display)',
                    background: 'linear-gradient(135deg, var(--stake-green), var(--stake-gold))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>P2P Sportwetten</h2>
                <span className="stake-badge stake-badge-vip">LIVE P2P</span>
            </div>

            {/* Info Banner */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(0, 231, 1, 0.08), rgba(245, 158, 11, 0.08))',
                border: '1px solid rgba(0, 231, 1, 0.15)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 18px',
                marginBottom: '24px',
                fontSize: '0.85rem',
                color: 'var(--text-primary)'
            }}>
                💡 Wette direkt gegen andere Spieler! 2% Gebühr auf den Gesamtpool gehen an das Casino. Der Gewinner erhält 98% des Pools.
            </div>

            {message && (
                <div style={{
                    marginBottom: '20px',
                    padding: '12px 18px',
                    background: message.includes('erfolgreich') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    border: `1px solid ${message.includes('erfolgreich') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    color: message.includes('erfolgreich') ? '#10b981' : '#ef4444',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    animation: 'slideUp 0.3s ease-out'
                }}>
                    {message}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
                {/* Matches List */}
                <div>
                    <h3 style={{
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        marginBottom: '16px',
                        color: 'var(--text-white)',
                        fontFamily: 'var(--font-display)'
                    }}>Aktuelle Spiele</h3>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '8px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚽</div>
                            <p>Lade Spiele...</p>
                        </div>
                    ) : matches.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px 20px',
                            background: 'var(--bg-elevated)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)'
                        }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🏟️</div>
                            <p style={{ fontWeight: 600 }}>Keine Spiele verfügbar</p>
                            <p style={{ fontSize: '0.8rem', marginTop: '6px' }}>Neue Spiele werden regelmäßig hinzugefügt.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {matches.map(match => (
                                <div
                                    key={match.id}
                                    onClick={() => handleSelectMatch(match)}
                                    style={{
                                        padding: '16px 18px',
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer',
                                        border: selectedMatch?.id === match.id
                                            ? '2px solid var(--stake-green)'
                                            : '1px solid var(--border-subtle)',
                                        background: selectedMatch?.id === match.id
                                            ? 'rgba(0, 231, 1, 0.06)'
                                            : 'var(--bg-elevated)',
                                        transition: 'all var(--transition-normal)',
                                        boxShadow: selectedMatch?.id === match.id ? 'var(--shadow-glow-green)' : 'none'
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontWeight: 800,
                                        fontSize: '1rem',
                                        color: 'var(--text-white)'
                                    }}>
                                        <span>{match.home_team}</span>
                                        <span style={{
                                            color: 'var(--stake-gold)',
                                            fontSize: '0.75rem',
                                            padding: '2px 10px',
                                            background: 'rgba(245, 158, 11, 0.1)',
                                            borderRadius: 'var(--radius-full)',
                                            fontWeight: 900
                                        }}>VS</span>
                                        <span>{match.away_team}</span>
                                    </div>
                                    <div style={{
                                        fontSize: '0.78rem',
                                        color: 'var(--text-secondary)',
                                        marginTop: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <span>📅</span>
                                        {new Date(match.start_time).toLocaleString('de-DE')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Betting Area */}
                {selectedMatch ? (
                    <div style={{
                        background: 'var(--bg-elevated)',
                        padding: '24px',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-subtle)',
                        animation: 'scaleIn 0.3s ease-out'
                    }}>
                        <h3 style={{
                            fontSize: '1.1rem',
                            fontWeight: 800,
                            marginBottom: '20px',
                            color: 'var(--text-white)',
                            fontFamily: 'var(--font-display)'
                        }}>
                            {selectedMatch.home_team} vs {selectedMatch.away_team}
                        </h3>

                        {/* Open Bets */}
                        <div style={{ marginBottom: '28px' }}>
                            <h4 style={{
                                fontSize: '0.95rem',
                                color: 'var(--stake-gold)',
                                marginBottom: '12px',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <span>🎯</span> Offene P2P Wetten
                            </h4>
                            {openBets.length === 0 ? (
                                <p style={{
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.85rem',
                                    padding: '16px',
                                    textAlign: 'center',
                                    background: 'var(--bg-card)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px dashed var(--border-subtle)'
                                }}>
                                    Noch keine offenen Wetten. Erstelle die erste!
                                </p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {openBets.map(bet => (
                                        <div key={bet.id} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            background: 'var(--bg-card)',
                                            padding: '12px 16px',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--border-subtle)'
                                        }}>
                                            <div>
                                                <span style={{ fontWeight: 800, color: 'var(--text-white)', fontSize: '1.05rem' }}>
                                                    {(bet.stake_cents / 100).toFixed(2)}€
                                                </span>
                                                <span style={{
                                                    fontSize: '0.78rem',
                                                    color: 'var(--text-secondary)',
                                                    marginLeft: '8px'
                                                }}>auf {bet.creator_team_choice === 'HOME' ? selectedMatch.home_team : bet.creator_team_choice === 'AWAY' ? selectedMatch.away_team : 'Unentschieden'}</span>
                                            </div>
                                            <button
                                                onClick={() => handleAcceptBet(bet.id)}
                                                className="stake-btn stake-btn-green"
                                                style={{ padding: '8px 18px', fontSize: '0.8rem' }}
                                            >
                                                Dagegenhalten!
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Create Bet Form */}
                        <div style={{
                            borderTop: '1px solid var(--border-subtle)',
                            paddingTop: '24px'
                        }}>
                            <h4 style={{
                                fontSize: '0.95rem',
                                color: 'var(--stake-gold)',
                                marginBottom: '16px',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <span>✏️</span> Eigene Wette anbieten
                            </h4>
                            <form onSubmit={handleCreateBet} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '6px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                        Ich setze auf:
                                    </label>
                                    <select
                                        value={teamChoice}
                                        onChange={e => setTeamChoice(e.target.value as any)}
                                        style={{
                                            width: '100%',
                                            background: 'var(--bg-input)',
                                            border: '1px solid var(--border-subtle)',
                                            borderRadius: 'var(--radius-md)',
                                            padding: '10px 14px',
                                            color: 'var(--text-white)',
                                            fontSize: '0.9rem',
                                            fontFamily: 'var(--font-main)',
                                            outline: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="HOME">{selectedMatch.home_team} (Heim)</option>
                                        <option value="AWAY">{selectedMatch.away_team} (Gast)</option>
                                        <option value="DRAW">Unentschieden</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '6px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                        Einsatz (€):
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={stake}
                                        onChange={e => setStake(Number(e.target.value))}
                                        style={{
                                            width: '100%',
                                            background: 'var(--bg-input)',
                                            border: '1px solid var(--border-subtle)',
                                            borderRadius: 'var(--radius-md)',
                                            padding: '10px 14px',
                                            color: 'var(--text-white)',
                                            fontSize: '0.9rem',
                                            fontFamily: 'var(--font-main)',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                                <button type="submit" className="stake-btn stake-btn-green glow-green" style={{
                                    padding: '14px',
                                    fontSize: '1rem',
                                    fontWeight: 900,
                                    letterSpacing: '0.5px',
                                    width: '100%'
                                }}>
                                    ⚡ Wette anbieten
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px dashed var(--border-subtle)',
                        padding: '60px 30px',
                        textAlign: 'center',
                        color: 'var(--text-secondary)'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>👈</div>
                        <p style={{ fontWeight: 600, fontSize: '1rem' }}>Wähle ein Spiel aus</p>
                        <p style={{ fontSize: '0.8rem', marginTop: '6px' }}>Klicke links auf ein Spiel, um Wetten zu sehen oder zu erstellen.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SportsBetting;
