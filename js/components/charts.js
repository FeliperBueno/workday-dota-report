/**
 * Chart Components
 * Canvas-based charts for data visualization
 */

import { calculatePlayStyle, getPerformanceOverTime } from '../domain/analytics.js';
import { getFilteredMatches } from '../state.js';

/**
 * Draw radar chart for play style
 * @param {HTMLCanvasElement} canvas
 * @param {Object} data - Play style data
 */
function drawRadarChart(canvas, data) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 40;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const labels = ['Luta', 'Versatilidade', 'Farm', 'Suporte', 'Push'];
    const values = [
        data.fighting / 100,
        data.versatility / 100,
        data.farming / 100,
        data.supporting / 100,
        data.pushing / 100
    ];
    const numPoints = labels.length;
    const angleStep = (Math.PI * 2) / numPoints;

    // Draw background circles
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        for (let j = 0; j <= numPoints; j++) {
            const angle = j * angleStep - Math.PI / 2;
            const r = radius * (i / 4);
            const x = centerX + r * Math.cos(angle);
            const y = centerY + r * Math.sin(angle);
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < numPoints; i++) {
        const angle = i * angleStep - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
        ctx.stroke();
    }

    // Draw data polygon
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0, 212, 170, 0.3)';
    ctx.strokeStyle = '#00d4aa';
    ctx.lineWidth = 2;

    for (let i = 0; i <= numPoints; i++) {
        const idx = i % numPoints;
        const angle = idx * angleStep - Math.PI / 2;
        const r = radius * values[idx];
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw data points
    ctx.fillStyle = '#00d4aa';
    for (let i = 0; i < numPoints; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const r = radius * values[i];
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';

    for (let i = 0; i < numPoints; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const labelRadius = radius + 25;
        const x = centerX + labelRadius * Math.cos(angle);
        const y = centerY + labelRadius * Math.sin(angle);
        ctx.fillText(labels[i], x, y + 4);
    }
}

/**
 * Draw gold advantage line chart
 * @param {HTMLCanvasElement} canvas
 * @param {Array} data - Gold advantage data per minute
 */
function drawGoldAdvantageChart(canvas, data) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (!data || data.length === 0) {
        ctx.fillStyle = '#64748b';
        ctx.font = '14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Sem dados disponíveis', width / 2, height / 2);
        return;
    }

    // Calculate scale
    const maxVal = Math.max(Math.abs(Math.min(...data)), Math.abs(Math.max(...data)), 1000);
    const yScale = chartHeight / (maxVal * 2);
    const xScale = chartWidth / (data.length - 1 || 1);

    // Draw zero line
    const zeroY = padding.top + chartHeight / 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding.left, zeroY);
    ctx.lineTo(width - padding.right, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Y axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'right';

    const yLabels = [maxVal, maxVal / 2, 0, -maxVal / 2, -maxVal];
    yLabels.forEach((val, i) => {
        const y = padding.top + (i * chartHeight / 4);
        ctx.fillText(Math.round(val).toLocaleString(), padding.left - 8, y + 4);
    });

    // Draw X axis labels
    ctx.textAlign = 'center';
    const xStep = Math.ceil(data.length / 10);
    for (let i = 0; i < data.length; i += xStep) {
        const x = padding.left + i * xScale;
        ctx.fillText(`${i}`, x, height - 10);
    }

    // Fill areas
    // Radiant (positive) area
    ctx.beginPath();
    ctx.moveTo(padding.left, zeroY);
    for (let i = 0; i < data.length; i++) {
        const x = padding.left + i * xScale;
        const y = zeroY - Math.max(0, data[i]) * yScale;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(padding.left + (data.length - 1) * xScale, zeroY);
    ctx.closePath();
    ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
    ctx.fill();

    // Dire (negative) area
    ctx.beginPath();
    ctx.moveTo(padding.left, zeroY);
    for (let i = 0; i < data.length; i++) {
        const x = padding.left + i * xScale;
        const y = zeroY - Math.min(0, data[i]) * yScale;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(padding.left + (data.length - 1) * xScale, zeroY);
    ctx.closePath();
    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.fill();

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = '#00d4aa';
    ctx.lineWidth = 2;
    for (let i = 0; i < data.length; i++) {
        const x = padding.left + i * xScale;
        const y = zeroY - data[i] * yScale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
}

/**
 * Create radar chart panel HTML
 * @returns {string}
 */
function createRadarChartPanel() {
    return `
    <div class="panel">
      <div class="panel-header">
        <h3 class="panel-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          Estilo de Jogo
        </h3>
      </div>
      <div class="panel-content" style="display: flex; justify-content: center;">
        <canvas id="radar-chart" width="280" height="280"></canvas>
      </div>
      <p class="text-sm text-secondary text-center p-4">
        Seu estilo é agressivo com foco em lutas (team fighting).
      </p>
    </div>
  `;
}

/**
 * Create gold advantage chart panel HTML
 * @param {string} title
 * @returns {string}
 */
function createGoldChartPanel(title = 'Vantagem de Ouro') {
    return `
    <div class="chart-container">
      <div class="chart-header">
        <h3 class="chart-title">${title}</h3>
        <div class="chart-legend">
          <div class="chart-legend-item">
            <span class="chart-legend-dot radiant"></span>
            Radiant
          </div>
          <div class="chart-legend-item">
            <span class="chart-legend-dot dire"></span>
            Dire
          </div>
        </div>
      </div>
      <canvas id="gold-chart" width="800" height="300"></canvas>
    </div>
  `;
}

/**
 * Initialize radar chart with data
 */
function initRadarChart() {
    const canvas = document.getElementById('radar-chart');
    if (!canvas) return;

    const matches = getFilteredMatches();
    const playStyle = calculatePlayStyle(matches);

    // Set canvas resolution for retina displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.getContext('2d').scale(dpr, dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    canvas.width = 280;
    canvas.height = 280;

    drawRadarChart(canvas, playStyle);
}

/**
 * Initialize gold chart with data
 * @param {Array} goldData
 */
function initGoldChart(goldData) {
    const canvas = document.getElementById('gold-chart');
    if (!canvas) return;

    drawGoldAdvantageChart(canvas, goldData);
}

export {
    createRadarChartPanel,
    createGoldChartPanel,
    initRadarChart,
    initGoldChart,
    drawRadarChart,
    drawGoldAdvantageChart
};
