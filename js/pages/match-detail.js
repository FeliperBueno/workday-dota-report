/**
 * Match Detail Page
 * Detailed view of a single match
 */

import { getMatchDetails, getHeroStats } from '../services/api.js';
import { createHeroMap, normalizeMatchDetail } from '../domain/models.js';
import { createGoldChartPanel, initGoldChart } from '../components/charts.js';
import { goBack } from '../router.js';
import { getHeroMap, getPlayerData } from '../state.js';
import { DEFAULT_PLAYER_ID } from '../services/api.js';

/**
 * Create match header HTML
 * @param {Object} match - Normalized match detail
 * @returns {string}
 */
function createMatchHeader(match) {
    const radiantWin = match.radiantWin;
    const radiantBadge = radiantWin ? 'badge-win' : 'badge-loss';
    const direBadge = !radiantWin ? 'badge-win' : 'badge-loss';

    return `
    <div class="match-header">
      <div class="match-team radiant">
        <div class="match-team-name">Radiant</div>
        <div class="match-team-score">${match.radiantScore}</div>
        <span class="badge ${radiantBadge}">${radiantWin ? 'VITÓRIA' : 'DERROTA'}</span>
      </div>
      
      <div class="match-center">
        <div class="match-duration-large">${match.duration.formatted}</div>
        <div class="match-id">Match ID: ${match.id}</div>
        <div class="match-id">${match.gameMode} • ${match.lobbyType}</div>
      </div>
      
      <div class="match-team dire">
        <div class="match-team-name">Dire</div>
        <div class="match-team-score">${match.direScore}</div>
        <span class="badge ${direBadge}">${!radiantWin ? 'VITÓRIA' : 'DERROTA'}</span>
      </div>
    </div>
  `;
}

/**
 * Create match tabs HTML
 * @param {string} activeTab
 * @returns {string}
 */
function createMatchTabs(activeTab = 'overview') {
    const tabs = [
        { id: 'overview', label: 'Visão Geral' },
        { id: 'graphs', label: 'Gráficos' },
        { id: 'performance', label: 'Performance' },
        { id: 'builds', label: 'Builds' }
    ];

    return `
    <div class="tabs" id="match-tabs">
      ${tabs.map(tab => `
        <button class="tab ${activeTab === tab.id ? 'active' : ''}" data-tab="${tab.id}">
          ${tab.label}
        </button>
      `).join('')}
    </div>
  `;
}

/**
 * Create overview tab content
 * @param {Object} match
 * @returns {string}
 */
function createOverviewTab(match) {
    const radiantPlayers = match.players.filter(p => p.isRadiant);
    const direPlayers = match.players.filter(p => !p.isRadiant);

    return `
    <div class="grid grid-cols-2 gap-6">
      <div class="panel">
        <div class="panel-header">
          <h3 class="panel-title text-win">Radiant</h3>
        </div>
        <div class="panel-content">
          ${createPlayerList(radiantPlayers)}
        </div>
      </div>
      
      <div class="panel">
        <div class="panel-header">
          <h3 class="panel-title text-loss">Dire</h3>
        </div>
        <div class="panel-content">
          ${createPlayerList(direPlayers)}
        </div>
      </div>
    </div>
  `;
}

/**
 * Create player list for team
 * @param {Array} players
 * @returns {string}
 */
function createPlayerList(players) {
    return players.map(p => `
    <div class="activity-item" style="cursor: default;">
      <div class="activity-hero-icon">
        ${p.hero.image ? `<img src="${p.hero.image}" alt="${p.hero.name}">` : ''}
      </div>
      <div class="activity-info">
        <div class="activity-hero-name">${p.hero.name}</div>
        <div class="activity-meta">${p.name}</div>
      </div>
      <div class="activity-stats">
        <div class="activity-kda">${p.kills}/${p.deaths}/${p.assists}</div>
        <div class="activity-duration">${p.gpm} GPM</div>
      </div>
    </div>
  `).join('');
}

/**
 * Create graphs tab content
 * @param {Object} match
 * @returns {string}
 */
function createGraphsTab(match) {
    return createGoldChartPanel('Vantagem de Ouro');
}

/**
 * Create loading state
 * @returns {string}
 */
function createLoadingState() {
    return `
    <div class="match-detail">
      <div class="back-link" id="back-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Voltar para Histórico
      </div>
      
      <div class="match-header">
        <div class="skeleton" style="width: 100px; height: 100px;"></div>
        <div class="skeleton" style="width: 150px; height: 60px;"></div>
        <div class="skeleton" style="width: 100px; height: 100px;"></div>
      </div>
      
      <div class="skeleton" style="width: 100%; height: 300px; margin-top: 24px;"></div>
    </div>
  `;
}

/**
 * Create error state
 * @param {string} message
 * @returns {string}
 */
function createErrorState(message) {
    return `
    <div class="match-detail">
      <div class="back-link" id="back-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Voltar para Histórico
      </div>
      
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h3>Erro ao carregar partida</h3>
        <p>${message}</p>
      </div>
    </div>
  `;
}

/**
 * Render match detail page
 * @param {HTMLElement} container
 * @param {Object} params - Route params
 */
async function renderMatchDetail(container, params) {
    const matchId = params.id;

    // Show loading
    container.innerHTML = createLoadingState();
    initBackButton(container);

    try {
        // Fetch match details
        const rawMatch = await getMatchDetails(matchId);

        // Get hero map
        let heroMap = getHeroMap();
        if (!heroMap || heroMap.size === 0) {
            const heroStats = await getHeroStats();
            heroMap = createHeroMap(heroStats);
        }

        // Normalize
        const player = getPlayerData();
        const playerId = player?.profile?.account_id || DEFAULT_PLAYER_ID;
        const match = normalizeMatchDetail(rawMatch, heroMap, playerId);

        // Render full page
        container.innerHTML = `
      <div class="match-detail">
        <div class="back-link" id="back-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Voltar para Histórico
        </div>
        
        ${createMatchHeader(match)}
        ${createMatchTabs('graphs')}
        
        <div id="tab-content">
          ${createGraphsTab(match)}
        </div>
      </div>
    `;

        // Initialize
        initBackButton(container);
        initMatchTabs(container, match);

        // Draw chart
        setTimeout(() => {
            initGoldChart(match.goldAdvantage);
        }, 0);

    } catch (error) {
        console.error('Error loading match:', error);
        container.innerHTML = createErrorState(error.message);
        initBackButton(container);
    }
}

/**
 * Initialize back button
 * @param {HTMLElement} container
 */
function initBackButton(container) {
    const backBtn = container.querySelector('#back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            goBack();
        });
    }
}

/**
 * Initialize match tabs
 * @param {HTMLElement} container
 * @param {Object} match
 */
function initMatchTabs(container, match) {
    const tabsEl = container.querySelector('#match-tabs');
    const contentEl = container.querySelector('#tab-content');

    if (tabsEl && contentEl) {
        tabsEl.addEventListener('click', (e) => {
            const btn = e.target.closest('.tab');
            if (btn) {
                const tab = btn.dataset.tab;

                // Update active
                tabsEl.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                btn.classList.add('active');

                // Render content
                switch (tab) {
                    case 'overview':
                        contentEl.innerHTML = createOverviewTab(match);
                        break;
                    case 'graphs':
                        contentEl.innerHTML = createGraphsTab(match);
                        setTimeout(() => initGoldChart(match.goldAdvantage), 0);
                        break;
                    case 'performance':
                        contentEl.innerHTML = '<div class="empty-state"><p>Em desenvolvimento...</p></div>';
                        break;
                    case 'builds':
                        contentEl.innerHTML = '<div class="empty-state"><p>Em desenvolvimento...</p></div>';
                        break;
                }
            }
        });
    }
}

export { renderMatchDetail };
