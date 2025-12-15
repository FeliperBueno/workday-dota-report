/**
 * Dashboard Page
 * Main dashboard with metrics, insights, and recent activity
 */

import { createMetricCards } from '../components/cards.js';
import { createRadarChartPanel, initRadarChart } from '../components/charts.js';
import { createActivityList, createWorkdayToggle, initMatchListEvents } from '../components/match-list.js';
import { generateInsights } from '../domain/insights.js';
import { getFilteredMatches, subscribe, getFilterMode, setFilterMode } from '../state.js';

/**
 * Create insights panel HTML
 * @returns {string}
 */
function createInsightsPanel() {
    const matches = getFilteredMatches();
    const insights = generateInsights(matches);

    const typeIcons = {
        warning: 'warning',
        success: 'success',
        info: 'info'
    };

    return `
    <div class="panel">
      <div class="panel-header">
        <h3 class="panel-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          Smart Insights
        </h3>
      </div>
      <div class="panel-content">
        ${insights.map(insight => `
          <div class="insight-item">
            <div class="insight-icon ${typeIcons[insight.type] || 'info'}"></div>
            <div class="insight-content">
              <h4>${insight.title}</h4>
              <p>${insight.message}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Render dashboard page
 * @param {HTMLElement} container
 */
function renderDashboard(container) {
    const matches = getFilteredMatches();

    container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Dashboard</h1>
      <div class="page-actions">
        ${createWorkdayToggle()}
      </div>
    </div>
    
    <div id="metrics-container">
      ${createMetricCards()}
    </div>
    
    <div class="dashboard-grid">
      <div id="radar-panel">
        ${createRadarChartPanel()}
      </div>
      <div id="insights-panel">
        ${createInsightsPanel()}
      </div>
    </div>
    
    <div class="dashboard-recent" id="activity-panel">
      ${createActivityList(matches)}
    </div>
  `;

    // Initialize charts
    setTimeout(() => {
        initRadarChart();
    }, 0);

    // Initialize event handlers
    initMatchListEvents(container);
    initWorkdayToggle(container);

    // Subscribe to state changes
    const unsubscribe = subscribe(() => {
        updateDashboard();
    });

    // Return cleanup function
    return unsubscribe;
}

/**
 * Initialize workday toggle event handler
 * @param {HTMLElement} container
 */
function initWorkdayToggle(container) {
    const toggle = container.querySelector('#workday-toggle');
    if (toggle) {
        toggle.addEventListener('click', (e) => {
            const btn = e.target.closest('.toggle-option');
            if (btn && btn.dataset.mode) {
                setFilterMode(btn.dataset.mode);

                // Update active states
                toggle.querySelectorAll('.toggle-option').forEach(b => {
                    b.classList.toggle('active', b.dataset.mode === btn.dataset.mode);
                });
            }
        });
    }
}

/**
 * Update dashboard data
 */
function updateDashboard() {
    const matches = getFilteredMatches();

    // Update metrics
    const metricsContainer = document.getElementById('metrics-container');
    if (metricsContainer) {
        metricsContainer.innerHTML = createMetricCards();
    }

    // Update insights
    const insightsPanel = document.getElementById('insights-panel');
    if (insightsPanel) {
        insightsPanel.innerHTML = createInsightsPanel();
    }

    // Update activity list
    const activityPanel = document.getElementById('activity-panel');
    if (activityPanel) {
        activityPanel.innerHTML = createActivityList(matches);
    }

    // Update radar chart
    initRadarChart();

    // Update toggle state
    const toggle = document.querySelector('#workday-toggle');
    if (toggle) {
        const mode = getFilterMode();
        toggle.querySelectorAll('.toggle-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
    }
}

export { renderDashboard };
