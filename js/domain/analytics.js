/**
 * Analytics Engine - Statistical calculations and aggregations
 * Pure functions for computing player performance metrics
 */

import { calculateKdaRatio } from './models.js';

/**
 * Calculate overall win rate
 * @param {Array} matches - Normalized matches
 * @returns {Object}
 */
function calculateWinRate(matches) {
    const total = matches.length;
    if (total === 0) return { rate: 0, wins: 0, losses: 0, total: 0 };

    const wins = matches.filter(m => m.result === 'win').length;
    const losses = matches.filter(m => m.result === 'loss').length;

    return {
        rate: Math.round((wins / total) * 100),
        wins,
        losses,
        total
    };
}

/**
 * Calculate average KDA
 * @param {Array} matches - Normalized matches
 * @returns {Object}
 */
function calculateAverageKda(matches) {
    if (matches.length === 0) return { kills: 0, deaths: 0, assists: 0, ratio: 0 };

    const totals = matches.reduce((acc, m) => ({
        kills: acc.kills + m.kda.kills,
        deaths: acc.deaths + m.kda.deaths,
        assists: acc.assists + m.kda.assists
    }), { kills: 0, deaths: 0, assists: 0 });

    const avgKills = totals.kills / matches.length;
    const avgDeaths = totals.deaths / matches.length;
    const avgAssists = totals.assists / matches.length;

    return {
        kills: avgKills.toFixed(1),
        deaths: avgDeaths.toFixed(1),
        assists: avgAssists.toFixed(1),
        ratio: calculateKdaRatio(totals.kills, totals.deaths, totals.assists)
    };
}

/**
 * Calculate average match duration
 * @param {Array} matches - Normalized matches
 * @returns {Object}
 */
function calculateAverageDuration(matches) {
    if (matches.length === 0) return { seconds: 0, formatted: '0:00' };

    const totalSeconds = matches.reduce((acc, m) => acc + m.duration.seconds, 0);
    const avgSeconds = Math.round(totalSeconds / matches.length);
    const mins = Math.floor(avgSeconds / 60);
    const secs = avgSeconds % 60;

    return {
        seconds: avgSeconds,
        formatted: `${mins}:${secs.toString().padStart(2, '0')}`
    };
}

/**
 * Calculate matches by type
 * @param {Array} matches - Normalized matches
 * @returns {Object}
 */
function countMatchesByType(matches) {
    return {
        ranked: matches.filter(m => m.type === 'ranked').length,
        normal: matches.filter(m => m.type === 'normal').length,
        turbo: matches.filter(m => m.type === 'turbo').length
    };
}

/**
 * Get most played heroes
 * @param {Array} matches - Normalized matches
 * @param {number} limit - Number of heroes to return
 * @returns {Array}
 */
function getMostPlayedHeroes(matches, limit = 5) {
    const heroStats = new Map();

    matches.forEach(m => {
        const existing = heroStats.get(m.heroId) || {
            heroId: m.heroId,
            heroName: m.heroName,
            heroImage: m.heroImage,
            games: 0,
            wins: 0
        };

        existing.games++;
        if (m.result === 'win') existing.wins++;

        heroStats.set(m.heroId, existing);
    });

    return Array.from(heroStats.values())
        .map(h => ({
            ...h,
            winRate: Math.round((h.wins / h.games) * 100)
        }))
        .sort((a, b) => b.games - a.games)
        .slice(0, limit);
}

/**
 * Determine best role/lane based on win rate
 * @param {Array} matches - Normalized matches
 * @returns {Object}
 */
function getBestRole(matches) {
    const lanes = {
        1: { name: 'Safe Lane', games: 0, wins: 0 },
        2: { name: 'Mid Lane', games: 0, wins: 0 },
        3: { name: 'Off Lane', games: 0, wins: 0 },
        4: { name: 'Jungle', games: 0, wins: 0 }
    };

    matches.forEach(m => {
        if (m.lane && lanes[m.lane]) {
            lanes[m.lane].games++;
            if (m.result === 'win') lanes[m.lane].wins++;
        }
    });

    const sorted = Object.values(lanes)
        .filter(l => l.games > 0)
        .map(l => ({
            ...l,
            winRate: Math.round((l.wins / l.games) * 100)
        }))
        .sort((a, b) => {
            // Sort by win rate, but require minimum games
            if (b.games < 3 && a.games >= 3) return -1;
            if (a.games < 3 && b.games >= 3) return 1;
            return b.winRate - a.winRate;
        });

    return sorted[0] || { name: 'Unknown', winRate: 0, games: 0 };
}

/**
 * Calculate weekly trends
 * @param {Array} matches - Normalized matches
 * @returns {Object}
 */
function calculateWeeklyStats(matches) {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);

    const thisWeek = matches.filter(m => m.timestamp >= oneWeekAgo);
    const lastWeek = matches.filter(m => m.timestamp >= twoWeeksAgo && m.timestamp < oneWeekAgo);

    const thisWeekWinRate = calculateWinRate(thisWeek);
    const lastWeekWinRate = calculateWinRate(lastWeek);

    return {
        thisWeek: {
            matches: thisWeek.length,
            winRate: thisWeekWinRate.rate
        },
        lastWeek: {
            matches: lastWeek.length,
            winRate: lastWeekWinRate.rate
        },
        trend: {
            matches: thisWeek.length - lastWeek.length,
            winRate: thisWeekWinRate.rate - lastWeekWinRate.rate
        }
    };
}

/**
 * Calculate play style metrics for radar chart
 * @param {Array} matches - Normalized matches
 * @returns {Object}
 */
function calculatePlayStyle(matches) {
    if (matches.length === 0) {
        return {
            fighting: 0,
            versatility: 0,
            farming: 0,
            supporting: 0,
            pushing: 0
        };
    }

    // Calculate metrics (normalized to 0-100)
    const avgKda = calculateAverageKda(matches);

    // Fighting: based on kills per game
    const avgKills = parseFloat(avgKda.kills);
    const fighting = Math.min(100, Math.round(avgKills * 10));

    // Versatility: based on unique heroes played
    const uniqueHeroes = new Set(matches.map(m => m.heroId)).size;
    const heroRatio = uniqueHeroes / matches.length;
    const versatility = Math.min(100, Math.round(heroRatio * 100 * 2));

    // Farming: based on game mode (more ranked = more farming focus)
    const rankedRatio = matches.filter(m => m.type === 'ranked').length / matches.length;
    const farming = Math.min(100, Math.round(rankedRatio * 100 + 20));

    // Supporting: based on assist ratio
    const avgAssists = parseFloat(avgKda.assists);
    const avgDeaths = parseFloat(avgKda.deaths);
    const supporting = Math.min(100, Math.round((avgAssists / (avgKills + 1)) * 50));

    // Pushing: inverse of average game duration (shorter = more pushing)
    const avgDuration = calculateAverageDuration(matches).seconds;
    const pushing = Math.min(100, Math.round((2400 - avgDuration) / 12));

    return {
        fighting: Math.max(0, fighting),
        versatility: Math.max(0, versatility),
        farming: Math.max(0, farming),
        supporting: Math.max(0, supporting),
        pushing: Math.max(0, pushing)
    };
}

/**
 * Get performance over time data for charts
 * @param {Array} matches - Normalized matches (sorted newest first)
 * @param {number} days - Number of days to analyze
 * @returns {Array}
 */
function getPerformanceOverTime(matches, days = 30) {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const filtered = matches.filter(m => m.timestamp >= cutoff);

    // Group by date
    const byDate = new Map();
    filtered.forEach(m => {
        const dateKey = m.localTime.toISOString().split('T')[0];
        if (!byDate.has(dateKey)) {
            byDate.set(dateKey, { wins: 0, losses: 0, games: 0 });
        }
        const day = byDate.get(dateKey);
        day.games++;
        if (m.result === 'win') day.wins++;
        else if (m.result === 'loss') day.losses++;
    });

    return Array.from(byDate.entries())
        .map(([date, stats]) => ({
            date,
            ...stats,
            winRate: Math.round((stats.wins / stats.games) * 100)
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

export {
    calculateWinRate,
    calculateAverageKda,
    calculateAverageDuration,
    countMatchesByType,
    getMostPlayedHeroes,
    getBestRole,
    calculateWeeklyStats,
    calculatePlayStyle,
    getPerformanceOverTime
};
