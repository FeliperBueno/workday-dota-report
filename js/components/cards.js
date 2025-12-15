/**
 * Metric Cards Component
 * Dashboard summary cards with trend indicators
 */

import { calculateWinRate, calculateAverageKda, getBestRole, calculateWeeklyStats } from '../domain/analytics.js';
import { getFilteredMatches } from '../state.js';

// Card icons
const icons = {
    winrate: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>`,
    kda: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
    matches: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    role: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
};

/**
 * Create trend indicator HTML
 * @param {number} value - Trend value
 * @param {string} label - Trend label
 * @returns {string}
 */
function createTrendIndicator(value, label) {
    if (value === 0 || isNaN(value)) return '';

    const isPositive = value > 0;
    const arrow = isPositive ? '↑' : '↓';
    const className = isPositive ? 'positive' : 'negative';
    const displayValue = isPositive ? `+${value}` : value;

    return `
    <div class="metric-card-trend ${className}">
      ${arrow} ${label}
    </div>
  `;
}

/**
 * Create a single metric card
 * @param {Object} config
 * @returns {string}
 */
function createMetricCard({ icon, value, label, sublabel, trend, trendLabel }) {
    return `
    <div class="metric-card">
      <div class="metric-card-icon">${icon}</div>
      <div class="metric-card-value">${value}</div>
      <div class="metric-card-label">${label}</div>
      ${sublabel ? `<div class="metric-card-sublabel">${sublabel}</div>` : ''}
      ${trend !== undefined ? createTrendIndicator(trend, trendLabel) : ''}
    </div>
  `;
}

/**
 * Create all dashboard metric cards
 * @returns {string}
 */
function createMetricCards() {
    const matches = getFilteredMatches();

    const winRate = calculateWinRate(matches);
    const avgKda = calculateAverageKda(matches);
    const bestRole = getBestRole(matches);
    const weekly = calculateWeeklyStats(matches);

    const cards = [
        {
            icon: icons.winrate,
            value: `${winRate.rate}%`,
            label: 'Win Rate',
            sublabel: `${winRate.wins}V / ${winRate.losses}D`,
            trend: weekly.trend.winRate,
            trendLabel: 'Bom'
        },
        {
            icon: icons.kda,
            value: avgKda.ratio,
            label: 'KDA Médio',
            sublabel: `${avgKda.kills}/${avgKda.deaths}/${avgKda.assists}`,
            trend: parseFloat(avgKda.ratio) >= 3 ? 1 : 0,
            trendLabel: 'Bom'
        },
        {
            icon: icons.matches,
            value: matches.length.toLocaleString(),
            label: 'Partidas Jogadas',
            sublabel: `${weekly.thisWeek.matches} essa semana`,
            trend: weekly.trend.matches,
            trendLabel: 'Bom'
        },
        {
            icon: icons.role,
            value: bestRole.name || 'N/A',
            label: 'Melhor Função',
            sublabel: `${bestRole.winRate}% WR`,
            trend: bestRole.winRate >= 50 ? 1 : 0,
            trendLabel: 'Bom'
        }
    ];

    return `
    <div class="dashboard-metrics">
      ${cards.map(card => createMetricCard(card)).join('')}
    </div>
  `;
}

/**
 * Update metric cards with current data
 * @param {HTMLElement} container
 */
function updateMetricCards(container) {
    container.innerHTML = createMetricCards();
}

export { createMetricCards, updateMetricCards };
