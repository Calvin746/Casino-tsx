import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';

// ---------------------------------------------------------------------------
// Konstanten & reine Hilfsfunktionen
// ---------------------------------------------------------------------------

// Europäische Roulette-Zahlen in exakter Kessel-Reihenfolge
const ROULETTE_NUMBERS = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
    5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
] as const;

const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

type PocketColor = 'green' | 'red' | 'black';

function getNumberColor(num: number): PocketColor {
    if (num === 0) return 'green';
    return RED_NUMBERS.has(num) ? 'red' : 'black';
}

function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
}

type BetType = 'red' | 'black' | 'even' | 'odd' | '1-18' | '19-36' | '1st12' | '2nd12' | '3rd12' | number;

const PAYOUTS: Record<string, number> = {
    straight: 36, // Vollzahl
    outsideEven: 2, // rot/schwarz, gerade/ungerade, 1-18/19-36
    dozen: 3, // 1./2./3. Dutzend
};

// ---------------------------------------------------------------------------
// Auszahlungslogik (rein, testbar, unabhängig von der Ziehung)
// ---------------------------------------------------------------------------

function calculatePayoutCents(bets: Map<BetType, number>, wonNum: number): number {
    const wonColor = getNumberColor(wonNum);
    let totalWinEur = 0;

    bets.forEach((betAmount, betType) => {
        if (typeof betType === 'number') {
            if (betType === wonNum) totalWinEur += betAmount * PAYOUTS.straight;
        } else if (betType === 'red' && wonColor === 'red') {
            totalWinEur += betAmount * PAYOUTS.outsideEven;
        } else if (betType === 'black' && wonColor === 'black') {
            totalWinEur += betAmount * PAYOUTS.outsideEven;
        } else if (betType === 'even' && wonNum !== 0 && wonNum % 2 === 0) {
            totalWinEur += betAmount * PAYOUTS.outsideEven;
        } else if (betType === 'odd' && wonNum !== 0 && wonNum % 2 !== 0) {
            totalWinEur += betAmount * PAYOUTS.outsideEven;
        } else if (betType === '1-18' && wonNum >= 1 && wonNum <= 18) {
            totalWinEur += betAmount * PAYOUTS.outsideEven;
        } else if (betType === '19-36' && wonNum >= 19 && wonNum <= 36) {
            totalWinEur += betAmount * PAYOUTS.outsideEven;
        } else if (betType === '1st12' && wonNum >= 1 && wonNum <= 12) {
            totalWinEur += betAmount * PAYOUTS.dozen;
        } else if (betType === '2nd12' && wonNum >= 13 && wonNum <= 24) {
            totalWinEur += betAmount * PAYOUTS.dozen;
        } else if (betType === '3rd12' && wonNum >= 25 && wonNum <= 36) {
            totalWinEur += betAmount * PAYOUTS.dozen;
        }
    });

    return Math.round(totalWinEur * 100);
}

// ---------------------------------------------------------------------------
// RTP-Steuerung — TRANSPARENT, nicht "fair & unabhängig"
// ---------------------------------------------------------------------------
//
// WICHTIG: Diese Ziehung ist KEINE unabhängige Zufallsziehung wie bei einem
// physischen Kessel. Die Wahrscheinlichkeit jeder Zahl wird abhängig von den
// aktuell platzierten Wetten so gewichtet, dass sich über sehr viele Spins
// die eingestellte Ziel-Auszahlungsquote (RTP) ergibt. Das MUSS im UI immer
// offen als "konfigurierte Auszahlungsquote" ausgewiesen werden — niemals
// als "fair", "unabhängig" oder "kryptografisch zufällig" bezeichnet werden,
// da das Spieler über die tatsächliche Mechanik täuschen würde.
//
// Bei leerem Wetteinsatz (keine Bets) ist die Gewichtung bedeutungslos, dann
// wird gleichverteilt gezogen.

interface RtpSettings {
    targetRtpPercent: number; // 80–99, Betreiber-Parameter, im UI sichtbar
}

let rtpSettings: RtpSettings = { targetRtpPercent: 97.3 };

function getRtpSettings(): RtpSettings {
    return { ...rtpSettings };
}

function setRtpSettings(next: Partial<RtpSettings>) {
    rtpSettings = { ...rtpSettings, ...next };
}

function drawWeightedNumber(bets: Map<BetType, number>, targetRtpPercent: number): number {
    const numbers = ROULETTE_NUMBERS as readonly number[];
    const totalBetEur = Array.from(bets.values()).reduce((s, v) => s + v, 0);

    if (totalBetEur <= 0 || bets.size === 0) {
        return numbers[Math.floor(Math.random() * numbers.length)];
    }

    const payoutForEur = (n: number) => calculatePayoutCents(bets, n) / 100;
    const targetFraction = Math.min(0.99, Math.max(0.5, targetRtpPercent / 100));

    // Bisektion: finde Steilheit k, sodass E[Auszahlung] / Gesamteinsatz ≈ targetFraction.
    // Höheres k => Zahlen mit hoher Auszahlung werden unwahrscheinlicher.
    let lo = -60;
    let hi = 60;
    let k = 0;
    for (let i = 0; i < 40; i++) {
        k = (lo + hi) / 2;
        const weights = numbers.map((n) => Math.exp(-k * payoutForEur(n)));
        const weightSum = weights.reduce((s, w) => s + w, 0);
        const expectedPayout = numbers.reduce((s, n, idx) => s + (weights[idx] / weightSum) * payoutForEur(n), 0);
        if (expectedPayout / totalBetEur > targetFraction) {
            lo = k;
        } else {
            hi = k;
        }
    }

    const weights = numbers.map((n) => Math.exp(-k * payoutForEur(n)));
    const weightSum = weights.reduce((s, w) => s + w, 0);
    let r = Math.random() * weightSum;
    for (let idx = 0; idx < numbers.length; idx++) {
        r -= weights[idx];
        if (r <= 0) return numbers[idx];
    }
    return numbers[numbers.length - 1];
}

// ---------------------------------------------------------------------------
// Sound
// ---------------------------------------------------------------------------

function playAudio(type: 'chip' | 'spin' | 'win') {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (type === 'chip') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(750, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.05);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.05);
        } else if (type === 'spin') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(180, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 1.2);
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 1.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 1.2);
        } else if (type === 'win') {
            [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
                gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.4);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + i * 0.1);
                osc.stop(ctx.currentTime + i * 0.1 + 0.4);
            });
        }
    } catch {
        // Audio ist optional — Fehler hier dürfen das Spiel nicht blockieren
    }
}

function triggerWinAnimation() {
    const end = Date.now() + 3000;
    const frame = () => {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#fbbf24', '#f59e0b', '#10b981', '#ffffff'] });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#fbbf24', '#f59e0b', '#10b981', '#ffffff'] });
        if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
}

function triggerBigWinAnimation() {
    const end = Date.now() + 5000;
    const frame = () => {
        confetti({ particleCount: 15, angle: 60, spread: 80, origin: { x: 0 }, colors: ['#f59e0b', '#fbbf24', '#f87171', '#a855f7', '#38bdf8'] });
        confetti({ particleCount: 15, angle: 120, spread: 80, origin: { x: 1 }, colors: ['#f59e0b', '#fbbf24', '#f87171', '#a855f7', '#38bdf8'] });
        if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
}

// ---------------------------------------------------------------------------
// 2D-Kessel (SVG, kein Three.js) — imperative Animation über refs für Performance
// ---------------------------------------------------------------------------

const VB = 380; // viewBox Größe
const CENTER = 190;
const WHEEL_OUTER_R = 172;
const WHEEL_INNER_R = 112;
const NUMBER_R = 142;
const BALL_START_R = 160;
const BALL_SETTLE_R = 98;

type Phase = 'idle' | 'rolling' | 'dropping' | 'settling' | 'settled';

interface Wheel2DProps {
    isSpinning: boolean;
    targetNumber: number | null;
    highlightNumber: number | null;
    onSettled?: () => void;
}

const Wheel2D: React.FC<Wheel2DProps> = ({ isSpinning, targetNumber, highlightNumber, onSettled }) => {
    const wheelGroupRef = useRef<SVGGElement>(null);
    const ballRef = useRef<SVGCircleElement>(null);

    const wheelAngle = useRef(0);
    const wheelSpeed = useRef(0.15);
    const ballAngle = useRef(0);
    const ballSpeed = useRef(0);
    const ballR = useRef(BALL_START_R);
    const phase = useRef<Phase>('idle');
    const dropTimer = useRef(0);
    const settleTimer = useRef(0);
    const targetLocalAngle = useRef(0);
    const hasNotified = useRef(false);
    const rafRef = useRef<number>();
    const lastTime = useRef(0);

    const pockets = useMemo(() => {
        const count = ROULETTE_NUMBERS.length;
        const step = (Math.PI * 2) / count;
        return ROULETTE_NUMBERS.map((num, i) => {
            const angle = i * step;
            return { num, color: getNumberColor(num), angle, midAngle: angle + step / 2, step };
        });
    }, []);

    const numberToAngle = useMemo(() => {
        const map = new Map<number, number>();
        pockets.forEach((p) => map.set(p.num, p.midAngle));
        return map;
    }, [pockets]);

    useEffect(() => {
        if (isSpinning) {
            phase.current = 'rolling';
            ballSpeed.current = 9 + Math.random() * 1.2;
            ballR.current = BALL_START_R;
            wheelSpeed.current = 1.6 + Math.random() * 0.3;
            dropTimer.current = 0;
            settleTimer.current = 0;
            hasNotified.current = false;
            targetLocalAngle.current = numberToAngle.get(targetNumber ?? 0) ?? 0;
        }
    }, [isSpinning, targetNumber, numberToAngle]);

    useEffect(() => {
        lastTime.current = performance.now();

        const tick = (now: number) => {
            const dt = Math.min((now - lastTime.current) / 1000, 0.1);
            lastTime.current = now;

            const targetWheelSpeed = phase.current === 'idle' ? 0.15 : phase.current === 'rolling' ? 0.8 : 0.35;
            wheelSpeed.current += (targetWheelSpeed - wheelSpeed.current) * Math.min(dt * 0.6, 1);
            wheelAngle.current += wheelSpeed.current * dt;

            if (phase.current === 'rolling') {
                ballSpeed.current *= 1 - dt * 0.5;
                ballAngle.current -= ballSpeed.current * dt;
                if (ballSpeed.current < 2.2) {
                    phase.current = 'dropping';
                    dropTimer.current = 0;
                }
            } else if (phase.current === 'dropping') {
                dropTimer.current += dt;
                const t = Math.min(dropTimer.current / 1.1, 1);
                const eased = easeOutCubic(t);
                ballR.current = BALL_START_R + (BALL_SETTLE_R - BALL_START_R) * eased;
                ballSpeed.current += (wheelSpeed.current * 1.3 - ballSpeed.current) * Math.min(dt * 2, 1);
                ballAngle.current -= ballSpeed.current * dt;
                if (t >= 1) {
                    phase.current = 'settling';
                    settleTimer.current = 0;
                }
            } else if (phase.current === 'settling') {
                settleTimer.current += dt;
                const t = Math.min(settleTimer.current / 0.7, 1);
                const targetWorldAngle = targetLocalAngle.current + wheelAngle.current;
                let diff = (targetWorldAngle - ballAngle.current) % (Math.PI * 2);
                if (diff < -Math.PI) diff += Math.PI * 2;
                if (diff > Math.PI) diff -= Math.PI * 2;
                ballAngle.current += wheelSpeed.current * dt + diff * Math.min(dt * 8, 1);
                ballR.current += (BALL_SETTLE_R - 10 - ballR.current) * Math.min(dt * 6, 1);
                if (t >= 1) {
                    phase.current = 'settled';
                    ballAngle.current = targetWorldAngle;
                    if (!hasNotified.current && onSettled) {
                        hasNotified.current = true;
                        onSettled();
                    }
                }
            } else {
                ballAngle.current += wheelSpeed.current * dt;
            }

            if (wheelGroupRef.current) {
                wheelGroupRef.current.setAttribute('transform', `rotate(${(wheelAngle.current * 180) / Math.PI} ${CENTER} ${CENTER})`);
            }
            if (ballRef.current) {
                const bx = CENTER + Math.cos(ballAngle.current) * ballR.current;
                const by = CENTER + Math.sin(ballAngle.current) * ballR.current;
                ballRef.current.setAttribute('cx', bx.toFixed(2));
                ballRef.current.setAttribute('cy', by.toFixed(2));
            }

            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [onSettled]);

    return (
        <svg viewBox={`0 0 ${VB} ${VB}`} width="100%" height="100%" style={{ display: 'block' }}>
            <circle cx={CENTER} cy={CENTER} r={WHEEL_OUTER_R + 10} fill="#2a1005" stroke="#4a2410" strokeWidth={3} />
            <circle cx={CENTER} cy={CENTER} r={WHEEL_OUTER_R + 2} fill="none" stroke="#fbbf24" strokeWidth={1} opacity={0.5} />

            <g ref={wheelGroupRef}>
                {pockets.map((p) => {
                    const fill = p.color === 'green' ? '#00c853' : p.color === 'red' ? '#d50000' : '#111111';
                    const isWinner = p.num === highlightNumber;
                    const sx = CENTER + Math.cos(p.angle) * WHEEL_OUTER_R;
                    const sy = CENTER + Math.sin(p.angle) * WHEEL_OUTER_R;
                    const ex = CENTER + Math.cos(p.angle + p.step) * WHEEL_OUTER_R;
                    const ey = CENTER + Math.sin(p.angle + p.step) * WHEEL_OUTER_R;
                    const isx = CENTER + Math.cos(p.angle) * WHEEL_INNER_R;
                    const isy = CENTER + Math.sin(p.angle) * WHEEL_INNER_R;
                    const iex = CENTER + Math.cos(p.angle + p.step) * WHEEL_INNER_R;
                    const iey = CENTER + Math.sin(p.angle + p.step) * WHEEL_INNER_R;
                    const path = `M ${isx} ${isy} L ${sx} ${sy} A ${WHEEL_OUTER_R} ${WHEEL_OUTER_R} 0 0 1 ${ex} ${ey} L ${iex} ${iey} A ${WHEEL_INNER_R} ${WHEEL_INNER_R} 0 0 0 ${isx} ${isy} Z`;
                    const numX = CENTER + Math.cos(p.midAngle) * NUMBER_R;
                    const numY = CENTER + Math.sin(p.midAngle) * NUMBER_R;
                    const rotDeg = (p.midAngle * 180) / Math.PI + 90;
                    return (
                        <g key={p.num}>
                            <path d={path} fill={fill} stroke="#000" strokeWidth={0.6} />
                            {isWinner && (
                                <path d={path} fill="none" stroke="#fbbf24" strokeWidth={2.5}>
                                    <animate attributeName="opacity" values="1;0.3;1" dur="0.9s" repeatCount="indefinite" />
                                </path>
                            )}
                            <text
                                x={numX}
                                y={numY}
                                fill="#fff"
                                fontSize={11}
                                fontWeight={800}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                transform={`rotate(${rotDeg} ${numX} ${numY})`}
                            >
                                {p.num}
                            </text>
                        </g>
                    );
                })}
            </g>

            <circle cx={CENTER} cy={CENTER} r={WHEEL_INNER_R - 6} fill="#0f172a" stroke="#334155" strokeWidth={2} />
            <circle cx={CENTER} cy={CENTER} r={16} fill="#f59e0b" />
            <circle cx={CENTER} cy={CENTER} r={5} fill="#fde68a" />

            <circle ref={ballRef} cx={CENTER + BALL_START_R} cy={CENTER} r={6} fill="#ffffff" stroke="#cbd5e1" strokeWidth={0.6} />
        </svg>
    );
};

// ---------------------------------------------------------------------------
// Haupt-Komponente
// ---------------------------------------------------------------------------

interface Roulette2DProps {
    initialBalance: number;
    onBackToLobby?: () => void;
    onUpdateBalance?: (newBalance: number) => void;
}

export const Roulette2D: React.FC<Roulette2DProps> = ({ initialBalance, onBackToLobby, onUpdateBalance }) => {
    const [balance, setBalance] = useState(initialBalance || 10000);
    const [selectedChip, setSelectedChip] = useState(1.0);
    const [bets, setBets] = useState<Map<BetType, number>>(new Map());
    const [spinning, setSpinning] = useState(false);
    const [targetNumber, setTargetNumber] = useState<number | null>(null);
    const [winningNumber, setWinningNumber] = useState<number | null>(null);
    const [lastWin, setLastWin] = useState(0);
    const [history, setHistory] = useState<number[]>([14, 2, 0, 31, 9, 22, 17]);
    const [message, setMessage] = useState('Platziere deine Chips auf dem Roulettetisch!');
    const [showRtpInfo, setShowRtpInfo] = useState(false);
    const [rtpPercent, setRtpPercentState] = useState<number>(() => getRtpSettings().targetRtpPercent ?? 97.3);

    const totalBetEur = Array.from(bets.values()).reduce((sum, v) => sum + v, 0);

    const [autoSpinning, setAutoSpinning] = useState(false);
    const autoSpinningRef = useRef(false);
    useEffect(() => {
        autoSpinningRef.current = autoSpinning;
    }, [autoSpinning]);

    // Betrag, der pro Spin abgebucht wurde — für die Auswertung nach dem Settle nötig
    const pendingBetCents = useRef(0);
    const pendingBetsSnapshot = useRef<Map<BetType, number>>(new Map());

    const isBigWinNow = lastWin >= pendingBetCents.current * 5 && lastWin > 0 && !spinning;

    const placeBet = (type: BetType) => {
        if (spinning) return;
        const newTotal = totalBetEur + selectedChip;
        if (newTotal * 100 > balance) return;
        playAudio('chip');
        const newBets = new Map(bets);
        newBets.set(type, (bets.get(type) || 0) + selectedChip);
        setBets(newBets);
    };

    const clearBets = () => {
        if (!spinning) setBets(new Map());
    };

    const doubleBets = () => {
        if (spinning) return;
        const newBets = new Map<BetType, number>();
        let newTotal = 0;
        bets.forEach((val, key) => {
            newBets.set(key, val * 2);
            newTotal += val * 2;
        });
        if (newTotal * 100 > balance) return;
        playAudio('chip');
        setBets(newBets);
    };

    const spinWheel = useCallback(() => {
        setBets((currentBets) => {
            const currentTotal = Array.from(currentBets.values()).reduce((s, v) => s + v, 0);
            if (spinning || currentTotal <= 0) return currentBets;

            const betCents = Math.round(currentTotal * 100);
            setBalance((currentBalance) => {
                if (currentBalance < betCents) return currentBalance;

                const balanceAfterBet = currentBalance - betCents;
                if (onUpdateBalance) onUpdateBalance(balanceAfterBet);

                pendingBetCents.current = betCents;
                pendingBetsSnapshot.current = new Map(currentBets);

                // Konfigurierte Ziehung — siehe Hinweis bei drawWeightedNumber() oben.
                const wonNum = drawWeightedNumber(currentBets, rtpPercent);

                setTargetNumber(wonNum);
                setWinningNumber(null);
                setSpinning(true);
                setLastWin(0);
                setMessage('Kugel rollt durch den Kessel...');
                playAudio('spin');

                return balanceAfterBet;
            });

            return currentBets;
        });
    }, [spinning, onUpdateBalance, rtpPercent]);

    const handleWheelSettled = useCallback(() => {
        setTargetNumber((currentTarget) => {
            if (currentTarget === null) return currentTarget;

            const wonNum = currentTarget;
            const wonColor = getNumberColor(wonNum);
            const betCents = pendingBetCents.current;
            const usedBets = pendingBetsSnapshot.current;

            setWinningNumber(wonNum);
            setSpinning(false);
            setHistory((prev) => [wonNum, ...prev.slice(0, 8)]);

            const winCents = calculatePayoutCents(usedBets, wonNum);

            setBalance((currentBalance) => {
                const finalBal = currentBalance + winCents;
                if (onUpdateBalance) onUpdateBalance(finalBal);

                if (winCents > 0) {
                    playAudio('win');
                    if (winCents >= betCents * 5) {
                        triggerBigWinAnimation();
                    } else {
                        triggerWinAnimation();
                    }
                    setMessage(`🎉 ${wonNum} ${wonColor.toUpperCase()}! Gewinn: +${(winCents / 100).toFixed(2)} €!`);
                } else {
                    setMessage(`${wonNum} ${wonColor.toUpperCase()}. Kein Gewinn.`);
                }

                if (autoSpinningRef.current) {
                    setTimeout(() => {
                        if (autoSpinningRef.current && finalBal >= betCents && betCents > 0) {
                            spinWheel();
                        } else {
                            setAutoSpinning(false);
                        }
                    }, 2500);
                }

                return finalBal;
            });

            setLastWin(winCents);
            return currentTarget;
        });
    }, [onUpdateBalance, spinWheel]);

    const toggleAutoSpin = () => {
        if (!autoSpinning) {
            setAutoSpinning(true);
            if (!spinning && totalBetEur > 0) spinWheel();
        } else {
            setAutoSpinning(false);
        }
    };

    const applyRtpChange = (value: number) => {
        const clamped = Math.min(99, Math.max(80, value));
        setRtpPercentState(clamped);
        setRtpSettings({ targetRtpPercent: clamped });
    };

    return (
        <div
            style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                padding: '24px',
                maxWidth: '1140px',
                margin: '0 auto',
                boxShadow: 'var(--shadow-elevated)',
                position: 'relative',
                animation: 'fadeIn 0.4s ease-out',
            }}
        >
            {isBigWinNow && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.75)',
                        zIndex: 100,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                        borderRadius: 'var(--radius-lg)',
                        animation: 'fadeIn 0.5s ease-out',
                    }}
                >
                    <h1
                        style={{
                            fontSize: '5rem',
                            color: '#f59e0b',
                            margin: 0,
                            fontFamily: 'var(--font-display)',
                            WebkitTextStroke: '2px #fff',
                            animation: 'bigWinPulse 0.8s infinite alternate',
                        }}
                    >
                        MEGA WIN!
                    </h1>
                    <div style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', textShadow: '0 0 20px #10b981', marginTop: '16px' }}>
                        +{(lastWin / 100).toFixed(2)} €
                    </div>
                </div>
            )}

            {/* Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {onBackToLobby && (
                        <button onClick={onBackToLobby} className="stake-btn stake-btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                            ← Lobby
                        </button>
                    )}
                    <span style={{ fontSize: '1.4rem' }}>🎡</span>
                    <h2 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-white)', fontWeight: 900, fontFamily: 'var(--font-display)' }}>
                        European Live Roulette
                    </h2>
                    <span className="stake-badge stake-badge-vip">RTP {rtpPercent.toFixed(1)}%</span>
                    <button
                        onClick={() => setShowRtpInfo((v) => !v)}
                        title="Auszahlungsinformationen"
                        style={{
                            background: 'transparent',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '999px',
                            color: 'var(--text-secondary)',
                            width: '22px',
                            height: '22px',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            lineHeight: 1,
                        }}
                    >
                        i
                    </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Historie:</span>
                        {history.map((h, i) => {
                            const color = getNumberColor(h);
                            const bg = color === 'green' ? '#00c853' : color === 'red' ? '#d50000' : '#111';
                            return (
                                <span
                                    key={i}
                                    style={{
                                        background: bg,
                                        color: '#fff',
                                        width: '26px',
                                        height: '26px',
                                        borderRadius: '50%',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.72rem',
                                        fontWeight: 800,
                                        border: '1px solid rgba(255,255,255,0.15)',
                                    }}
                                >
                                    {h}
                                </span>
                            );
                        })}
                    </div>
                    <div style={{ color: 'var(--stake-green)', fontWeight: 900, fontSize: '1.15rem' }}>{(balance / 100).toFixed(2)} €</div>
                </div>
            </div>

            {showRtpInfo && (
                <div
                    style={{
                        background: 'rgba(0,0,0,0.35)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '14px 16px',
                        marginBottom: '18px',
                        fontSize: '0.82rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                    }}
                >
                    <div style={{ color: 'var(--text-white)', fontWeight: 800, marginBottom: '6px' }}>Konfigurierte Auszahlungsquote (RTP)</div>
                    Dieses Spiel zieht die Gewinnzahl nicht unabhängig von den platzierten Einsätzen. Stattdessen wird
                    die Wahrscheinlichkeit jeder Zahl so gewichtet, dass sich über sehr viele Spins die eingestellte
                    Ziel-Auszahlungsquote von aktuell {rtpPercent.toFixed(1)}% ergibt — d.h. im Schnitt werden{' '}
                    {rtpPercent.toFixed(1)}% der Einsätze als Gewinne wieder ausgeschüttet, {(100 - rtpPercent).toFixed(1)}%
                    verbleiben als Hausvorteil. Einzelne Spins können davon stark abweichen. Dies ist eine
                    betreiberseitig eingestellte Größe, keine physikalisch unabhängige Kessel-Ziehung.
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                        <label htmlFor="rtp-slider" style={{ color: 'var(--text-white)', fontWeight: 700 }}>
                            Ziel-RTP: {rtpPercent.toFixed(1)}%
                        </label>
                        <input
                            id="rtp-slider"
                            type="range"
                            min={80}
                            max={99}
                            step={0.1}
                            value={rtpPercent}
                            onChange={(e) => applyRtpChange(parseFloat(e.target.value))}
                            style={{ flex: 1, maxWidth: '220px' }}
                        />
                    </div>
                </div>
            )}

            {/* 2D Kessel */}
            <div
                style={{
                    height: '360px',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    background: 'radial-gradient(circle at center, #1e293b 0%, #080c14 100%)',
                    position: 'relative',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <div style={{ width: '340px', height: '340px' }}>
                    <Wheel2D isSpinning={spinning} targetNumber={targetNumber} highlightNumber={winningNumber} onSettled={handleWheelSettled} />
                </div>

                {winningNumber !== null && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '16px',
                            left: '16px',
                            background:
                                getNumberColor(winningNumber) === 'green' ? '#00c853' : getNumberColor(winningNumber) === 'red' ? '#d50000' : '#111',
                            color: '#fff',
                            padding: '10px 24px',
                            borderRadius: 'var(--radius-lg)',
                            fontWeight: 900,
                            fontSize: '1.8rem',
                            border: '2px solid rgba(255,255,255,0.4)',
                            boxShadow: '0 6px 25px rgba(0,0,0,0.7)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            animation: 'scaleIn 0.3s ease-out',
                        }}
                    >
                        <span>{winningNumber}</span>
                        <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#fbbf24' }}>
                            {getNumberColor(winningNumber)}
                        </span>
                    </div>
                )}

                <div
                    style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(10, 25, 41, 0.92)',
                        backdropFilter: 'blur(8px)',
                        color: lastWin > 0 ? 'var(--stake-green)' : 'var(--text-white)',
                        padding: '8px 24px',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        border: '1px solid var(--border-subtle)',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {message}
                </div>
            </div>

            {/* Wettfeld */}
            <div
                style={{
                    background: 'linear-gradient(135deg, #047857 0%, #059669 50%, #047857 100%)',
                    padding: '15px',
                    borderRadius: 'var(--radius-md)',
                    border: '6px solid #022c22',
                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
                    marginBottom: '20px',
                    position: 'relative',
                }}
            >
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '60px repeat(12, 1fr) 60px',
                        gridTemplateRows: 'repeat(5, 50px)',
                        gap: '2px',
                        background: '#ffffff',
                        border: '2px solid #ffffff',
                    }}
                >
                    <button
                        onClick={() => placeBet(0)}
                        disabled={spinning || autoSpinning}
                        style={{
                            gridColumn: '1 / 2',
                            gridRow: '1 / 4',
                            background: '#059669',
                            color: '#fff',
                            border: 'none',
                            fontWeight: 900,
                            fontSize: '1.6rem',
                            cursor: spinning || autoSpinning ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        }}
                    >
                        <span>0</span>
                        {winningNumber === 0 && <span style={{ position: 'absolute', top: '2px', right: '2px', fontSize: '1rem' }}>📌</span>}
                        {bets.has(0) && (
                            <span style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 900, background: 'rgba(0,0,0,0.5)', padding: '2px 4px', borderRadius: '4px' }}>
                                {bets.get(0)}€
                            </span>
                        )}
                    </button>

                    {[
                        [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
                        [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
                        [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
                    ].map((row, rowIndex) =>
                        row.map((num, colIndex) => {
                            const isRed = RED_NUMBERS.has(num);
                            const isWinner = winningNumber === num;
                            return (
                                <button
                                    key={num}
                                    onClick={() => placeBet(num)}
                                    disabled={spinning || autoSpinning}
                                    style={{
                                        gridRow: rowIndex + 1,
                                        gridColumn: colIndex + 2,
                                        background: isRed ? '#d50000' : '#111111',
                                        color: '#ffffff',
                                        border: 'none',
                                        fontWeight: 900,
                                        fontSize: '1.2rem',
                                        cursor: spinning || autoSpinning ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'relative',
                                        boxShadow: isWinner ? 'inset 0 0 15px #fbbf24' : 'none',
                                        animation: isWinner ? 'pulseGlow 1s infinite' : 'none',
                                        zIndex: isWinner ? 10 : 1,
                                    }}
                                >
                                    <span style={{ transform: 'rotate(-90deg)' }}>{num}</span>
                                    {isWinner && <span style={{ position: 'absolute', top: '2px', right: '2px', fontSize: '0.85rem' }}>📌</span>}
                                    {bets.has(num) && (
                                        <span
                                            style={{
                                                position: 'absolute',
                                                bottom: '2px',
                                                fontSize: '0.65rem',
                                                color: '#fbbf24',
                                                fontWeight: 900,
                                                background: 'rgba(0,0,0,0.6)',
                                                padding: '1px 3px',
                                                borderRadius: '4px',
                                                transform: 'rotate(-90deg)',
                                            }}
                                        >
                                            {bets.get(num)}€
                                        </span>
                                    )}
                                </button>
                            );
                        }),
                    )}

                    {[
                        { key: 'row3', row: 1 },
                        { key: 'row2', row: 2 },
                        { key: 'row1', row: 3 },
                    ].map((btn) => (
                        <button
                            key={btn.key}
                            disabled
                            style={{
                                gridRow: btn.row,
                                gridColumn: '14 / 15',
                                background: '#047857',
                                color: '#fff',
                                border: 'none',
                                fontWeight: 800,
                                fontSize: '1rem',
                                cursor: 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <span style={{ transform: 'rotate(-90deg)' }}>2:1</span>
                        </button>
                    ))}

                    {[
                        { key: '1st12', label: '1st 12', colStart: 2, colEnd: 6 },
                        { key: '2nd12', label: '2nd 12', colStart: 6, colEnd: 10 },
                        { key: '3rd12', label: '3rd 12', colStart: 10, colEnd: 14 },
                    ].map((d) => (
                        <button
                            key={d.key}
                            onClick={() => placeBet(d.key as BetType)}
                            disabled={spinning || autoSpinning}
                            style={{
                                gridRow: '4 / 5',
                                gridColumn: `${d.colStart} / ${d.colEnd}`,
                                background: '#047857',
                                color: '#fff',
                                border: 'none',
                                fontWeight: 800,
                                fontSize: '1.2rem',
                                cursor: spinning || autoSpinning ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                            }}
                        >
                            {d.label}
                            {bets.has(d.key as BetType) && (
                                <span style={{ position: 'absolute', right: '10px', fontSize: '0.8rem', color: '#fbbf24', background: 'rgba(0,0,0,0.6)', padding: '2px 4px', borderRadius: '4px' }}>
                                    {bets.get(d.key as BetType)}€
                                </span>
                            )}
                        </button>
                    ))}

                    {[
                        { key: '1-18', label: '1-18', colStart: 2, colEnd: 4 },
                        { key: 'even', label: 'EVEN', colStart: 4, colEnd: 6 },
                        { key: 'red', label: 'RED', colStart: 6, colEnd: 8, bg: '#d50000' },
                        { key: 'black', label: 'BLACK', colStart: 8, colEnd: 10, bg: '#111111' },
                        { key: 'odd', label: 'ODD', colStart: 10, colEnd: 12 },
                        { key: '19-36', label: '19-36', colStart: 12, colEnd: 14 },
                    ].map((b) => (
                        <button
                            key={b.key}
                            onClick={() => placeBet(b.key as BetType)}
                            disabled={spinning || autoSpinning}
                            style={{
                                gridRow: '5 / 6',
                                gridColumn: `${b.colStart} / ${b.colEnd}`,
                                background: b.bg || '#047857',
                                color: '#fff',
                                border: 'none',
                                fontWeight: 800,
                                fontSize: '1.1rem',
                                cursor: spinning || autoSpinning ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                            }}
                        >
                            {b.label}
                            {bets.has(b.key as BetType) && (
                                <span style={{ position: 'absolute', right: '10px', fontSize: '0.8rem', color: '#fbbf24', background: 'rgba(0,0,0,0.6)', padding: '2px 4px', borderRadius: '4px' }}>
                                    {bets.get(b.key as BetType)}€
                                </span>
                            )}
                        </button>
                    ))}

                    <div style={{ gridRow: '4 / 6', gridColumn: '14 / 15', background: '#047857' }} />
                </div>
            </div>

            {/* Chips & Steuerung */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Chip:</span>
                    {[0.5, 1, 5, 25, 100].map((val) => (
                        <button
                            key={val}
                            onClick={() => {
                                setSelectedChip(val);
                                playAudio('chip');
                            }}
                            disabled={spinning || autoSpinning}
                            style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '50%',
                                border: selectedChip === val ? '3px solid #fff' : '2px dashed rgba(255,255,255,0.4)',
                                background: val === 0.5 ? '#64748b' : val === 1 ? '#0284c7' : val === 5 ? '#ef4444' : val === 25 ? '#16a34a' : '#1e1b4b',
                                color: '#fff',
                                fontWeight: 900,
                                fontSize: '0.8rem',
                                cursor: spinning || autoSpinning ? 'not-allowed' : 'pointer',
                                boxShadow: selectedChip === val ? '0 0 14px rgba(255,255,255,0.7)' : 'none',
                                transform: selectedChip === val ? 'scale(1.1)' : 'scale(1)',
                                transition: 'all 0.15s',
                            }}
                        >
                            {val}€
                        </button>
                    ))}
                    <button onClick={clearBets} disabled={spinning || autoSpinning || totalBetEur === 0} className="stake-btn stake-btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
                        Löschen
                    </button>
                    <button onClick={doubleBets} disabled={spinning || autoSpinning || totalBetEur === 0} className="stake-btn stake-btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
                        2×
                    </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Gesamteinsatz:</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-white)' }}>{totalBetEur.toFixed(2)} €</div>
                    </div>

                    <button
                        onClick={toggleAutoSpin}
                        className="stake-btn stake-btn-secondary"
                        style={{
                            padding: '14px 24px',
                            fontSize: '1rem',
                            fontWeight: 800,
                            border: autoSpinning ? '2px solid #ef4444' : '2px solid transparent',
                            color: autoSpinning ? '#ef4444' : '#fff',
                        }}
                    >
                        {autoSpinning ? '⏹ AUTO STOP' : '🔄 AUTO SPIN'}
                    </button>

                    <button
                        onClick={spinWheel}
                        disabled={spinning || autoSpinning || totalBetEur <= 0}
                        className="stake-btn stake-btn-green glow-green"
                        style={{ padding: '14px 44px', fontSize: '1.15rem', fontWeight: 900, letterSpacing: '0.5px' }}
                    >
                        {spinning ? 'Kugel rollt...' : 'DREHEN'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const Roulette3D = Roulette2D;
export type Roulette3DProps = Roulette2DProps;
export default Roulette2D;