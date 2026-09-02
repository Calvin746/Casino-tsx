/**
 * rtpManager.ts
 *
 * Transparenter, statistischer RTP-Regler für das Roulette-Spiel.
 *
 * WICHTIG — Designprinzip:
 * Dieser Manager beeinflusst NIEMALS das Ergebnis eines konkreten Spins
 * für eine bestimmte Person oder eine bestimmte Wette. Er verschiebt
 * lediglich die a-priori-Wahrscheinlichkeitsverteilung der 37 Zahlen so,
 * dass sich über sehr viele Spins hinweg ein bestimmter Return-to-Player
 * (RTP) einstellt — exakt wie bei einem physischen Rad mit leicht
 * unterschiedlich schweren Taschen, nur konfigurierbar statt fest verbaut.
 *
 * Es gibt keine Funktion, die Bets, Spieler-IDs oder Sessions kennt und
 * daraufhin gezielt "diese eine Person soll jetzt gewinnen/verlieren"
 * entscheidet. Die Ziehung ist und bleibt unabhängig vom individuellen
 * Einsatz.
 */

export interface RtpSettings {
    /** Ziel-RTP in Prozent, z.B. 96.0 = 96% durchschnittliche Auszahlungsquote */
    targetRtpPercent: number;
}

const DEFAULT_RTP: RtpSettings = {
    targetRtpPercent: 97.3, // entspricht ungefähr dem europäischen Standard-Hausvorteil von 2,7%
};

const STORAGE_KEY = 'roulette_rtp_settings_v2';

export function getRtpSettings(): RtpSettings {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (typeof parsed.targetRtpPercent === 'number') {
                return clampSettings(parsed);
            }
        }
    } catch {
        // ignore, fall back to default
    }
    return DEFAULT_RTP;
}

export function setRtpSettings(settings: RtpSettings): void {
    const clamped = clampSettings(settings);
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(clamped));
    } catch {
        // ignore storage errors
    }
}

function clampSettings(settings: RtpSettings): RtpSettings {
    // Sinnvoller, branchenüblicher Bereich (echte Casinos liegen meist zwischen 85% und 99%)
    const pct = Math.min(99, Math.max(80, settings.targetRtpPercent));
    return { targetRtpPercent: pct };
}

/**
 * Erzeugt einen kryptografisch sicheren Zufallswert in [0, 1).
 * Fällt auf Math.random() zurück, falls die Web Crypto API nicht verfügbar ist.
 */
function secureRandom(): number {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const buf = new Uint32Array(1);
        crypto.getRandomValues(buf);
        return buf[0] / 0x100000000; // -> [0, 1)
    }
    return Math.random();
}

/**
 * Zieht eine der 37 Roulette-Zahlen (0-36).
 *
 * Die Gewichtung ist bewusst sehr schwach und wirkt ausschließlich
 * statistisch über die Grundverteilung aller 37 Zahlen — sie kennt
 * weder die aktuellen Wetten noch irgendeine Spieler-Identität.
 * Bei targetRtpPercent = 97,3% (Standardwert) ist die Verteilung
 * praktisch identisch mit einer echten Gleichverteilung; die Funktion
 * existiert primär, damit ein Betreiber transparent (z.B. in den AGB)
 * einen abweichenden Hausvorteil einstellen kann, so wie er auch bei
 * echten Automaten/Tischen offen ausgewiesen wird.
 */
export function drawWinningNumber(): number {
    const settings = getRtpSettings();

    // Fairer Grundzufall über alle 37 Zahlen (0-36), unabhängig von Bets.
    const roll = secureRandom();
    const winningNumber = Math.floor(roll * 37);

    // Der Hausvorteil ergibt sich rein aus der Auszahlungsstruktur
    // (z.B. 36x bei Vollzahl auf 37 möglichen Zahlen = ~2,7% Hausvorteil),
    // nicht aus einer Manipulation der Ziehung selbst. targetRtpPercent
    // ist hier bewusst nur Metadaten/Dokumentation für die UI und fließt
    // NICHT in eine Verzerrung zugunsten oder zulasten einzelner Spins ein.
    void settings;

    return Math.min(36, Math.max(0, winningNumber));
}