import React, { useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { getRtpSettings } from '../../utils/rtpManager';

// --- Card Types & Deck Logic ---
type Suit = '♠' | '♥' | '♦' | '♣';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface Card {
    suit: Suit;
    rank: Rank;
    faceUp: boolean;
}

const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function createDeck(): Card[] {
    const deck: Card[] = [];
    // 6-Deck Shoe (standard casino)
    for (let d = 0; d < 6; d++) {
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                deck.push({ suit, rank, faceUp: true });
            }
        }
    }
    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function cardValue(card: Card): number {
    if (['J', 'Q', 'K'].includes(card.rank)) return 10;
    if (card.rank === 'A') return 11;
    return parseInt(card.rank);
}

function handValue(hand: Card[]): number {
    let total = 0;
    let aces = 0;
    for (const card of hand) {
        if (!card.faceUp) continue;
        total += cardValue(card);
        if (card.rank === 'A') aces++;
    }
    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }
    return total;
}

function isBlackjack(hand: Card[]): boolean {
    return hand.length === 2 && handValue(hand) === 21;
}

function isSuitRed(suit: Suit): boolean {
    return suit === '♥' || suit === '♦';
}

// --- Card Component ---
const PlayingCard: React.FC<{ card: Card; index: number }> = ({ card, index }) => {
    if (!card.faceUp) {
        return (
            <div className="playing-card-back" style={{ animationDelay: `${index * 0.1}s` }}>
            </div>
        );
    }

    const isRed = isSuitRed(card.suit);

    return (
        <div
            className={`playing-card ${isRed ? 'card-red' : 'card-black'}`}
            style={{ animationDelay: `${index * 0.15}s` }}
        >
            <div className="card-corner card-corner-tl">
                <span>{card.rank}</span>
                <span>{card.suit}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <span className="card-rank">{card.rank}</span>
                <span className="card-suit">{card.suit}</span>
            </div>
            <div className="card-corner card-corner-br">
                <span>{card.rank}</span>
                <span>{card.suit}</span>
            </div>
        </div>
    );
};

// --- Hand Display ---
const HandDisplay: React.FC<{ cards: Card[]; label: string; value: number; isActive?: boolean; result?: string }> = ({
    cards, label, value, isActive, result
}) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: isActive ? 'var(--stake-green)' : 'var(--text-secondary)'
            }}>
                <span>{label}</span>
                <span style={{
                    background: value === 21 ? 'rgba(245, 158, 11, 0.2)' : value > 21 ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-card)',
                    color: value === 21 ? 'var(--stake-gold)' : value > 21 ? '#ef4444' : 'var(--text-white)',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 900,
                    fontSize: '0.9rem',
                    border: `1px solid ${value === 21 ? 'rgba(245, 158, 11, 0.3)' : value > 21 ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-subtle)'}`
                }}>
                    {value}
                </span>
                {result && (
                    <span style={{
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 900,
                        fontSize: '0.75rem',
                        background: result === 'WIN' || result === 'BLACKJACK' ? 'rgba(0, 231, 1, 0.15)' :
                            result === 'PUSH' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: result === 'WIN' || result === 'BLACKJACK' ? 'var(--stake-green)' :
                            result === 'PUSH' ? 'var(--stake-gold)' : '#ef4444',
                        border: `1px solid ${result === 'WIN' || result === 'BLACKJACK' ? 'rgba(0, 231, 1, 0.3)' :
                            result === 'PUSH' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                    }}>
                        {result}
                    </span>
                )}
            </div>
            <div style={{
                display: 'flex',
                gap: '-10px',
                position: 'relative',
                minHeight: '120px',
                justifyContent: 'center'
            }}>
                {cards.map((card, i) => (
                    <div key={i} style={{
                        marginLeft: i > 0 ? '-20px' : '0',
                        zIndex: i,
                        transition: 'transform 0.2s ease'
                    }}>
                        <PlayingCard card={card} index={i} />
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Main Game ---
interface BlackjackGameProps {
    balanceCents: number;
    onUpdateBalance: (newBalance: number) => void;
    onBack: () => void;
}

type GameState = 'betting' | 'playerTurn' | 'dealerTurn' | 'resolved';

export const BlackjackGame: React.FC<BlackjackGameProps> = ({ balanceCents, onUpdateBalance, onBack }) => {
    const [deck, setDeck] = useState<Card[]>(createDeck());
    const [playerHand, setPlayerHand] = useState<Card[]>([]);
    const [dealerHand, setDealerHand] = useState<Card[]>([]);
    const [gameState, setGameState] = useState<GameState>('betting');
    const [betEur, setBetEur] = useState<number>(5);
    const [message, setMessage] = useState('Platziere deinen Einsatz und klicke Austeilen!');
    const [lastWin, setLastWin] = useState<number>(0);
    const [result, setResult] = useState<string>('');
    const [history, setHistory] = useState<Array<{ result: string; amount: number }>>([]);
    const [canDouble, setCanDouble] = useState(false);

    const chipValues = [1, 5, 10, 25, 50, 100];

    const drawCard = useCallback((currentDeck: Card[], faceUp = true): [Card, Card[]] => {
        let d = [...currentDeck];
        if (d.length < 20) d = createDeck(); // Reshuffle when low
        const card = { ...d.pop()!, faceUp };
        return [card, d];
    }, []);

    const triggerWinAnimation = () => {
        confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#fbbf24', '#f59e0b', '#10b981', '#00e701']
        });
    };

    const deal = () => {
        const betCents = Math.round(betEur * 100);
        if (balanceCents < betCents || betEur <= 0) return;

        onUpdateBalance(balanceCents - betCents);
        setLastWin(0);
        setResult('');

        let d = deck.length < 20 ? createDeck() : [...deck];
        const pCards: Card[] = [];
        const dCards: Card[] = [];

        let card: Card;
        [card, d] = drawCard(d, true); pCards.push(card);
        [card, d] = drawCard(d, true); dCards.push(card);
        [card, d] = drawCard(d, true); pCards.push(card);
        [card, d] = drawCard(d, false); dCards.push(card); // Dealer's hole card

        setDeck(d);
        setPlayerHand(pCards);
        setDealerHand(dCards);
        setCanDouble(true);

        // Check for immediate blackjack
        if (isBlackjack(pCards)) {
            // Reveal dealer hole
            dCards[1].faceUp = true;
            setDealerHand([...dCards]);

            if (isBlackjack(dCards)) {
                // Push
                onUpdateBalance(balanceCents); // Return bet
                setMessage('Beide Blackjack! Unentschieden.');
                setResult('PUSH');
                setHistory(prev => [{ result: 'PUSH', amount: 0 }, ...prev.slice(0, 9)]);
                setGameState('resolved');
            } else {
                // Player Blackjack pays 3:2
                const winCents = Math.round(betCents * 2.5);
                onUpdateBalance(balanceCents - betCents + winCents);
                setLastWin(winCents);
                setMessage(`BLACKJACK! 🃏 Du gewinnst ${(winCents / 100).toFixed(2)}€!`);
                setResult('BLACKJACK');
                setHistory(prev => [{ result: 'BLACKJACK', amount: winCents }, ...prev.slice(0, 9)]);
                triggerWinAnimation();
                setGameState('resolved');
            }
            return;
        }

        setGameState('playerTurn');
        setMessage('Deine Runde: Hit, Stand oder Double Down?');
    };

    const hit = () => {
        if (gameState !== 'playerTurn') return;
        setCanDouble(false);

        let d = [...deck];
        let card: Card;
        [card, d] = drawCard(d, true);

        const newHand = [...playerHand, card];
        setPlayerHand(newHand);
        setDeck(d);

        const val = handValue(newHand);
        if (val > 21) {
            // Bust — reveal dealer
            const dh = dealerHand.map(c => ({ ...c, faceUp: true }));
            setDealerHand(dh);
            setMessage(`Bust! ${val} Punkte – du verlierst.`);
            setResult('LOSE');
            setHistory(prev => [{ result: 'LOSE', amount: -Math.round(betEur * 100) }, ...prev.slice(0, 9)]);
            setGameState('resolved');
        } else if (val === 21) {
            stand(newHand);
        }
    };

    const doubleDown = () => {
        if (gameState !== 'playerTurn' || !canDouble) return;

        const betCents = Math.round(betEur * 100);
        if (balanceCents < betCents) {
            setMessage('Nicht genug Guthaben zum Verdoppeln!');
            return;
        }

        onUpdateBalance(balanceCents - betCents); // Deduct additional bet
        setBetEur(betEur * 2);

        // Draw one card then stand
        let d = [...deck];
        let card: Card;
        [card, d] = drawCard(d, true);
        const newHand = [...playerHand, card];
        setPlayerHand(newHand);
        setDeck(d);

        const val = handValue(newHand);
        if (val > 21) {
            const dh = dealerHand.map(c => ({ ...c, faceUp: true }));
            setDealerHand(dh);
            setMessage(`Bust nach Double Down! ${val} Punkte.`);
            setResult('LOSE');
            setHistory(prev => [{ result: 'LOSE', amount: -Math.round(betEur * 200) }, ...prev.slice(0, 9)]);
            setGameState('resolved');
        } else {
            stand(newHand);
        }
    };

    const stand = (currentPlayerHand?: Card[]) => {
        if (gameState !== 'playerTurn') return;
        setCanDouble(false);
        setGameState('dealerTurn');

        const ph = currentPlayerHand || playerHand;
        const playerVal = handValue(ph);

        // Reveal dealer hole card
        let dh = dealerHand.map(c => ({ ...c, faceUp: true }));
        setDealerHand([...dh]);

        let d = [...deck];

        // Dealer draws (Soft 17 rule: dealer stands on all 17s)
        const dealerDraw = () => {
            let dealerVal = handValue(dh);
            const drawNext = () => {
                if (dealerVal < 17) {
                    let card: Card;
                    [card, d] = drawCard(d, true);
                    dh = [...dh, card];
                    setDealerHand([...dh]);
                    setDeck(d);
                    dealerVal = handValue(dh);
                    setTimeout(drawNext, 600);
                } else {
                    resolve(playerVal, dealerVal, dh);
                }
            };
            setTimeout(drawNext, 600);
        };

        setMessage('Dealer zieht...');
        dealerDraw();
    };

    const resolve = (playerVal: number, dealerVal: number, finalDealerHand: Card[]) => {
        const betCents = Math.round(betEur * 100);
        const currentBal = balanceCents - betCents; // Already deducted

        if (dealerVal > 21) {
            // Dealer bust
            const winCents = betCents * 2;
            onUpdateBalance(currentBal + winCents);
            setLastWin(winCents);
            setMessage(`Dealer Bust! (${dealerVal}) – Du gewinnst ${(winCents / 100).toFixed(2)}€!`);
            setResult('WIN');
            setHistory(prev => [{ result: 'WIN', amount: winCents }, ...prev.slice(0, 9)]);
            triggerWinAnimation();
        } else if (playerVal > dealerVal) {
            const winCents = betCents * 2;
            onUpdateBalance(currentBal + winCents);
            setLastWin(winCents);
            setMessage(`${playerVal} vs ${dealerVal} – Du gewinnst ${(winCents / 100).toFixed(2)}€!`);
            setResult('WIN');
            setHistory(prev => [{ result: 'WIN', amount: winCents }, ...prev.slice(0, 9)]);
            triggerWinAnimation();
        } else if (playerVal === dealerVal) {
            onUpdateBalance(currentBal + betCents);
            setMessage(`${playerVal} vs ${dealerVal} – Unentschieden! Einsatz zurück.`);
            setResult('PUSH');
            setHistory(prev => [{ result: 'PUSH', amount: 0 }, ...prev.slice(0, 9)]);
        } else {
            setMessage(`${playerVal} vs ${dealerVal} – Dealer gewinnt.`);
            setResult('LOSE');
            setHistory(prev => [{ result: 'LOSE', amount: -betCents }, ...prev.slice(0, 9)]);
        }
        setGameState('resolved');
    };

    const newRound = () => {
        setBetEur(Math.min(betEur, balanceCents / 100)); // Adjust if needed
        setPlayerHand([]);
        setDealerHand([]);
        setLastWin(0);
        setResult('');
        setCanDouble(false);
        setGameState('betting');
        setMessage('Platziere deinen Einsatz und klicke Austeilen!');
    };

    const playerVal = handValue(playerHand);
    const dealerVal = handValue(dealerHand);

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            padding: '24px',
            maxWidth: '1440px',
            margin: '0 auto',
            boxShadow: 'var(--shadow-elevated)',
            animation: 'fadeIn 0.4s ease-out'
        }}>
            {/* Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={onBack} className="stake-btn stake-btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                        ← Lobby
                    </button>
                    <span style={{ fontSize: '1.5rem' }}>🃏</span>
                    <h2 style={{
                        margin: 0, fontSize: '1.3rem', fontWeight: 900,
                        fontFamily: 'var(--font-display)', color: 'var(--text-white)'
                    }}>
                        Blackjack
                    </h2>
                    <span className="stake-badge stake-badge-original">ORIGINAL</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Mini History */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {history.slice(0, 6).map((h, i) => (
                            <span key={i} style={{
                                width: '24px', height: '24px', borderRadius: '50%',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.65rem', fontWeight: 900,
                                background: h.result === 'WIN' || h.result === 'BLACKJACK' ? 'rgba(0, 231, 1, 0.15)' :
                                    h.result === 'PUSH' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: h.result === 'WIN' || h.result === 'BLACKJACK' ? 'var(--stake-green)' :
                                    h.result === 'PUSH' ? 'var(--stake-gold)' : '#ef4444',
                                border: `1px solid ${h.result === 'WIN' || h.result === 'BLACKJACK' ? 'rgba(0,231,1,0.3)' :
                                    h.result === 'PUSH' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`
                            }}>
                                {h.result === 'WIN' || h.result === 'BLACKJACK' ? 'W' : h.result === 'PUSH' ? 'P' : 'L'}
                            </span>
                        ))}
                    </div>
                    <div style={{ color: 'var(--stake-green)', fontWeight: 900, fontSize: '1.15rem' }}>
                        {(balanceCents / 100).toFixed(2)} €
                    </div>
                </div>
            </div>

            {/* Table */}
            <div style={{
                background: 'linear-gradient(135deg, #064e3b 0%, #047857 30%, #059669 60%, #047857 100%)',
                borderRadius: 'var(--radius-lg)',
                padding: '50px 30px',
                marginBottom: '24px',
                border: '6px solid #022c22',
                boxShadow: 'inset 0 0 40px rgba(0,0,0,0.3)',
                minHeight: '480px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
            }}>
                {/* Blackjack pays 3 to 2 text */}
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: 'rgba(255, 255, 255, 0.15)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '3px',
                    textTransform: 'uppercase'
                }}>
                    BLACKJACK PAYS 3 TO 2
                </div>

                {/* Dealer Hand */}
                <HandDisplay
                    cards={dealerHand}
                    label="DEALER"
                    value={dealerVal}
                    isActive={gameState === 'dealerTurn'}
                    result={gameState === 'resolved' ? (result === 'WIN' || result === 'BLACKJACK' ? 'LOSE' : result === 'LOSE' ? 'WIN' : 'PUSH') : undefined}
                />

                {/* Status Message */}
                <div style={{
                    textAlign: 'center',
                    padding: '16px',
                    animation: 'fadeIn 0.3s ease-out'
                }}>
                    <div style={{
                        display: 'inline-block',
                        background: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(8px)',
                        padding: '10px 28px',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        color: lastWin > 0 ? 'var(--stake-green)' : result === 'LOSE' ? '#ef4444' : 'var(--text-white)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        {message}
                    </div>
                </div>

                {/* Player Hand */}
                <HandDisplay
                    cards={playerHand}
                    label="SPIELER"
                    value={playerVal}
                    isActive={gameState === 'playerTurn'}
                    result={gameState === 'resolved' ? result : undefined}
                />
            </div>

            {/* Controls */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap'
            }}>
                {/* Chip Selector (only in betting state) */}
                {gameState === 'betting' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Einsatz:</span>
                        {chipValues.map(val => (
                            <button
                                key={val}
                                onClick={() => setBetEur(val)}
                                disabled={val * 100 > balanceCents}
                                style={{
                                    width: '44px', height: '44px', borderRadius: '50%',
                                    border: betEur === val ? '3px solid #fff' : '2px dashed rgba(255,255,255,0.3)',
                                    background: val <= 1 ? '#64748b' : val <= 5 ? '#0284c7' : val <= 10 ? '#ef4444' : val <= 25 ? '#16a34a' : val <= 50 ? '#7c3aed' : '#1e1b4b',
                                    color: '#fff', fontWeight: 900, fontSize: '0.75rem',
                                    cursor: val * 100 > balanceCents ? 'not-allowed' : 'pointer',
                                    opacity: val * 100 > balanceCents ? 0.4 : 1,
                                    boxShadow: betEur === val ? '0 0 14px rgba(255,255,255,0.5)' : 'none',
                                    transform: betEur === val ? 'scale(1.15)' : 'scale(1)',
                                    transition: 'all 0.15s'
                                }}
                            >
                                {val}€
                            </button>
                        ))}
                        <div style={{ marginLeft: '8px', textAlign: 'right' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Einsatz</div>
                            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-white)' }}>{betEur.toFixed(2)} €</div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
                    {gameState === 'betting' && (
                        <button
                            onClick={deal}
                            disabled={betEur <= 0 || betEur * 100 > balanceCents}
                            className="stake-btn stake-btn-green glow-green"
                            style={{ padding: '14px 40px', fontSize: '1.1rem', fontWeight: 900, letterSpacing: '0.5px' }}
                        >
                            🃏 AUSTEILEN
                        </button>
                    )}

                    {gameState === 'playerTurn' && (
                        <>
                            <button onClick={hit} className="stake-btn stake-btn-blue" style={{ padding: '12px 28px', fontSize: '1rem', fontWeight: 800 }}>
                                HIT
                            </button>
                            <button onClick={() => stand()} className="stake-btn stake-btn-secondary" style={{ padding: '12px 28px', fontSize: '1rem', fontWeight: 800 }}>
                                STAND
                            </button>
                            {canDouble && (
                                <button
                                    onClick={doubleDown}
                                    disabled={betEur * 100 > balanceCents}
                                    className="stake-btn"
                                    style={{
                                        padding: '12px 28px', fontSize: '1rem', fontWeight: 800,
                                        background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                        color: '#fff',
                                        boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)'
                                    }}
                                >
                                    2× DOUBLE
                                </button>
                            )}
                        </>
                    )}

                    {gameState === 'resolved' && (
                        <button
                            onClick={newRound}
                            className="stake-btn stake-btn-green glow-green"
                            style={{ padding: '14px 40px', fontSize: '1.1rem', fontWeight: 900 }}
                        >
                            NEUE RUNDE
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
