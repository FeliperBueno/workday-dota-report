/**
 * Global State Management
 * Centralized state with workday filter and configuration
 */

import { getMatches, getHeroStats, getPlayer } from './services/api.js';
import { createHeroMap, normalizeMatch } from './domain/models.js';

// Default workday configuration
const DEFAULT_CONFIG = {
    workdayStart: 9,    // 09:00
    workdayEnd: 18,     // 18:00
    workdays: [1, 2, 3, 4, 5]  // Monday to Friday
};

// Global state
const state = {
    // Current filter mode
    filterMode: 'remunerado', // 'remunerado' | 'todas'

    // Configuration
    config: { ...DEFAULT_CONFIG },

    // Data
    player: null,
    rawMatches: [],
    heroMap: new Map(),

    // Computed/filtered data
    matches: [],

    // Loading states
    loading: true,
    error: null,

    // Listeners for state changes
    _listeners: []
};

/**
 * Subscribe to state changes
 * @param {Function} listener
 * @returns {Function} Unsubscribe function
 */
function subscribe(listener) {
    state._listeners.push(listener);
    return () => {
        state._listeners = state._listeners.filter(l => l !== listener);
    };
}

/**
 * Notify all listeners of state change
 */
function notifyListeners() {
    state._listeners.forEach(listener => listener(state));
}

/**
 * Check if a timestamp falls within workday hours
 * @param {number} timestamp - Unix timestamp in ms
 * @returns {boolean}
 */
function isWorkdayTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const day = date.getDay(); // 0 = Sunday

    const isWorkday = state.config.workdays.includes(day);
    const isWorkHours = hours >= state.config.workdayStart && hours < state.config.workdayEnd;

    return isWorkday && isWorkHours;
}

/**
 * Filter matches based on current filter mode
 */
function applyFilter() {
    if (state.filterMode === 'todas') {
        state.matches = [...state.rawMatches];
    } else {
        state.matches = state.rawMatches.filter(m => isWorkdayTime(m.timestamp));
    }
    notifyListeners();
}

/**
 * Set filter mode
 * @param {'remunerado'|'todas'} mode
 */
function setFilterMode(mode) {
    if (mode !== state.filterMode) {
        state.filterMode = mode;
        applyFilter();

        // Persist preference
        try {
            localStorage.setItem('ezdota_filter_mode', mode);
        } catch (e) { }
    }
}

/**
 * Toggle filter mode
 */
function toggleFilterMode() {
    setFilterMode(state.filterMode === 'remunerado' ? 'todas' : 'remunerado');
}

/**
 * Get current filter mode
 * @returns {string}
 */
function getFilterMode() {
    return state.filterMode;
}

/**
 * Get filtered matches
 * @returns {Array}
 */
function getFilteredMatches() {
    return state.matches;
}

/**
 * Get all matches (unfiltered)
 * @returns {Array}
 */
function getAllMatches() {
    return state.rawMatches;
}

/**
 * Get hero map
 * @returns {Map}
 */
function getHeroMap() {
    return state.heroMap;
}

/**
 * Get player data
 * @returns {Object|null}
 */
function getPlayerData() {
    return state.player;
}

/**
 * Check if data is loading
 * @returns {boolean}
 */
function isLoading() {
    return state.loading;
}

/**
 * Get error state
 * @returns {Error|null}
 */
function getError() {
    return state.error;
}

/**
 * Initialize state - load data from API
 */
async function initialize() {
    state.loading = true;
    state.error = null;
    notifyListeners();

    try {
        // Load saved preferences
        try {
            const savedMode = localStorage.getItem('ezdota_filter_mode');
            if (savedMode === 'todas' || savedMode === 'remunerado') {
                state.filterMode = savedMode;
            }
        } catch (e) { }

        // Fetch data in parallel
        const [player, heroStats, rawMatches] = await Promise.all([
            getPlayer(),
            getHeroStats(),
            getMatches()
        ]);

        // Store player data
        state.player = player;

        // Create hero lookup
        state.heroMap = createHeroMap(heroStats);

        // Normalize and store matches
        state.rawMatches = rawMatches.map(m => normalizeMatch(m, state.heroMap));

        // Apply initial filter
        applyFilter();

        state.loading = false;
        notifyListeners();

        console.log('[State] Initialized with', state.rawMatches.length, 'matches');

    } catch (error) {
        console.error('[State] Initialization error:', error);
        state.error = error;
        state.loading = false;
        notifyListeners();
    }
}

/**
 * Refresh data from API
 */
async function refresh() {
    // Clear cache first
    const { clearAllCache } = await import('./services/cache.js');
    clearAllCache();

    // Re-initialize
    await initialize();
}

/**
 * Update workday configuration
 * @param {Object} config
 */
function updateConfig(config) {
    state.config = { ...state.config, ...config };
    applyFilter();

    // Persist config
    try {
        localStorage.setItem('ezdota_config', JSON.stringify(state.config));
    } catch (e) { }
}

/**
 * Load saved configuration
 */
function loadConfig() {
    try {
        const saved = localStorage.getItem('ezdota_config');
        if (saved) {
            state.config = { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
        }
    } catch (e) { }
}

// Load config on module load
loadConfig();

export {
    initialize,
    refresh,
    subscribe,
    setFilterMode,
    toggleFilterMode,
    getFilterMode,
    getFilteredMatches,
    getAllMatches,
    getHeroMap,
    getPlayerData,
    isLoading,
    getError,
    updateConfig,
    isWorkdayTime,
    state
};
