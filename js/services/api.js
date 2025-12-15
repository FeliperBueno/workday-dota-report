/**
 * OpenDota API Service
 * Wrapper for OpenDota public API with automatic caching
 */

import { getCache, setCache, TTL } from './cache.js';

const BASE_URL = 'https://api.opendota.com/api';

// Default player ID (SteamID32)
const DEFAULT_PLAYER_ID = '425817633';

/**
 * Generic fetch with caching
 * @param {string} endpoint - API endpoint
 * @param {string} cacheKey - Cache key
 * @param {number} ttl - Cache TTL
 * @returns {Promise<any>}
 */
async function fetchWithCache(endpoint, cacheKey, ttl) {
    // Check cache first
    const cached = getCache(cacheKey);
    if (cached) {
        console.log(`[API] Cache hit: ${cacheKey}`);
        return cached;
    }

    console.log(`[API] Fetching: ${endpoint}`);
    const response = await fetch(`${BASE_URL}${endpoint}`);

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    setCache(cacheKey, data, ttl);
    return data;
}

/**
 * Get player profile
 * @param {string} accountId - Player account ID
 * @returns {Promise<Object>}
 */
async function getPlayer(accountId = DEFAULT_PLAYER_ID) {
    return fetchWithCache(
        `/players/${accountId}`,
        `player_${accountId}`,
        TTL.PLAYER
    );
}

/**
 * Get player's recent matches
 * @param {string} accountId - Player account ID  
 * @param {number} limit - Number of matches to fetch
 * @returns {Promise<Array>}
 */
async function getMatches(accountId = DEFAULT_PLAYER_ID, limit = 100) {
    return fetchWithCache(
        `/players/${accountId}/matches?limit=${limit}`,
        `matches_${accountId}_${limit}`,
        TTL.MATCHES
    );
}

/**
 * Get detailed match data
 * @param {string} matchId - Match ID
 * @returns {Promise<Object>}
 */
async function getMatchDetails(matchId) {
    return fetchWithCache(
        `/matches/${matchId}`,
        `match_${matchId}`,
        TTL.MATCH_DETAIL
    );
}

/**
 * Get all heroes
 * @returns {Promise<Array>}
 */
async function getHeroes() {
    return fetchWithCache('/heroes', 'heroes', TTL.HEROES);
}

/**
 * Get hero stats (includes images)
 * @returns {Promise<Array>}
 */
async function getHeroStats() {
    return fetchWithCache('/heroStats', 'heroStats', TTL.HEROES);
}

/**
 * Get player's win/loss
 * @param {string} accountId - Player account ID
 * @returns {Promise<Object>}
 */
async function getWinLoss(accountId = DEFAULT_PLAYER_ID) {
    return fetchWithCache(
        `/players/${accountId}/wl`,
        `wl_${accountId}`,
        TTL.PLAYER
    );
}

/**
 * Get player's totals (kills, deaths, assists, etc)
 * @param {string} accountId - Player account ID
 * @returns {Promise<Array>}
 */
async function getTotals(accountId = DEFAULT_PLAYER_ID) {
    return fetchWithCache(
        `/players/${accountId}/totals`,
        `totals_${accountId}`,
        TTL.PLAYER
    );
}

/**
 * Get constants (game modes, lobby types, etc)
 * @param {string} resource - Resource name
 * @returns {Promise<Object>}
 */
async function getConstants(resource) {
    return fetchWithCache(
        `/constants/${resource}`,
        `constants_${resource}`,
        TTL.HEROES
    );
}

/**
 * Build CDN URL for hero image
 * @param {string} imagePath - Image path from API
 * @returns {string}
 */
function getHeroImageUrl(imagePath) {
    if (!imagePath) return null;
    return `https://cdn.dota2.com${imagePath}`;
}

export {
    getPlayer,
    getMatches,
    getMatchDetails,
    getHeroes,
    getHeroStats,
    getWinLoss,
    getTotals,
    getConstants,
    getHeroImageUrl,
    DEFAULT_PLAYER_ID
};
