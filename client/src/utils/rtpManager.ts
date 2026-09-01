export interface RtpSettings {
    globalPreset: 'STANDARD' | 'HOUSE_WINS' | 'HIGH_RTP' | 'GOD_MODE';
    slotWinChance: number; // 0 - 100%
    rouletteMode: 'RANDOM' | 'FORCE_WIN' | 'FORCE_LOSS';
    rouletteWinChance: number; // 0 - 100%
    minesShowLocations: boolean;
    minesRiggedLoss: boolean;
    crashFixedMultiplier: number | null; // e.g. 100.0 or null for dynamic
    crashInstantBust: boolean;
}

const DEFAULT_RTP_SETTINGS: RtpSettings = {
    globalPreset: 'STANDARD',
    slotWinChance: 42,
    rouletteMode: 'RANDOM',
    rouletteWinChance: 48,
    minesShowLocations: false,
    minesRiggedLoss: false,
    crashFixedMultiplier: null,
    crashInstantBust: false,
};

const STORAGE_KEY = 'stake_royal_rtp_settings';

export const getRtpSettings = (): RtpSettings => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Failed to load RTP settings:', e);
    }
    return DEFAULT_RTP_SETTINGS;
};

export const saveRtpSettings = (settings: RtpSettings): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        window.dispatchEvent(new Event('rtp-settings-changed'));
    } catch (e) {
        console.error('Failed to save RTP settings:', e);
    }
};

export const applyRtpPreset = (preset: RtpSettings['globalPreset']): RtpSettings => {
    let settings: RtpSettings = { ...DEFAULT_RTP_SETTINGS, globalPreset: preset };

    switch (preset) {
        case 'HOUSE_WINS':
            settings = {
                ...settings,
                slotWinChance: 0,
                rouletteMode: 'FORCE_LOSS',
                rouletteWinChance: 0,
                minesRiggedLoss: true,
                minesShowLocations: false,
                crashInstantBust: true,
                crashFixedMultiplier: 1.00
            };
            break;
        case 'HIGH_RTP':
            settings = {
                ...settings,
                slotWinChance: 85,
                rouletteMode: 'FORCE_WIN',
                rouletteWinChance: 85,
                minesRiggedLoss: false,
                minesShowLocations: false,
                crashFixedMultiplier: 10.0,
                crashInstantBust: false
            };
            break;
        case 'GOD_MODE':
            settings = {
                ...settings,
                slotWinChance: 100,
                rouletteMode: 'FORCE_WIN',
                rouletteWinChance: 100,
                minesRiggedLoss: false,
                minesShowLocations: true,
                crashFixedMultiplier: 50.0,
                crashInstantBust: false
            };
            break;
        case 'STANDARD':
        default:
            settings = DEFAULT_RTP_SETTINGS;
            break;
    }

    saveRtpSettings(settings);
    return settings;
};
