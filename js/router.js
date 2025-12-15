/**
 * SPA Router - Hash-based navigation
 */

// Route definitions
const routes = {
    '/': { page: 'dashboard', title: 'Dashboard' },
    '/partidas': { page: 'matches', title: 'Histórico de Partidas' },
    '/partidas/:id': { page: 'match-detail', title: 'Detalhes da Partida' },
    '/herois': { page: 'heroes', title: 'Heróis' },
    '/configuracoes': { page: 'settings', title: 'Configurações' }
};

// Current route
let currentRoute = null;
let routeParams = {};

// Route change listeners
const listeners = [];

/**
 * Parse hash to extract route and params
 * @param {string} hash
 * @returns {Object}
 */
function parseHash(hash) {
    const path = hash.replace('#', '') || '/';

    // Check for exact match first
    if (routes[path]) {
        return { route: routes[path], path, params: {} };
    }

    // Check for parameterized routes
    for (const [pattern, route] of Object.entries(routes)) {
        const paramMatch = pattern.match(/:(\w+)/);
        if (paramMatch) {
            const regex = new RegExp('^' + pattern.replace(/:(\w+)/, '([^/]+)') + '$');
            const match = path.match(regex);
            if (match) {
                return {
                    route,
                    path,
                    params: { [paramMatch[1]]: match[1] }
                };
            }
        }
    }

    // Default to dashboard
    return { route: routes['/'], path: '/', params: {} };
}

/**
 * Navigate to a path
 * @param {string} path
 */
function navigate(path) {
    window.location.hash = path;
}

/**
 * Get current route params
 * @returns {Object}
 */
function getParams() {
    return { ...routeParams };
}

/**
 * Get current route info
 * @returns {Object|null}
 */
function getCurrentRoute() {
    return currentRoute;
}

/**
 * Subscribe to route changes
 * @param {Function} listener
 * @returns {Function} Unsubscribe function
 */
function onRouteChange(listener) {
    listeners.push(listener);
    return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) listeners.splice(index, 1);
    };
}

/**
 * Handle route change
 */
function handleRouteChange() {
    const { route, path, params } = parseHash(window.location.hash);

    currentRoute = route;
    routeParams = params;

    // Update page title
    document.title = `${route.title} - ezDota`;

    // Notify listeners
    listeners.forEach(listener => listener(route, params));
}

/**
 * Initialize router
 */
function initRouter() {
    // Listen for hash changes
    window.addEventListener('hashchange', handleRouteChange);

    // Handle initial route
    handleRouteChange();
}

/**
 * Go back in history
 */
function goBack() {
    window.history.back();
}

export {
    navigate,
    getParams,
    getCurrentRoute,
    onRouteChange,
    initRouter,
    goBack
};
