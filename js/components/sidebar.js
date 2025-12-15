/**
 * Sidebar Component
 * Navigation with logo, menu items, and player profile
 */

import { navigate, getCurrentRoute } from '../router.js';
import { getPlayerData, getFilterMode, toggleFilterMode, subscribe } from '../state.js';

// SVG Icons
const icons = {
    dashboard: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
    matches: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    heroes: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    trends: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
    settings: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
};

// Menu items
const menuItems = [
    { path: '/', label: 'Dashboard', icon: icons.dashboard },
    { path: '/partidas', label: 'Partidas', icon: icons.matches },
    { path: '/herois', label: 'Heróis', icon: icons.heroes },
    { path: '/meta-trends', label: 'Meta Trends', icon: icons.trends }
];

/**
 * Create sidebar HTML
 * @returns {string}
 */
function createSidebar() {
    const player = getPlayerData();
    const currentRoute = getCurrentRoute();
    const currentPath = window.location.hash.replace('#', '') || '/';

    const playerName = player?.profile?.personaname || 'ProPlayer_01';
    const playerRank = player?.rank_tier ? `Divine ${player.rank_tier % 10}` : 'Rank Unknown';
    const avatarInitial = playerName.charAt(0).toUpperCase();

    return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        <div class="sidebar-logo-icon">ez</div>
        <span class="sidebar-logo-text">ezDota</span>
      </div>
      
      <nav class="sidebar-nav">
        ${menuItems.map(item => `
          <a href="#${item.path}" 
             class="sidebar-nav-item ${currentPath === item.path ? 'active' : ''}"
             data-path="${item.path}">
            ${item.icon}
            <span>${item.label}</span>
          </a>
        `).join('')}
      </nav>
      
      <div class="sidebar-footer">
        <a href="#/configuracoes" 
           class="sidebar-nav-item ${currentPath === '/configuracoes' ? 'active' : ''}"
           data-path="/configuracoes">
          ${icons.settings}
          <span>Configurações</span>
        </a>
        
        <div class="sidebar-player">
          <div class="sidebar-player-avatar">${avatarInitial}</div>
          <div class="sidebar-player-info">
            <div class="sidebar-player-name">${playerName}</div>
            <div class="sidebar-player-rank">${playerRank}</div>
          </div>
        </div>
      </div>
    </aside>
  `;
}

/**
 * Update active menu item
 * @param {string} path
 */
function updateActiveMenuItem(path) {
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
        const itemPath = item.dataset.path;
        if (itemPath === path) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

/**
 * Initialize sidebar
 * @param {HTMLElement} container
 */
function initSidebar(container) {
    container.innerHTML = createSidebar();

    // Update on state change
    subscribe(() => {
        const player = getPlayerData();
        if (player) {
            const nameEl = container.querySelector('.sidebar-player-name');
            const avatarEl = container.querySelector('.sidebar-player-avatar');
            if (nameEl && player.profile?.personaname) {
                nameEl.textContent = player.profile.personaname;
                avatarEl.textContent = player.profile.personaname.charAt(0).toUpperCase();
            }
        }
    });
}

export { createSidebar, initSidebar, updateActiveMenuItem };
