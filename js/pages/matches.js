/**
 * Matches Page
 * Match history with filtering and search
 */

import { createMatchList, createWorkdayToggle, initMatchListEvents } from '../components/match-list.js';
import { getFilteredMatches, subscribe, getFilterMode, setFilterMode } from '../state.js';

/**
 * Render matches page
 * @param {HTMLElement} container
 */
function renderMatches(container) {
    const matches = getFilteredMatches();

    container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Histórico de Partidas</h1>
      <div class="page-actions">
        ${createWorkdayToggle()}
      </div>
    </div>
    
    <div id="match-list-container">
      ${createMatchList(matches)}
    </div>
  `;

    // Initialize event handlers
    initMatchListEvents(container);
    initPageWorkdayToggle(container);

    // Subscribe to state changes
    const unsubscribe = subscribe(() => {
        updateMatchesPage();
    });

    return unsubscribe;
}

/**
 * Initialize workday toggle for this page
 * @param {HTMLElement} container 
 */
function initPageWorkdayToggle(container) {
    const toggle = container.querySelector('#workday-toggle');
    if (toggle) {
        toggle.addEventListener('click', (e) => {
            const btn = e.target.closest('.toggle-option');
            if (btn && btn.dataset.mode) {
                setFilterMode(btn.dataset.mode);

                toggle.querySelectorAll('.toggle-option').forEach(b => {
                    b.classList.toggle('active', b.dataset.mode === btn.dataset.mode);
                });
            }
        });
    }
}

/**
 * Update matches page data
 */
function updateMatchesPage() {
    const matches = getFilteredMatches();

    const listContainer = document.getElementById('match-list-container');
    if (listContainer) {
        listContainer.innerHTML = createMatchList(matches);
        initMatchListEvents(listContainer);
    }

    // Update toggle state
    const toggle = document.querySelector('#workday-toggle');
    if (toggle) {
        const mode = getFilterMode();
        toggle.querySelectorAll('.toggle-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
    }
}

export { renderMatches };
