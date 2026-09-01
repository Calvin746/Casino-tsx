import React, { useState, useEffect } from 'react';

interface PromoSlide {
    id: string;
    badge: string;
    badgeColor: string;
    title: string;
    subtitle: string;
    ctaText: string;
    bgGradient: string;
    decorIcon: string;
    accentGlow: string;
    category: string;
}

const PROMO_SLIDES: PromoSlide[] = [
    {
        id: 'drake',
        badge: 'DRAKE EXCLUSIVE AMBASSADOR',
        badgeColor: 'var(--stake-gold)',
        title: "DRAKE'S $1.000.000 ROULETTE GIVEAWAY",
        subtitle: 'Drake streamt live auf Stake! Wette bei Slots oder Roulette für deine Chance auf einen Teil des $1M Preispools.',
        ctaText: 'Jetzt Teilnehmen',
        bgGradient: 'linear-gradient(105deg, #161726 0%, #1e1b4b 50%, #0f172a 100%)',
        decorIcon: '🦉',
        accentGlow: 'rgba(245, 158, 11, 0.4)',
        category: 'VIP SPECIAL'
    },
    {
        id: 'f1',
        badge: 'OFFIZIELLER F1 PARTNER',
        badgeColor: 'var(--stake-green)',
        title: 'STAKE F1 TEAM KICK SAUBER BOOST',
        subtitle: 'Doppelte Auszahlungen auf alle Formel 1 Renn-Wochenenden + Chance auf VIP Paddock Club Tickets in Monza & Vegas!',
        ctaText: 'F1 Promo Aktivieren',
        bgGradient: 'linear-gradient(105deg, #092014 0%, #064e3b 50%, #022c22 100%)',
        decorIcon: '🏎️',
        accentGlow: 'rgba(0, 231, 1, 0.4)',
        category: 'FORMEL 1'
    },
    {
        id: 'ufc',
        badge: 'OFFIZIELLER GLOBALER PARTNER DER UFC',
        badgeColor: '#ef4444',
        title: 'UFC FIGHT NIGHT: SPLIT $250.000',
        subtitle: 'Gewinne deinen Anteil an $250.000 bei jedem Knockout in der Main Card. Exklusiv auf Royal Stake.',
        ctaText: 'UFC Aktion Sichern',
        bgGradient: 'linear-gradient(105deg, #2b0e0e 0%, #450a0a 50%, #1c0505 100%)',
        decorIcon: '🥊',
        accentGlow: 'rgba(239, 68, 68, 0.4)',
        category: 'KAMPFSPORT'
    },
    {
        id: 'race',
        badge: 'DAILY $100K LEADERBOARD',
        badgeColor: '#38bdf8',
        title: 'TÄGLICHES $100.000 CASINO RENNEN',
        subtitle: 'Für jede Wette sammelst du Punkte. Die besten 5.000 Spieler teilen sich jeden Tag garantiert 100.000 €!',
        ctaText: 'Im Rennen Mitmischen',
        bgGradient: 'linear-gradient(105deg, #0b1e33 0%, #075985 50%, #082f49 100%)',
        decorIcon: '⚡',
        accentGlow: 'rgba(56, 189, 248, 0.4)',
        category: 'TURNIER'
    },
    {
        id: 'bonus',
        badge: 'WILLKOMMENSANGEBOT 2026',
        badgeColor: 'var(--stake-green)',
        title: '200% CASINO BONUS BIS ZU 1.000 €',
        subtitle: 'Erhalte sofort 200% Extra-Guthaben + 100 Freispiele für Royal 3D Slot auf deine erste Einzahlung.',
        ctaText: 'Bonus Beanspruchen',
        bgGradient: 'linear-gradient(105deg, #172554 0%, #1e3a8a 50%, #0f172a 100%)',
        decorIcon: '💎',
        accentGlow: 'rgba(0, 231, 1, 0.45)',
        category: 'EINZAHLUNG'
    }
];

interface TopBannerCarouselProps {
    onActionClick: (promoId: string) => void;
}

export const TopBannerCarousel: React.FC<TopBannerCarouselProps> = ({ onActionClick }) => {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (isPaused) return;
        const interval = setInterval(() => {
            setCurrentIdx((prev) => (prev + 1) % PROMO_SLIDES.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [isPaused]);

    const activeSlide = PROMO_SLIDES[currentIdx];

    const nextSlide = () => setCurrentIdx((prev) => (prev + 1) % PROMO_SLIDES.length);
    const prevSlide = () => setCurrentIdx((prev) => (prev - 1 + PROMO_SLIDES.length) % PROMO_SLIDES.length);

    return (
        <div 
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            style={{
                position: 'relative',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                background: activeSlide.bgGradient,
                border: '1px solid var(--border-subtle)',
                boxShadow: `0 12px 36px rgba(0,0,0,0.4), 0 0 40px ${activeSlide.accentGlow}`,
                minHeight: '260px',
                display: 'flex',
                alignItems: 'center',
                padding: '36px 44px',
                transition: 'background 0.5s ease-in-out, box-shadow 0.5s ease',
                marginBottom: '28px'
            }}
        >
            {/* Background Decorative elements */}
            <div style={{
                position: 'absolute',
                right: '40px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '140px',
                opacity: 0.16,
                userSelect: 'none',
                filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.2))',
                pointerEvents: 'none'
            }}>
                {activeSlide.decorIcon}
            </div>

            {/* Left/Main Content */}
            <div style={{ maxWidth: '640px', zIndex: 10 }}>
                {/* Badge Tag */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{
                        background: 'rgba(0,0,0,0.45)',
                        border: `1px solid ${activeSlide.badgeColor}`,
                        color: activeSlide.badgeColor,
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        letterSpacing: '0.8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <span>●</span> {activeSlide.badge}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        OFFIZIELLES STAKE EVENT
                    </span>
                </div>

                {/* Title */}
                <h2 style={{
                    fontSize: '2rem',
                    fontWeight: 900,
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text-white)',
                    lineHeight: 1.15,
                    marginBottom: '10px',
                    letterSpacing: '-0.5px'
                }}>
                    {activeSlide.title}
                </h2>

                {/* Subtitle */}
                <p style={{
                    color: '#cbd5e1',
                    fontSize: '0.95rem',
                    lineHeight: 1.5,
                    marginBottom: '22px'
                }}>
                    {activeSlide.subtitle}
                </p>

                {/* Action CTA */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <button
                        onClick={() => onActionClick(activeSlide.id)}
                        className="stake-btn stake-btn-green"
                        style={{
                            padding: '12px 28px',
                            fontSize: '0.95rem',
                            fontWeight: 800
                        }}
                    >
                        {activeSlide.ctaText} →
                    </button>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Teilnahme ab 18 Jahren • Es gelten AGB
                    </span>
                </div>
            </div>

            {/* Carousel Navigation Arrows */}
            <div style={{
                position: 'absolute',
                right: '24px',
                bottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                zIndex: 20
            }}>
                <button
                    onClick={prevSlide}
                    aria-label="Vorherige Werbung"
                    style={{
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid var(--border-subtle)',
                        color: '#fff',
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                    }}
                >
                    ‹
                </button>
                <button
                    onClick={nextSlide}
                    aria-label="Nächste Werbung"
                    style={{
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid var(--border-subtle)',
                        color: '#fff',
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                    }}
                >
                    ›
                </button>
            </div>

            {/* Slide Indicator Dots */}
            <div style={{
                position: 'absolute',
                bottom: '12px',
                left: '44px',
                display: 'flex',
                gap: '6px',
                zIndex: 20
            }}>
                {PROMO_SLIDES.map((slide, idx) => (
                    <div
                        key={slide.id}
                        onClick={() => setCurrentIdx(idx)}
                        style={{
                            width: currentIdx === idx ? '24px' : '8px',
                            height: '6px',
                            borderRadius: '3px',
                            background: currentIdx === idx ? 'var(--stake-green)' : 'rgba(255,255,255,0.3)',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                        }}
                    />
                ))}
            </div>
        </div>
    );
};
