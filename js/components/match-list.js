/**
 * Match List Component
 * Displays match history with filtering and search
 */

import { getFilteredMatches, getFilterMode, setFilterMode } from '../state.js';
import { navigate } from '../router.js';

/**
 * Format KDA for display
 * @param {Object} kda
 * @returns {string}
 */
function formatKda(kda) {
    return `${kda.kills}/${kda.deaths}/${kda.assists}`;
}

/**
 * Create match row HTML
 * @param {Object} match - Normalized match
 * @returns {string}
 */
function createMatchRow(match) {
    const resultClass = match.result === 'win' ? 'badge-win' : 'badge-loss';
    const resultText = match.result === 'win' ? 'Vitória' : 'Derrota';
    const mmrClass = match.mmrChange > 0 ? 'positive' : match.mmrChange < 0 ? 'negative' : '';
    const mmrText = match.mmrChange ? (match.mmrChange > 0 ? `+${match.mmrChange}` : match.mmrChange) : '';

    return `
    <div class="match-row" data-match-id="${match.id}">
      <div class="match-hero-icon">
        ${match.heroImage ? `<img src="${match.heroImage}" alt="${match.heroName}">` : ''}
      </div>
      <div class="match-info">
        <div class="match-hero-name">
          ${match.heroName}
          <span class="badge ${resultClass}">${resultText}</span>
        </div>
        <div class="match-meta">${match.gameMode} • ${match.relativeTime}</div>
      </div>
      <div class="match-kda">
        <div class="match-kda-value">${formatKda(match.kda)}</div>
        <div class="match-kda-label">K/D/A</div>
      </div>
      <div class="match-duration">
        <div class="match-duration-value">${match.duration.formatted}</div>
        <div class="match-duration-label">DURAÇÃO</div>
      </div>
      <div class="match-mmr ${mmrClass}">${mmrText}</div>
      <div class="match-arrow">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </div>
  `;
}

/**
 * Create filter tabs HTML
 * @param {string} activeFilter
 * @returns {string}
 */
function createFilterTabs(activeFilter = 'todos') {
    const filters = [
        { id: 'todos', label: 'Todos' },
        { id: 'ranked', label: 'Ranked' },
        { id: 'normal', label: 'Normal' },
        { id: 'turbo', label: 'Turbo' }
    ];

    return `
    <div class="filter-tabs" id="match-type-filters">
      ${filters.map(f => `
        <button class="filter-tab ${activeFilter === f.id ? 'active' : ''}" data-filter="${f.id}">
          ${f.label}
        </button>
      `).join('')}
    </div>
  `;
}

/**
 * Create search input HTML
 * @returns {string}
 */
function createSearchInput() {
    return `
    <div class="search-input">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input type="text" id="match-search" placeholder="Buscar herói ou Match ID...">
    </div>
  `;
}

/**
 * Create workday toggle HTML
 * @returns {string}
 */
function createWorkdayToggle() {
    const mode = getFilterMode();

    return `
    <div class="toggle-group" id="workday-toggle">
      <button class="toggle-option ${mode === 'remunerado' ? 'active' : ''}" data-mode="remunerado">
        Remunerado
      </button>
      <button class="toggle-option ${mode === 'todas' ? 'active' : ''}" data-mode="todas">
        Todas
      </button>
    </div>
  `;
}

/**
 * Create advanced filters button
 * @returns {string}
 */
function createAdvancedFiltersButton() {
    return `
    <button class="filter-tab" id="advanced-filters-btn">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
      </svg>
      Filtros Avançados
    </button>
  `;
}

/**
 * Create full match list HTML
 * @param {Array} matches
 * @param {Object} options
 * @returns {string}
 */
function createMatchList(matches, options = {}) {
    const { showSearch = true, showFilters = true, limit = 50 } = options;
    const displayMatches = matches.slice(0, limit);

    return `
    ${showFilters ? `
      <div class="matches-filters">
        <div class="matches-search">
          ${showSearch ? createSearchInput() : ''}
        </div>
        <div class="flex gap-4 items-center">
          ${createFilterTabs()}
          ${createAdvancedFiltersButton()}
        </div>
      </div>
    ` : ''}
    
    <div class="matches-list" id="matches-list">
      ${displayMatches.length > 0
            ? displayMatches.map(m => createMatchRow(m)).join('')
            : `<div class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <h3>Nenhuma partida encontrada</h3>
            <p>Tente ajustar os filtros ou jogar mais partidas.</p>
          </div>`
        }
    </div>
    
    ${displayMatches.length < matches.length ? `
      <div class="text-center mt-6">
        <button class="filter-tab" id="load-more-btn">
          Carregar mais (${matches.length - displayMatches.length} restantes)
        </button>
      </div>
    ` : ''}
  `;
}

/**
 * Create compact activity list for dashboard
 * @param {Array} matches
 * @param {number} limit
 * @returns {string}
 */
function createActivityList(matches, limit = 5) {
    const recent = matches.slice(0, limit);

    return `
    <div class="panel">
      <div class="panel-header">
        <h3 class="panel-title">Atividade Recente</h3>
        <a href="#/partidas" class="panel-link">Ver tudo &gt;</a>
      </div>
      <div class="panel-content">
        ${recent.map(match => `
          <div class="activity-item" data-match-id="${match.id}">
            <div class="activity-hero-icon">
              ${match.heroImage ? `<img src="${match.heroImage}" alt="${match.heroName}">` : 'IMG'}
            </div>
            <div class="activity-info">
              <div class="activity-hero-name">
                ${match.heroName}
                <span class="badge ${match.result === 'win' ? 'badge-win' : 'badge-loss'}">
                  ${match.result === 'win' ? 'Vitória' : 'Derrota'}
                </span>
              </div>
              <div class="activity-meta">${match.gameMode} • ${match.relativeTime}</div>
            </div>
            <div class="activity-stats">
              <div class="activity-kda">${formatKda(match.kda)}</div>
              <div class="activity-duration">${match.duration.formatted}</div>
            </div>
            <div class="activity-arrow">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Initialize match list event handlers
 * @param {HTMLElement} container
 */
function initMatchListEvents(container) {
    // Click on match row
    container.addEventListener('click', (e) => {
        const row = e.target.closest('.match-row, .activity-item');
        if (row) {
            const matchId = row.dataset.matchId;
            navigate(`/partidas/${matchId}`);
        }
    });

    // Type filter tabs
    const typeFilters = container.querySelector('#match-type-filters');
    if (typeFilters) {
        typeFilters.addEventListener('click', (e) => {
            const btn = e.target.closest('.filter-tab');
            if (btn) {
                const filter = btn.dataset.filter;

                // Update active state
                typeFilters.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Apply filter
                filterMatchList(filter);
            }
        });
    }

    // Search input
    const searchInput = container.querySelector('#match-search');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                searchMatchList(e.target.value);
            }, 300);
        });
    }

    // Workday toggle
    const workdayToggle = container.querySelector('#workday-toggle');
    if (workdayToggle) {
        workdayToggle.addEventListener('click', (e) => {
            const btn = e.target.closest('.toggle-option');
            if (btn) {
                setFilterMode(btn.dataset.mode);

                // Update active state
                workdayToggle.querySelectorAll('.toggle-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
        });
    }
}

// Current filter state
let currentTypeFilter = 'todos';
let currentSearch = '';

/**
 * Filter match list by type
 * @param {string} type
 */
function filterMatchList(type) {
    currentTypeFilter = type;
    updateMatchList();
}

/**
 * Search match list
 * @param {string} query
 */
function searchMatchList(query) {
    currentSearch = query.toLowerCase();
    updateMatchList();
}

/**
 * Update match list with current filters
 */
function updateMatchList() {
    let matches = getFilteredMatches();

    // Apply type filter
    if (currentTypeFilter !== 'todos') {
        matches = matches.filter(m => m.type === currentTypeFilter);
    }

    // Apply search
    if (currentSearch) {
        matches = matches.filter(m =>
            m.heroName.toLowerCase().includes(currentSearch) ||
            String(m.id).includes(currentSearch)
        );
    }

    // Update list
    const listEl = document.getElementById('matches-list');
    if (listEl) {
        if (matches.length > 0) {
            listEl.innerHTML = matches.slice(0, 50).map(m => createMatchRow(m)).join('');
        } else {
            listEl.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <h3>Nenhuma partida encontrada</h3>
          <p>Tente ajustar os filtros ou buscar outro termo.</p>
        </div>
      `;
        }
    }
}

export {
    createMatchRow,
    createMatchList,
    createActivityList,
    createWorkdayToggle,
    initMatchListEvents,
    filterMatchList,
    searchMatchList
};
