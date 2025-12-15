/**
 * Domain Models - Data normalization and transformation
 * Converts raw API data into clean domain models
 */

import { getHeroImageUrl } from '../services/api.js';

// Game mode mappings
const GAME_MODES = {
    0: 'Unknown',
    1: 'All Pick',
    2: 'Captains Mode',
    3: 'Random Draft',
    4: 'Single Draft',
    5: 'All Random',
    6: 'Intro',
    7: 'Diretide',
    8: 'Reverse Captains Mode',
    9: 'Greeviling',
    10: 'Tutorial',
    11: 'Mid Only',
    12: 'Least Played',
    13: 'Limited Heroes',
    14: 'Compendium',
    15: 'Custom',
    16: 'Captains Draft',
    17: 'Balanced Draft',
    18: 'Ability Draft',
    19: 'Event',
    20: 'All Random Deathmatch',
    21: '1v1 Mid',
    22: 'All Draft',
    23: 'Turbo',
    24: 'Mutation'
};

// Lobby type mappings
const LOBBY_TYPES = {
    0: 'Normal',
    1: 'Practice',
    2: 'Tournament',
    4: 'Co-op Bot',
    5: 'Ranked Solo/Duo',
    6: 'Ranked Team',
    7: 'Ranked',
    8: 'Solo Mid 1v1',
    9: 'Battle Cup'
};

/**
 * Create hero lookup map from hero stats
 * @param {Array} heroStats - Raw hero stats from API
 * @returns {Map}
 */
function createHeroMap(heroStats) {
    const map = new Map();
    heroStats.forEach(hero => {
        map.set(hero.id, {
            id: hero.id,
            name: hero.localized_name,
            image: getHeroImageUrl(hero.img),
            icon: getHeroImageUrl(hero.icon),
            primaryAttr: hero.primary_attr,
            attackType: hero.attack_type,
            roles: hero.roles || []
        });
    });
    return map;
}

/**
 * Determine match type based on lobby and game mode
 * @param {number} lobbyType - Lobby type ID
 * @param {number} gameMode - Game mode ID
 * @returns {'ranked'|'normal'|'turbo'}
 */
function getMatchType(lobbyType, gameMode) {
    if (gameMode === 23) return 'turbo';
    if (lobbyType === 5 || lobbyType === 6 || lobbyType === 7) return 'ranked';
    return 'normal';
}

/**
 * Determine match result
 * @param {boolean} radiantWin - Did radiant win
 * @param {number} playerSlot - Player slot (0-127 radiant, 128-255 dire)
 * @returns {'win'|'loss'|'unknown'}
 */
function getMatchResult(radiantWin, playerSlot) {
    if (radiantWin === null || radiantWin === undefined) return 'unknown';
    const isRadiant = playerSlot < 128;
    return (isRadiant === radiantWin) ? 'win' : 'loss';
}

/**
 * Format duration in seconds to mm:ss
 * @param {number} seconds - Duration in seconds
 * @returns {string}
 */
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate KDA ratio
 * @param {number} kills 
 * @param {number} deaths 
 * @param {number} assists 
 * @returns {number}
 */
function calculateKdaRatio(kills, deaths, assists) {
    if (deaths === 0) return kills + assists;
    return ((kills + assists) / deaths).toFixed(2);
}

/**
 * Get relative time string
 * @param {Date} date
 * @returns {string}
 */
function getRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutos atrás`;
    if (diffHours < 24) return `${diffHours} horas atrás`;
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;

    return date.toLocaleDateString('pt-BR');
}

/**
 * Normalize raw match data to domain model
 * @param {Object} rawMatch - Raw match from API
 * @param {Map} heroMap - Hero lookup map
 * @returns {Object} - Normalized match
 */
function normalizeMatch(rawMatch, heroMap) {
    const hero = heroMap.get(rawMatch.hero_id) || {
        name: 'Unknown',
        image: null,
        icon: null
    };

    const timestamp = rawMatch.start_time * 1000;
    const localTime = new Date(timestamp);

    return {
        id: rawMatch.match_id,

        // Hero info
        heroId: rawMatch.hero_id,
        heroName: hero.name,
        heroImage: hero.image,
        heroIcon: hero.icon,

        // Result
        result: getMatchResult(rawMatch.radiant_win, rawMatch.player_slot),

        // KDA
        kda: {
            kills: rawMatch.kills || 0,
            deaths: rawMatch.deaths || 0,
            assists: rawMatch.assists || 0,
            ratio: calculateKdaRatio(
                rawMatch.kills || 0,
                rawMatch.deaths || 0,
                rawMatch.assists || 0
            )
        },

        // Duration
        duration: {
            seconds: rawMatch.duration,
            formatted: formatDuration(rawMatch.duration)
        },

        // Match type
        type: getMatchType(rawMatch.lobby_type, rawMatch.game_mode),
        gameMode: GAME_MODES[rawMatch.game_mode] || 'Unknown',
        lobbyType: LOBBY_TYPES[rawMatch.lobby_type] || 'Unknown',

        // MMR (estimated from party/solo if available)
        mmrChange: null, // OpenDota doesn't provide this directly

        // Time
        timestamp,
        localTime,
        relativeTime: getRelativeTime(localTime),

        // Player position
        playerSlot: rawMatch.player_slot,
        isRadiant: rawMatch.player_slot < 128,

        // Additional stats
        lane: rawMatch.lane,
        laneRole: rawMatch.lane_role,
        partySize: rawMatch.party_size,
        averageRank: rawMatch.average_rank,

        // Raw data for detail view
        _raw: rawMatch
    };
}

/**
 * Normalize match detail data
 * @param {Object} rawMatch - Full match details from API
 * @param {Map} heroMap - Hero lookup map
 * @param {string} playerId - Current player ID
 * @returns {Object}
 */
function normalizeMatchDetail(rawMatch, heroMap, playerId) {
    const playerData = rawMatch.players?.find(p =>
        String(p.account_id) === String(playerId)
    );

    return {
        id: rawMatch.match_id,

        // Scores
        radiantScore: rawMatch.radiant_score,
        direScore: rawMatch.dire_score,
        radiantWin: rawMatch.radiant_win,

        // Duration
        duration: {
            seconds: rawMatch.duration,
            formatted: formatDuration(rawMatch.duration)
        },

        // Time
        timestamp: rawMatch.start_time * 1000,

        // Game info
        gameMode: GAME_MODES[rawMatch.game_mode] || 'Unknown',
        lobbyType: LOBBY_TYPES[rawMatch.lobby_type] || 'Unknown',

        // Gold advantage over time
        goldAdvantage: rawMatch.radiant_gold_adv || [],
        xpAdvantage: rawMatch.radiant_xp_adv || [],

        // Players (for detailed view)
        players: rawMatch.players?.map(p => ({
            accountId: p.account_id,
            name: p.personaname || 'Anonymous',
            hero: heroMap.get(p.hero_id) || { name: 'Unknown' },
            kills: p.kills,
            deaths: p.deaths,
            assists: p.assists,
            netWorth: p.net_worth,
            lastHits: p.last_hits,
            denies: p.denies,
            gpm: p.gold_per_min,
            xpm: p.xp_per_min,
            heroDamage: p.hero_damage,
            towerDamage: p.tower_damage,
            heroHealing: p.hero_healing,
            isRadiant: p.isRadiant || p.player_slot < 128
        })) || [],

        // Current player data
        currentPlayer: playerData ? {
            hero: heroMap.get(playerData.hero_id),
            kda: {
                kills: playerData.kills,
                deaths: playerData.deaths,
                assists: playerData.assists,
                ratio: calculateKdaRatio(playerData.kills, playerData.deaths, playerData.assists)
            },
            result: getMatchResult(rawMatch.radiant_win, playerData.player_slot),
            isRadiant: playerData.player_slot < 128
        } : null
    };
}

export {
    createHeroMap,
    normalizeMatch,
    normalizeMatchDetail,
    formatDuration,
    calculateKdaRatio,
    getRelativeTime,
    getMatchResult,
    getMatchType,
    GAME_MODES,
    LOBBY_TYPES
};
