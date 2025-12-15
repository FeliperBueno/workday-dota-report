/**
 * Main Entry Point
 * Application bootstrap and initialization
 */

import { initRouter, onRouteChange, navigate } from './router.js';
import { initialize, subscribe, isLoading, getError } from './state.js';
import { initSidebar, updateActiveMenuItem } from './components/sidebar.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderMatches } from './pages/matches.js';
import { renderMatchDetail } from './pages/match-detail.js';

// Page cleanup functions
let currentCleanup = null;

/**
 * Render the loading state
 * @param {HTMLElement} container
 */
function renderLoading(container) {
    container.innerHTML = `
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="spinner" style="margin: 0 auto 16px;"></div>
        <p class="text-secondary">Carregando dados...</p>
      </div>
    </div>
  `;
}

/**
 * Render error state
 * @param {HTMLElement} container
 * @param {Error} error
 */
function renderError(container, error) {
    container.innerHTML = `
    <div class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <h3>Erro ao carregar dados</h3>
      <p>${error.message}</p>
      <button class="filter-tab mt-4" onclick="location.reload()">Tentar novamente</button>
    </div>
  `;
}

/**
 * Render a page based on route
 * @param {Object} route
 * @param {Object} params
 */
async function renderPage(route, params) {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    // Cleanup previous page
    if (currentCleanup) {
        currentCleanup();
        currentCleanup = null;
    }

    // Check loading state
    if (isLoading()) {
        renderLoading(mainContent);
        return;
    }

    // Check error state
    const error = getError();
    if (error) {
        renderError(mainContent, error);
        return;
    }

    // Render page based on route
    switch (route.page) {
        case 'dashboard':
            currentCleanup = renderDashboard(mainContent);
            break;
        case 'matches':
            currentCleanup = renderMatches(mainContent);
            break;
        case 'match-detail':
            await renderMatchDetail(mainContent, params);
            break;
        case 'heroes':
            mainContent.innerHTML = `
        <div class="page-header">
          <h1 class="page-title">Heróis</h1>
        </div>
        <div class="empty-state">
          <h3>Em Desenvolvimento</h3>
          <p>Esta seção estará disponível em breve.</p>
        </div>
      `;
            break;
        case 'settings':
            mainContent.innerHTML = `
        <div class="page-header">
          <h1 class="page-title">Configurações</h1>
        </div>
        <div class="panel">
          <div class="panel-header">
            <h3 class="panel-title">Configurações de Horário Comercial</h3>
          </div>
          <div class="panel-content">
            <p class="text-secondary mb-4">Configure os horários considerados como "remunerado".</p>
            <div class="grid grid-cols-2 gap-4" style="max-width: 400px;">
              <div>
                <label class="text-sm text-secondary">Início</label>
                <input type="time" value="09:00" class="search-input w-full mt-2" style="width: 100%;">
              </div>
              <div>
                <label class="text-sm text-secondary">Fim</label>
                <input type="time" value="18:00" class="search-input w-full mt-2" style="width: 100%;">
              </div>
            </div>
            <p class="text-muted text-sm mt-4">Dias úteis: Segunda a Sexta</p>
          </div>
        </div>
      `;
            break;
        default:
            mainContent.innerHTML = `
        <div class="empty-state">
          <h3>Página não encontrada</h3>
          <p>A página que você procura não existe.</p>
        </div>
      `;
    }

    // Update sidebar active state
    const path = window.location.hash.replace('#', '') || '/';
    updateActiveMenuItem(path);
}

/**
 * Initialize the application
 */
async function initApp() {
    console.log('[App] Initializing...');

    // Initialize sidebar
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
        initSidebar(sidebarContainer);
    }

    // Show loading initially
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        renderLoading(mainContent);
    }

    // Initialize router
    initRouter();

    // Subscribe to route changes
    onRouteChange((route, params) => {
        renderPage(route, params);
    });

    // Subscribe to state changes (for loading/error states)
    subscribe((state) => {
        if (!state.loading) {
            const route = { page: 'dashboard' };
            const path = window.location.hash.replace('#', '') || '/';

            // Re-render current page when loading completes
            if (path === '/' || path === '') {
                renderPage({ page: 'dashboard' }, {});
            } else if (path === '/partidas') {
                renderPage({ page: 'matches' }, {});
            } else if (path.startsWith('/partidas/')) {
                const id = path.replace('/partidas/', '');
                renderPage({ page: 'match-detail' }, { id });
            }
        }
    });

    // Initialize state (load data)
    await initialize();

    console.log('[App] Initialized successfully');
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
