import React, { useState, useEffect, useRef } from 'react';

export interface ChatMessage {
    id: string;
    username: string;
    vipBadge: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
    badgeColor: string;
    text: string;
    time: string;
    isUser?: boolean;
    isHighlight?: boolean;
}

const BOT_USERS = [
    { name: 'CryptoKing_99', vip: 'DIAMOND', color: '#38bdf8' },
    { name: 'VegasViper', vip: 'PLATINUM', color: '#c084fc' },
    { name: 'LuckyStrike', vip: 'GOLD', color: '#f59e0b' },
    { name: 'KryptoKlaus', vip: 'SILVER', color: '#94a3b8' },
    { name: 'HighRoller_DE', vip: 'PLATINUM', color: '#c084fc' },
    { name: 'MoonShooter', vip: 'GOLD', color: '#f59e0b' },
    { name: 'DiamondHands', vip: 'DIAMOND', color: '#38bdf8' },
    { name: 'StakeMaster', vip: 'GOLD', color: '#f59e0b' },
    { name: 'QueenOfSlots', vip: 'PLATINUM', color: '#c084fc' },
    { name: 'SpinDoctor_88', vip: 'BRONZE', color: '#ca8a04' },
    { name: 'BlackjackPro', vip: 'DIAMOND', color: '#38bdf8' },
    { name: 'ZeroHero', vip: 'SILVER', color: '#94a3b8' },
    { name: 'RiskTaker99', vip: 'GOLD', color: '#f59e0b' },
    { name: 'MegaWhale', vip: 'DIAMOND', color: '#38bdf8' },
    { name: 'AceHunter', vip: 'SILVER', color: '#94a3b8' }
];

const BOT_CONVERSATIONS: Array<{ trigger?: string; message: string; highlight?: boolean }> = [
    { message: 'OMG gerade 36x auf die 17 getroffen im Roulette!! 🔥🚀', highlight: true },
    { message: 'Gutes Spiel! Welcher Einsatz?' },
    { message: '50€ drauf gehabt haha, 1800€ Win! 🥳' },
    { message: 'GG bro! Auszahlen und genießen!' },
    { message: 'Blackjack läuft heute extrem stabil, 4 Wins in Folge 🃏' },
    { message: 'Immer Stand auf 17 oder zieht ihr manchmal?' },
    { message: 'Immer Stand bei 17, sonst rip balance haha' },
    { message: 'Mines mit 5 Minen ist mein absoluter Favorit gerade 💎' },
    { message: 'Bis wie viel Diamanten casht du aus?' },
    { message: 'Meistens bei 4-5 Diamanten, dann 3.2x mitnehmen!' },
    { message: 'Crash ist vorhin auf 14.5x hochgeschossen 🚀' },
    { message: 'Jaaa ich bin bei 8x raus, 400€ Gewinn 💪' },
    { message: 'Schöner Hit! Viel Glück allen an den Tischen 🍀' },
    { message: 'Kann man schon P2P Sportwetten gegen andere machen?' },
    { message: 'Ja geht! 2% Fee ist super fair im Vergleich zu normalen Bookies' },
    { message: 'Mega, gleich mal Wette auf Bayern vs Dortmund aufmachen ⚽' },
    { message: 'LFG!! 🚀' },
    { message: 'Gleich noch eine Runde 3D Slot drehen, die Kronen müssen fallen 👑' },
    { message: 'Viel Glück @all heute Abend! Möge das Krypto-Glück mit euch sein' },
    { message: 'Nice streak heute, balance verdoppelt ✨' },
    { message: 'Rain im Chat wäre jetzt nice haha 🌧️' }
];

const USER_REACTION_REPLIES = [
    'GG bro! 🚀',
    'Viel Glück dir! 🍀',
    'Nice! Lass krachen!',
    'LFG!! 🔥',
    'Willkommen im Chat!',
    'Welches Game spielst du gerade?',
    'Möge Fortuna mit dir sein 👑',
    'Komm an den Blackjack Tisch!'
];

interface LiveChatProps {
    isOpen: boolean;
    onClose: () => void;
    userEmail?: string;
}

export const LiveChat: React.FC<LiveChatProps> = ({ isOpen, onClose, userEmail }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            username: 'StakeMaster',
            vipBadge: 'GOLD',
            badgeColor: '#f59e0b',
            text: 'Willkommen im Stake.Royal Live-Chat! 🎉',
            time: '14:20'
        },
        {
            id: '2',
            username: 'BlackjackPro',
            vipBadge: 'DIAMOND',
            badgeColor: '#38bdf8',
            text: 'Das neue 3D Roulette dreht sich so clean! 🎡',
            time: '14:21'
        },
        {
            id: '3',
            username: 'VegasViper',
            vipBadge: 'PLATINUM',
            badgeColor: '#c084fc',
            text: 'Und Blackjack zahlt 3:2 wie im echten Casino 🃏🔥',
            time: '14:21',
            isHighlight: true
        }
    ]);

    const [input, setInput] = useState('');
    const [onlineCount, setOnlineCount] = useState(1482);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const nextBotMsgIndex = useRef(0);

    // Auto-scroll ONLY the chat messages container (NEVER the whole window/page)
    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fluctuate online count slightly
    useEffect(() => {
        const interval = setInterval(() => {
            setOnlineCount(prev => prev + Math.floor(Math.random() * 5) - 2);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Bot conversation generator
    useEffect(() => {
        const botTimer = setInterval(() => {
            const botData = BOT_USERS[Math.floor(Math.random() * BOT_USERS.length)];
            const conv = BOT_CONVERSATIONS[nextBotMsgIndex.current % BOT_CONVERSATIONS.length];
            nextBotMsgIndex.current += 1;

            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

            const newMsg: ChatMessage = {
                id: Date.now().toString() + Math.random(),
                username: botData.name,
                vipBadge: botData.vip as any,
                badgeColor: botData.color,
                text: conv.message,
                time: timeStr,
                isHighlight: conv.highlight
            };

            setMessages(prev => [...prev.slice(-40), newMsg]);
        }, 4200 + Math.random() * 2500); // Between 4.2s and 6.7s

        return () => clearInterval(botTimer);
    }, []);

    const sendMessage = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim()) return;

        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const cleanName = userEmail ? userEmail.split('@')[0] : 'Du';

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            username: cleanName,
            vipBadge: 'DIAMOND',
            badgeColor: '#00e701',
            text: input.trim(),
            time: timeStr,
            isUser: true
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');

        // A bot occasionally replies to the user after 1.5 - 3.5s
        if (Math.random() < 0.8) {
            setTimeout(() => {
                const bot = BOT_USERS[Math.floor(Math.random() * BOT_USERS.length)];
                const replyText = USER_REACTION_REPLIES[Math.floor(Math.random() * USER_REACTION_REPLIES.length)];
                const botTime = new Date();
                const bTimeStr = `${botTime.getHours().toString().padStart(2, '0')}:${botTime.getMinutes().toString().padStart(2, '0')}`;

                setMessages(prev => [...prev, {
                    id: Date.now().toString() + 'r',
                    username: bot.name,
                    vipBadge: bot.vip as any,
                    badgeColor: bot.color,
                    text: `@${cleanName} ${replyText}`,
                    time: bTimeStr
                }]);
            }, 1800 + Math.random() * 1800);
        }
    };

    const sendQuickReaction = (emoji: string) => {
        setInput(prev => (prev ? prev + ' ' + emoji : emoji));
    };

    if (!isOpen) return null;

    return (
        <aside style={{
            width: '340px',
            minWidth: '340px',
            height: 'calc(100vh - 72px)',
            position: 'sticky',
            top: '72px',
            background: 'var(--bg-card)',
            borderLeft: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 90,
            boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.4)',
            animation: 'fadeIn 0.25s ease-out'
        }}>
            {/* Chat Header */}
            <div style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-main)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>💬</span>
                    <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-white)', fontFamily: 'var(--font-display)' }}>
                            Casino Live-Chat
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            <span style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                background: 'var(--stake-green)',
                                display: 'inline-block',
                                boxShadow: '0 0 8px var(--stake-green)'
                            }}></span>
                            <span>{onlineCount.toLocaleString('de-DE')} online</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="stake-badge stake-badge-original">DEUTSCH</span>
                    <button
                        onClick={onClose}
                        title="Chat schließen"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            fontSize: '1.2rem',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '4px'
                        }}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Chat Rain Banner */}
            <div style={{
                background: 'linear-gradient(90deg, rgba(0, 231, 1, 0.1) 0%, rgba(20, 117, 225, 0.1) 100%)',
                padding: '8px 14px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem'
            }}>
                <span style={{ color: 'var(--text-white)', fontWeight: 600 }}>
                    🌧️ Chat Rain aktiv
                </span>
                <span style={{ color: 'var(--stake-gold)', fontWeight: 800 }}>
                    50.00 € Pool
                </span>
            </div>

            {/* Messages Scroll Area */}
            <div
                ref={chatContainerRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '14px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                }}
            >
                {messages.map(msg => (
                    <div
                        key={msg.id}
                        style={{
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-md)',
                            background: msg.isUser
                                ? 'rgba(0, 231, 1, 0.08)'
                                : msg.isHighlight
                                ? 'rgba(245, 158, 11, 0.1)'
                                : 'var(--bg-elevated)',
                            border: msg.isUser
                                ? '1px solid rgba(0, 231, 1, 0.25)'
                                : msg.isHighlight
                                ? '1px solid rgba(245, 158, 11, 0.3)'
                                : '1px solid var(--border-subtle)',
                            fontSize: '0.82rem',
                            lineHeight: 1.35,
                            animation: 'slideUp 0.2s ease-out'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {/* VIP Badge */}
                                <span style={{
                                    fontSize: '0.62rem',
                                    fontWeight: 900,
                                    padding: '1px 5px',
                                    borderRadius: '3px',
                                    background: `${msg.badgeColor}22`,
                                    color: msg.badgeColor,
                                    border: `1px solid ${msg.badgeColor}55`,
                                    letterSpacing: '0.5px'
                                }}>
                                    {msg.vipBadge}
                                </span>
                                <span style={{
                                    fontWeight: 700,
                                    color: msg.isUser ? 'var(--stake-green)' : 'var(--text-white)'
                                }}>
                                    {msg.username}
                                </span>
                            </div>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                                {msg.time}
                            </span>
                        </div>
                        <div style={{
                            color: msg.isUser ? '#ffffff' : 'var(--text-primary)',
                            wordBreak: 'break-word',
                            fontWeight: msg.isHighlight ? 600 : 400
                        }}>
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Reactions */}
            <div style={{
                padding: '6px 12px',
                display: 'flex',
                gap: '6px',
                background: 'var(--bg-main)',
                borderTop: '1px solid var(--border-subtle)'
            }}>
                {['🔥', '🚀', '💰', '🍀', '👑', '🎉'].map(emoji => (
                    <button
                        key={emoji}
                        type="button"
                        onClick={() => sendQuickReaction(emoji)}
                        style={{
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '4px',
                            padding: '3px 8px',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            transition: 'transform 0.1s'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.2)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                        {emoji}
                    </button>
                ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={sendMessage} style={{
                padding: '10px 12px',
                background: 'var(--bg-main)',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                gap: '8px'
            }}>
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Nachricht schreiben..."
                    maxLength={160}
                    style={{
                        flex: 1,
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 12px',
                        color: 'var(--text-white)',
                        fontSize: '0.85rem',
                        fontFamily: 'var(--font-main)',
                        outline: 'none'
                    }}
                />
                <button
                    type="submit"
                    className="stake-btn stake-btn-green"
                    style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.9rem'
                    }}
                >
                    ➤
                </button>
            </form>
        </aside>
    );
};
export default LiveChat;
