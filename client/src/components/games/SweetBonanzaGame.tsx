import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';

interface SweetBonanzaProps {
    balanceCents: number;
    onUpdateBalance: (newBalance: number | ((prev: number) => number)) => void;
    onBack: () => void;
}

interface CandySymbol {
    id: string;
    label: string;
    icon: string;
    payout8: number;   // 8-9 matching
    payout10: number;  // 10-11 matching
    payout12: number;  // 12+ matching
    weight: number;    // Weighted random selection
}

const CANDY_SYMBOLS: CandySymbol[] = [
    { id: 'heart', label: 'Rotes Herz', icon: '❤️', payout8: 10, payout10: 25, payout12: 50, weight: 6 },
    { id: 'purple_square', label: 'Lila Bonbon', icon: '🟪', payout8: 2.5, payout10: 10, payout12: 25, weight: 8 },
    { id: 'green_hex', label: 'Grünes Bonbon', icon: '🟩', payout8: 2, payout10: 5, payout12: 15, weight: 10 },
    { id: 'blue_oval', label: 'Blaues Bonbon', icon: '🔷', payout8: 1.5, payout10: 2, payout12: 12, weight: 12 },
    { id: 'apple', label: 'Roter Apfel', icon: '🍎', payout8: 1, payout10: 1.5, payout12: 10, weight: 14 },
    { id: 'plum', label: 'Pflaume', icon: '🍑', payout8: 0.8, payout10: 1.2, payout12: 8, weight: 16 },
    { id: 'watermelon', label: 'Melone', icon: '🍉', payout8: 0.5, payout10: 1, payout12: 5, weight: 18 },
    { id: 'grapes', label: 'Trauben', icon: '🍇', payout8: 0.4, payout10: 0.9, payout12: 4, weight: 20 },
    { id: 'banana', label: 'Banane', icon: '🍌', payout8: 0.25, payout10: 0.75, payout12: 2, weight: 22 }
];

const SCATTER = { id: 'lollipop', label: 'Lollipop Scatter', icon: '🍭' };

// Weighted symbol picker
function getRandomSymbol(isFreeSpins: boolean): string {
    // Chance for Scatter
    if (Math.random() < 0.038) return 'lollipop';

    const totalWeight = CANDY_SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
    let rand = Math.random() * totalWeight;

    for (const sym of CANDY_SYMBOLS) {
        if (rand < sym.weight) return sym.id;
        rand -= sym.weight;
    }
    return 'banana';
}

function generateGrid(isFreeSpins: boolean): string[][] {
    const newGrid: string[][] = [];
    for (let r = 0; r < 5; r++) {
        const row: string[] = [];
        for (let c = 0; c < 6; c++) {
            row.push(getRandomSymbol(isFreeSpins));
        }
        newGrid.push(row);
    }
    return newGrid;
}

export const SweetBonanzaGame: React.FC<SweetBonanzaProps> = ({ balanceCents, onUpdateBalance, onBack }) => {
    const [betEur, setBetEur] = useState<number>(1.00);
    const [grid, setGrid] = useState<string[][]>(() => generateGrid(false));
    const [spinning, setSpinning] = useState<boolean>(false);
    const [isTumbling, setIsTumbling] = useState<boolean>(false);
    const [sugarBombs, setSugarBombs] = useState<{ row: number; col: number; mult: number }[]>([]);
    const [totalMultiplier, setTotalMultiplier] = useState<number>(1);
    const [freeSpinsRemaining, setFreeSpinsRemaining] = useState<number>(0);
    const [winMessage, setWinMessage] = useState<string>('Tauche ein in das süße Bonbon-Wunderland!');
    const [lastWinEur, setLastWinEur] = useState<number>(0);
    const [roundTumbleWinEur, setRoundTumbleWinEur] = useState<number>(0);
    const [winningSymbols, setWinningSymbols] = useState<Set<string>>(new Set());
    const [poppingCells, setPoppingCells] = useState<Set<string>>(new Set());

    // Ref to track free spins inside async tumble loop
    const freeSpinsRef = useRef<number>(freeSpinsRemaining);
    useEffect(() => {
        freeSpinsRef.current = freeSpinsRemaining;
    }, [freeSpinsRemaining]);

    // Audio synthesizer
    const playAudio = (type: 'spin' | 'bomb' | 'win' | 'pop' | 'drop') => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            if (type === 'spin') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(500, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.12, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                osc.connect(gain); gain.connect(ctx.destination);
                osc.start(); osc.stop(ctx.currentTime + 0.2);
            } else if (type === 'pop') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(400, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.08);
                osc.connect(gain); gain.connect(ctx.destination);
                osc.start(); osc.stop(ctx.currentTime + 0.08);
            } else if (type === 'bomb') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(320, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.45);
                gain.gain.setValueAtTime(0.25, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
                osc.connect(gain); gain.connect(ctx.destination);
                osc.start(); osc.stop(ctx.currentTime + 0.45);
            } else if (type === 'win') {
                [659.25, 830.61, 987.77, 1318.51].forEach((f, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(f, ctx.currentTime + idx * 0.07);
                    gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.07);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.07 + 0.25);
                    osc.connect(gain); gain.connect(ctx.destination);
                    osc.start(ctx.currentTime + idx * 0.07);
                    osc.stop(ctx.currentTime + idx * 0.07 + 0.25);
                });
            } else if (type === 'drop') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(280, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.08);
                gain.gain.setValueAtTime(0.06, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.08);
                osc.connect(gain); gain.connect(ctx.destination);
                osc.start(); osc.stop(ctx.currentTime + 0.08);
            }
        } catch {}
    };

    // Calculate cluster wins for current grid
    const checkWins = (currentGrid: string[][]) => {
        const counts: Record<string, number> = {};
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 6; c++) {
                const s = currentGrid[r][c];
                counts[s] = (counts[s] || 0) + 1;
            }
        }

        let winEur = 0;
        const winSyms = new Set<string>();
        const cellsToPop = new Set<string>();

        CANDY_SYMBOLS.forEach(sym => {
            const count = counts[sym.id] || 0;
            if (count >= 8) {
                winSyms.add(sym.id);
                if (count >= 12) winEur += sym.payout12 * betEur;
                else if (count >= 10) winEur += sym.payout10 * betEur;
                else winEur += sym.payout8 * betEur;

                // Locate all cells with this symbol
                for (let r = 0; r < 5; r++) {
                    for (let c = 0; c < 6; c++) {
                        if (currentGrid[r][c] === sym.id) {
                            cellsToPop.add(`${r}-${c}`);
                        }
                    }
                }
            }
        });

        const lollipops = counts['lollipop'] || 0;
        let scatterWin = 0;
        let wonFreeSpins = false;
        if (lollipops >= 4) {
            wonFreeSpins = true;
            scatterWin = lollipops * 3 * betEur;
            for (let r = 0; r < 5; r++) {
                for (let c = 0; c < 6; c++) {
                    if (currentGrid[r][c] === 'lollipop') {
                        cellsToPop.add(`${r}-${c}`);
                    }
                }
            }
        }

        return { winEur, winSyms, cellsToPop, wonFreeSpins, scatterWin, lollipops };
    };

    // Drop new symbols into popped spaces (Tumble logic)
    const applyTumble = (currentGrid: string[][], cellsToPop: Set<string>, isFreeSpins: boolean) => {
        const nextGrid: string[][] = currentGrid.map(row => [...row]);

        // Process column by column
        for (let c = 0; c < 6; c++) {
            const remainingSymbols: string[] = [];
            for (let r = 4; r >= 0; r--) {
                if (!cellsToPop.has(`${r}-${c}`)) {
                    remainingSymbols.push(nextGrid[r][c]);
                }
            }

            // Fill with new symbols from top
            while (remainingSymbols.length < 5) {
                remainingSymbols.push(getRandomSymbol(isFreeSpins));
            }

            // Write back bottom-to-top
            for (let r = 4; r >= 0; r--) {
                nextGrid[r][c] = remainingSymbols[4 - r];
            }
        }

        return nextGrid;
    };

    // Main Spin Handler with Tumble Sequence
    const handleSpin = async () => {
        if (spinning || isTumbling) return;

        const betCents = Math.round(betEur * 100);
        const isFree = freeSpinsRemaining > 0;

        if (!isFree) {
            if (balanceCents < betCents) {
                alert('Nicht genügend Guthaben!');
                return;
            }
            onUpdateBalance(prev => prev - betCents);
        } else {
            setFreeSpinsRemaining(prev => Math.max(0, prev - 1));
        }

        setSpinning(true);
        setLastWinEur(0);
        setRoundTumbleWinEur(0);
        setTotalMultiplier(1);
        setSugarBombs([]);
        setWinningSymbols(new Set());
        setPoppingCells(new Set());
        setWinMessage(isFree ? '🍭 FREISPIEL LÄUFT...' : 'Bonbons fallen...');
        playAudio('spin');

        // Initial Drop Animation
        await new Promise(r => setTimeout(r, 250));
        let activeGrid = generateGrid(isFree);
        setGrid(activeGrid);
        playAudio('drop');
        await new Promise(r => setTimeout(r, 300));

        let accumulatedWinEur = 0;
        let allBombs: { row: number; col: number; mult: number }[] = [];
        let tumbleCount = 0;
        let triggeredBonus = false;

        // Check Sugar Bomb chance on spin
        const bombChance = isFree ? 0.45 : 0.18;
        if (Math.random() < bombChance) {
            const mults = [2, 3, 5, 8, 10, 15, 20, 25, 50, 100];
            const count = Math.random() < 0.3 ? 2 : 1;
            for (let i = 0; i < count; i++) {
                allBombs.push({
                    row: Math.floor(Math.random() * 5),
                    col: Math.floor(Math.random() * 6),
                    mult: mults[Math.floor(Math.random() * mults.length)]
                });
            }
            setSugarBombs([...allBombs]);
        }

        // Tumble Loop
        while (true) {
            const evalResult = checkWins(activeGrid);

            if (evalResult.wonFreeSpins && !triggeredBonus) {
                triggeredBonus = true;
                setFreeSpinsRemaining(prev => prev + 10);
                accumulatedWinEur += evalResult.scatterWin;
                setWinMessage('🍭 4+ LOLLIPOPS! 10 FREISPIELE GEWONNEN!');
                confetti({ particleCount: 40, spread: 80 });
            }

            if (evalResult.cellsToPop.size === 0) {
                // No more wins in this tumble
                break;
            }

            // Animate winning pop
            tumbleCount++;
            accumulatedWinEur += evalResult.winEur;
            setRoundTumbleWinEur(accumulatedWinEur);
            setWinningSymbols(evalResult.winSyms);
            setPoppingCells(evalResult.cellsToPop);
            playAudio('pop');
            playAudio('win');

            setWinMessage(`💥 Tumble #${tumbleCount}: +${accumulatedWinEur.toFixed(2)} €!`);
            await new Promise(r => setTimeout(r, 450));

            // Apply Tumble drop
            activeGrid = applyTumble(activeGrid, evalResult.cellsToPop, isFree);
            setGrid(activeGrid);
            setPoppingCells(new Set());
            setWinningSymbols(new Set());
            playAudio('drop');
            await new Promise(r => setTimeout(r, 350));
        }

        // Tumble Finished: Calculate Multipliers & Total Win
        let finalMultiplier = 1;
        if (allBombs.length > 0 && accumulatedWinEur > 0) {
            playAudio('bomb');
            finalMultiplier = allBombs.reduce((acc, b) => acc + b.mult, 0);
            setTotalMultiplier(finalMultiplier);
            setWinMessage(`💣 ZUCKERBOMBE AKTIVIERT: ${finalMultiplier}× Multiplikator!`);
            await new Promise(r => setTimeout(r, 600));
        }

        const totalWin = accumulatedWinEur * finalMultiplier;
        const totalWinCents = Math.round(totalWin * 100);

        if (totalWinCents > 0) {
            onUpdateBalance(prev => prev + totalWinCents);
            setLastWinEur(totalWin);
            playAudio('win');

            if (totalWin >= betEur * 10) {
                confetti({ particleCount: 50, spread: 90, colors: ['#f43f5e', '#ec4899', '#a855f7', '#fbbf24'] });
                setWinMessage(`🍭 SUGAR RUSH SUPER-GEWINN: +${totalWin.toFixed(2)} €!`);
            } else {
                setWinMessage(`🎉 Süßer Gewinn: +${totalWin.toFixed(2)} €!`);
            }
        } else if (!triggeredBonus) {
            setWinMessage('Drehe erneut für süße Bonbon-Kombos!');
        }

        setSpinning(false);
        setIsTumbling(false);
    };

    return (
        <div style={{
            background: 'radial-gradient(ellipse at center, #831843 0%, #35081b 100%)',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid #ec4899',
            padding: '24px',
            maxWidth: '1240px',
            margin: '0 auto',
            boxShadow: '0 0 50px rgba(236, 72, 153, 0.35)',
            position: 'relative',
            color: '#fff'
        }}>
            {/* Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <button onClick={onBack} className="stake-btn stake-btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                        ← Lobby
                    </button>
                    <span style={{ fontSize: '1.8rem' }}>🍭</span>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#f472b6', fontFamily: 'var(--font-display)', fontWeight: 900, textShadow: '0 0 12px #ec4899' }}>
                            Sweet Bonanza
                        </h2>
                        <span style={{ fontSize: '0.75rem', color: '#fbcfe8' }}>
                            Pragmatic Play &bull; Kaskaden-Tumble &bull; Zuckerbomben bis 100×
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {freeSpinsRemaining > 0 && (
                        <div style={{
                            background: 'linear-gradient(135deg, #db2777, #f43f5e)',
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontWeight: 900,
                            fontSize: '0.85rem',
                            border: '1px solid #fff',
                            boxShadow: '0 0 15px #f43f5e',
                            animation: 'pulseGlow 1s infinite alternate'
                        }}>
                            🍭 FREISPIELE: {freeSpinsRemaining}
                        </div>
                    )}
                    <div style={{ color: 'var(--stake-green)', fontWeight: 900, fontSize: '1.25rem', textShadow: '0 0 10px rgba(0,231,1,0.5)' }}>
                        {(balanceCents / 100).toFixed(2)} €
                    </div>
                </div>
            </div>

            {/* Main Stage: 6x5 Candy Grid + Side Multiplier Card */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 240px',
                gap: '24px',
                background: 'rgba(30, 7, 20, 0.85)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                border: '1px solid rgba(236, 72, 153, 0.3)'
            }}>
                {/* 6x5 Candy Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gridTemplateRows: 'repeat(5, 74px)',
                    gap: '8px',
                    background: 'rgba(50, 10, 30, 0.95)',
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    border: '2px solid rgba(244, 114, 182, 0.4)',
                    boxShadow: 'inset 0 0 35px rgba(0,0,0,0.85)'
                }}>
                    {grid.map((row, rIdx) =>
                        row.map((symId, cIdx) => {
                            const isWin = winningSymbols.has(symId);
                            const isPopping = poppingCells.has(`${rIdx}-${cIdx}`);
                            const symObj = CANDY_SYMBOLS.find(s => s.id === symId) || SCATTER;
                            const bombOnPos = sugarBombs.find(b => b.row === rIdx && b.col === cIdx);

                            return (
                                <div
                                    key={`${rIdx}-${cIdx}`}
                                    style={{
                                        background: isPopping
                                            ? 'rgba(244, 63, 94, 0.7)'
                                            : isWin
                                            ? 'rgba(236, 72, 153, 0.38)'
                                            : 'rgba(255, 255, 255, 0.05)',
                                        border: isPopping
                                            ? '2px solid #f43f5e'
                                            : isWin
                                            ? '2px solid #ec4899'
                                            : '1px solid rgba(255, 255, 255, 0.08)',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'relative',
                                        transform: isPopping ? 'scale(1.2) rotate(8deg)' : isWin ? 'scale(1.08)' : 'scale(1)',
                                        opacity: isPopping ? 0.7 : 1,
                                        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                        boxShadow: isPopping
                                            ? '0 0 25px #f43f5e'
                                            : isWin
                                            ? '0 0 16px #ec4899'
                                            : 'none',
                                        userSelect: 'none'
                                    }}
                                >
                                    <span style={{ fontSize: '2.3rem', filter: isWin ? 'drop-shadow(0 0 8px #f472b6)' : 'none' }}>
                                        {symObj.icon}
                                    </span>
                                    {bombOnPos && (
                                        <div style={{
                                            position: 'absolute',
                                            top: -6,
                                            right: -6,
                                            background: 'linear-gradient(135deg, #10b981, #059669)',
                                            color: '#fff',
                                            fontWeight: 900,
                                            fontSize: '0.75rem',
                                            padding: '2px 7px',
                                            borderRadius: '12px',
                                            boxShadow: '0 0 12px #10b981',
                                            animation: 'pulseGlow 0.6s infinite alternate'
                                        }}>
                                            💣 {bombOnPos.mult}×
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Right Sweet Side Panel */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(70, 15, 40, 0.65)',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px',
                    border: '1px solid rgba(236, 72, 153, 0.3)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '4.5rem', filter: 'drop-shadow(0 4px 15px rgba(236,72,153,0.6))' }}>
                        💣
                    </div>
                    <div>
                        <h3 style={{ margin: '0 0 8px', color: '#f472b6', fontSize: '1.2rem', fontWeight: 900 }}>
                            ZUCKERBOMBEN
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: '#fbcfe8', margin: 0, lineHeight: 1.4 }}>
                            8+ gleiche Symbole überall zahlen Gewinn aus. Gewinnsymbole zerplatzen und machen Platz für neue Kaskaden!
                        </p>
                    </div>

                    {totalMultiplier > 1 ? (
                        <div style={{
                            background: 'linear-gradient(135deg, #ec4899, #f43f5e)',
                            color: '#fff',
                            fontWeight: 900,
                            padding: '10px 20px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '1.3rem',
                            boxShadow: '0 0 25px #ec4899',
                            animation: 'pulseGlow 0.6s infinite alternate'
                        }}>
                            {totalMultiplier}× BOMBE
                        </div>
                    ) : roundTumbleWinEur > 0 ? (
                        <div style={{
                            background: 'rgba(236, 72, 153, 0.3)',
                            border: '1px solid #ec4899',
                            color: '#fbcfe8',
                            fontWeight: 800,
                            padding: '8px 16px',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '1rem'
                        }}>
                            Tumble: +{roundTumbleWinEur.toFixed(2)} €
                        </div>
                    ) : (
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                            Bereit zum Drehen!
                        </div>
                    )}
                </div>
            </div>

            {/* Status Message */}
            <div style={{
                textAlign: 'center',
                margin: '18px 0',
                fontWeight: 800,
                fontSize: '1.1rem',
                color: lastWinEur > 0 ? 'var(--stake-green)' : 'var(--text-white)',
                textShadow: lastWinEur > 0 ? '0 0 10px rgba(0,231,1,0.5)' : 'none'
            }}>
                {winMessage}
            </div>

            {/* Controls */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(30, 7, 20, 0.85)',
                padding: '16px 20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Einsatz:</span>
                    {[0.5, 1, 2, 5, 10, 25].map(v => (
                        <button
                            key={v}
                            onClick={() => setBetEur(v)}
                            disabled={spinning || freeSpinsRemaining > 0}
                            style={{
                                padding: '8px 14px',
                                borderRadius: 'var(--radius-sm)',
                                border: betEur === v ? '2px solid #ec4899' : '1px solid rgba(255, 255, 255, 0.1)',
                                background: betEur === v ? 'var(--bg-elevated)' : 'transparent',
                                color: betEur === v ? '#f472b6' : '#fff',
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                            }}
                        >
                            {v}€
                        </button>
                    ))}
                </div>

                <button
                    onClick={handleSpin}
                    disabled={spinning}
                    className="stake-btn stake-btn-green glow-green"
                    style={{
                        padding: '14px 44px',
                        fontSize: '1.15rem',
                        fontWeight: 900,
                        letterSpacing: '1px',
                        cursor: spinning ? 'not-allowed' : 'pointer'
                    }}
                >
                    {spinning
                        ? 'BONBONS FALLEN...'
                        : freeSpinsRemaining > 0
                        ? `FREISPIEL (${freeSpinsRemaining})`
                        : 'DREHEN'}
                </button>
            </div>
        </div>
    );
};

export default SweetBonanzaGame;
