/**
 * Cache Manager - LocalStorage-based caching with TTL
 * Reduces API calls by storing responses locally
 */

const CACHE_PREFIX = 'ezdota_cache_';

// TTL values in milliseconds
const TTL = {
    MATCHES: 5 * 60 * 1000,         // 5 minutes for match list
    MATCH_DETAIL: 24 * 60 * 60 * 1000, // 24 hours for match details (immutable)
    HEROES: 7 * 24 * 60 * 60 * 1000,   // 7 days for heroes (rarely change)
    PLAYER: 10 * 60 * 1000          // 10 minutes for player profile
};

/**
 * Get cached data if valid
 * @param {string} key - Cache key
 * @returns {any|null} - Cached data or null if expired/missing
 */
function getCache(key) {
    try {
        const item = localStorage.getItem(CACHE_PREFIX + key);
        if (!item) return null;

        const { data, expiry } = JSON.parse(item);
        if (Date.now() > expiry) {
            localStorage.removeItem(CACHE_PREFIX + key);
            return null;
        }

        return data;
    } catch (e) {
        console.warn('Cache read error:', e);
        return null;
    }
}

/**
 * Store data in cache with TTL
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttl - Time to live in milliseconds
 */
function setCache(key, data, ttl) {
    try {
        const item = {
            data,
            expiry: Date.now() + ttl
        };
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
    } catch (e) {
        console.warn('Cache write error:', e);
        // If storage is full, clear old entries
        if (e.name === 'QuotaExceededError') {
            clearExpiredCache();
        }
    }
}

/**
 * Remove all expired cache entries
 */
function clearExpiredCache() {
    const now = Date.now();
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));

    keys.forEach(key => {
        try {
            const item = JSON.parse(localStorage.getItem(key));
            if (item.expiry && now > item.expiry) {
                localStorage.removeItem(key);
            }
        } catch (e) {
            localStorage.removeItem(key);
        }
    });
}

/**
 * Clear all cache
 */
function clearAllCache() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
    keys.forEach(key => localStorage.removeItem(key));
}

/**
 * Get cache statistics
 * @returns {Object} - Cache stats
 */
function getCacheStats() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
    let totalSize = 0;
    let validEntries = 0;
    const now = Date.now();

    keys.forEach(key => {
        try {
            const value = localStorage.getItem(key);
            totalSize += value.length;
            const item = JSON.parse(value);
            if (item.expiry > now) validEntries++;
        } catch (e) { }
    });

    return {
        totalEntries: keys.length,
        validEntries,
        totalSizeKB: Math.round(totalSize / 1024)
    };
}

export { getCache, setCache, clearExpiredCache, clearAllCache, getCacheStats, TTL };
