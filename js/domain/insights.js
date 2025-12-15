/**
 * Insights Generator - Smart insights based on match data
 * Generates actionable advice and observations
 */

import { calculateWinRate, calculateAverageKda, getMostPlayedHeroes } from './analytics.js';

/**
 * Generate all insights for a player
 * @param {Array} matches - Normalized matches
 * @returns {Array}
 */
function generateInsights(matches) {
    if (matches.length < 5) {
        return [{
            type: 'info',
            title: 'Dados Insuficientes',
            message: 'Jogue mais partidas para receber insights personalizados.'
        }];
    }

    const insights = [];

    // Generate various insights
    insights.push(...checkFarmingIssues(matches));
    insights.push(...checkSynergies(matches));
    insights.push(...checkStreaks(matches));
    insights.push(...checkHeroPerformance(matches));
    insights.push(...checkPlayPatterns(matches));

    // Return top 3-5 most relevant insights
    return insights.slice(0, 5);
}

/**
 * Check for farming/last hit issues
 * @param {Array} matches
 * @returns {Array}
 */
function checkFarmingIssues(matches) {
    const insights = [];

    // Check recent matches for low last hits (if available in data)
    const recent = matches.slice(0, 5);
    const avgDeaths = recent.reduce((sum, m) => sum + m.kda.deaths, 0) / recent.length;

    if (avgDeaths > 8) {
        insights.push({
            type: 'warning',
            title: 'Muitas Mortes Recentes',
            message: `Nas últimas ${recent.length} partidas, sua média de mortes foi ${avgDeaths.toFixed(1)}. Tente jogar mais seguro no early game.`
        });
    }

    return insights;
}

/**
 * Check for hero synergies
 * @param {Array} matches
 * @returns {Array}
 */
function checkSynergies(matches) {
    const insights = [];
    const heroWinRates = new Map();

    matches.forEach(m => {
        if (!heroWinRates.has(m.heroId)) {
            heroWinRates.set(m.heroId, { wins: 0, games: 0, name: m.heroName });
        }
        const stats = heroWinRates.get(m.heroId);
        stats.games++;
        if (m.result === 'win') stats.wins++;
    });

    // Find heroes with high win rate (min 3 games)
    const highWinRate = Array.from(heroWinRates.values())
        .filter(h => h.games >= 3)
        .map(h => ({ ...h, winRate: Math.round((h.wins / h.games) * 100) }))
        .filter(h => h.winRate >= 70)
        .sort((a, b) => b.winRate - a.winRate);

    if (highWinRate.length > 0) {
        const hero = highWinRate[0];
        insights.push({
            type: 'success',
            title: 'Sinergia Alta',
            message: `Você tem ${hero.winRate}% de vitória jogando com ${hero.name} (${hero.games} partidas).`
        });
    }

    return insights;
}

/**
 * Check for winning/losing streaks
 * @param {Array} matches
 * @returns {Array}
 */
function checkStreaks(matches) {
    const insights = [];

    if (matches.length < 3) return insights;

    // Check current streak
    let currentStreak = 0;
    let streakType = matches[0].result;

    for (const match of matches) {
        if (match.result === streakType && match.result !== 'unknown') {
            currentStreak++;
        } else {
            break;
        }
    }

    if (currentStreak >= 3) {
        if (streakType === 'win') {
            insights.push({
                type: 'success',
                title: 'Sequência de Vitórias!',
                message: `Você está em uma sequência de ${currentStreak} vitórias! Continue assim!`
            });
        } else if (streakType === 'loss') {
            insights.push({
                type: 'warning',
                title: 'Sequência de Derrotas',
                message: `${currentStreak} derrotas em sequência. Considere fazer uma pausa ou mudar de estratégia.`
            });
        }
    }

    return insights;
}

/**
 * Check hero performance insights
 * @param {Array} matches
 * @returns {Array}
 */
function checkHeroPerformance(matches) {
    const insights = [];

    const heroes = getMostPlayedHeroes(matches, 10);

    // Find heroes with low win rate that player keeps picking
    const problematic = heroes.find(h => h.games >= 5 && h.winRate < 40);
    if (problematic) {
        insights.push({
            type: 'warning',
            title: 'Performance de Herói',
            message: `Sua taxa de vitória com ${problematic.heroName} é de apenas ${problematic.winRate}% em ${problematic.games} partidas. Considere praticar em unranked ou escolher outro herói.`
        });
    }

    // Best performing hero
    const best = heroes.find(h => h.games >= 3 && h.winRate >= 60);
    if (best) {
        insights.push({
            type: 'success',
            title: 'Herói Forte',
            message: `${best.heroName} é seu herói mais eficiente com ${best.winRate}% de vitória em ${best.games} partidas.`
        });
    }

    return insights;
}

/**
 * Check play patterns
 * @param {Array} matches
 * @returns {Array}
 */
function checkPlayPatterns(matches) {
    const insights = [];

    // Check game duration patterns
    const avgDuration = matches.reduce((sum, m) => sum + m.duration.seconds, 0) / matches.length;

    if (avgDuration > 45 * 60) { // > 45 min
        const lateGameWins = matches.filter(m => m.duration.seconds > 40 * 60 && m.result === 'win').length;
        const lateGameTotal = matches.filter(m => m.duration.seconds > 40 * 60).length;

        if (lateGameTotal >= 5) {
            const lateWinRate = Math.round((lateGameWins / lateGameTotal) * 100);
            insights.push({
                type: 'info',
                title: 'Partidas Longas',
                message: `Suas partidas costumam passar de 40 minutos. Sua taxa de vitória em late game é ${lateWinRate}%.`
            });
        }
    }

    // Check match type distribution
    const ranked = matches.filter(m => m.type === 'ranked').length;
    const rankedRatio = ranked / matches.length;

    if (rankedRatio < 0.3 && matches.length > 10) {
        insights.push({
            type: 'info',
            title: 'Modo de Jogo',
            message: `Apenas ${Math.round(rankedRatio * 100)}% das suas partidas são ranked. Jogue mais ranked para melhorar seu MMR!`
        });
    }

    return insights;
}

export { generateInsights };
