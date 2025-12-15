Workday Dota Dashboard - Implementation Plan
Complete evolution of the workday-dota-report project from a single PHP script into a modern, production-ready analytical dashboard for tracking Dota 2 performance.

User Review Required
IMPORTANT

Technology Decision: I recommend building this as a vanilla HTML/CSS/JavaScript SPA (no PHP) for maximum simplicity and GitHub Pages compatibility. The OpenDota API is CORS-enabled and can be called directly from the browser. This eliminates server requirements entirely.

WARNING

Workday Filter: The current implementation uses server timezone. The new implementation will use the browser's local timezone for more accurate local business hours detection. Please confirm the default workday hours: 09:00-18:00, Monday-Friday.

Reference Images
The following mockups define the visual and structural requirements:

Dashboard Main View
Review
Dashboard Main View

Proposed Architecture
Service Layer
Domain Layer
Presentation Layer
UI Components
Router/Navigation
Global State
Analytics Engine
Insights Generator
Domain Models
OpenDota API Service
Cache Manager
Data Transformers
Proposed Changes
Project Structure
workday-dota-report/
├── index.html              # Main entry point
├── css/
│   ├── design-system.css   # Variables, tokens, utilities
│   ├── components.css      # Reusable component styles
│   └── pages.css           # Page-specific layouts
├── js/
│   ├── services/
│   │   ├── api.js          # OpenDota API wrapper
│   │   └── cache.js        # LocalStorage cache layer
│   ├── domain/
│   │   ├── models.js       # Data normalization
│   │   ├── analytics.js    # Stats calculation
│   │   └── insights.js     # Smart insights generation
│   ├── components/
│   │   ├── sidebar.js      # Navigation sidebar
│   │   ├── cards.js        # Metric cards
│   │   ├── charts.js       # Chart components
│   │   └── match-list.js   # Match history list
│   ├── pages/
│   │   ├── dashboard.js    # Main dashboard
│   │   ├── matches.js      # Match history
│   │   └── match-detail.js # Single match view
│   ├── router.js           # SPA navigation
│   ├── state.js            # Global state management
│   └── main.js             # App bootstrap
└── assets/                 # Generated images/icons
Service Layer
[NEW] 
api.js
OpenDota API wrapper with automatic caching:

getPlayer(accountId) → /players/{account_id}
getMatches(accountId, limit) → /players/{account_id}/matches
getMatchDetails(matchId) → /matches/{match_id}
getHeroes() → /heroes
getHeroStats() → /heroStats
[NEW] 
cache.js
LocalStorage-based cache with TTL:

Match list: 5 min TTL
Match details: 24h TTL (immutable data)
Heroes/static: 7 days TTL
Domain Layer
[NEW] 
models.js
Normalized data models:

// Match model
{
  id, heroId, heroName, heroImage,
  result: 'win' | 'loss',
  kda: { kills, deaths, assists, ratio },
  duration: { seconds, formatted },
  mode: 'ranked' | 'normal' | 'turbo',
  mmrChange: number | null,
  timestamp, localTime, isWorkday
}
[NEW] 
analytics.js
Calculate aggregated stats:

Win rate (overall and by role/hero)
Average KDA
Most played heroes/roles
Performance trends over time
Gold advantage data extraction
[NEW] 
insights.js
Smart insights with simple rules:

Low farm detection (last hits below rank average)
Hero synergies (win rate with specific allies)
Warding efficiency (ward duration comparison)
Streak analysis
UI Components
[NEW] 
sidebar.js
Left sidebar navigation:

Logo (ezDota style)
Dashboard, Partidas, Heróis, Meta Trends links
Configurações
Player profile display at bottom
[NEW] 
cards.js
Metric cards component:

Win Rate with trend indicator
KDA with rank percentile
Matches played with weekly count
Best Role with lane icon
[NEW] 
charts.js
Chart components using Canvas API:

Radar chart for play style (Luta, Versatilidade, Farm, Suporte, Push)
Line chart for gold advantage over time
Pages
[NEW] 
dashboard.js
Main dashboard with:

4 metric cards at top
Play style radar chart
Smart insights panel
Recent activity list (5 last matches)
[NEW] 
matches.js
Match history with:

Filter tabs (Todos, Ranked, Normal, Turbo)
Search bar (hero name or match ID)
Paginated match list
Each row: hero icon, name, result badge, KDA, duration, MMR change
[NEW] 
match-detail.js
Match detail view with:

Header: Radiant vs Dire scores, duration, match ID
Tabs: Visão Geral, Gráficos, Performance, Builds
Gold advantage chart with timeline
Global Features
[NEW] 
state.js
Global state with:

workdayFilter: 'remunerado' | 'todas' — toggle that affects all views
Workday hours config (default: 09:00-18:00, Mon-Fri)
Timezone detection from browser
[NEW] 
router.js
Hash-based SPA router:

#/ → Dashboard
#/partidas → Match History
#/partidas/:id → Match Detail
#/herois → Heroes (placeholder)
#/configuracoes → Settings (placeholder)
Design System
[NEW] 
design-system.css
CSS variables and tokens matching mockups:

:root {
  /* Background colors */
  --bg-primary: #0f1419;
  --bg-secondary: #1a1f2a;
  --bg-card: #1e2530;
  --bg-sidebar: #141920;
  
  /* Accent colors */
  --accent-primary: #00d4aa;
  --accent-secondary: #4fd1c5;
  --color-win: #22c55e;
  --color-loss: #ef4444;
  
  /* Typography */
  --font-family: 'Inter', system-ui, sans-serif;
}
Legacy File
[DELETE] 
rg.php
The PHP file will be deprecated once the new SPA is complete. It can be kept temporarily for reference or removed after validation.

Verification Plan
Browser Testing
Start a local server:

cd /home/bueno/personal/workday-dota-report/workday-dota-report && python3 -m http.server 8080
Test the following flows in the browser:

Dashboard loads: Navigate to http://localhost:8080 and verify metrics cards appear with real data
Workday toggle: Click the toggle to switch between "Remunerado" and "Todas" — all metrics should update
Match history: Navigate to Partidas and verify match list loads with filtering options
Match detail: Click any match to view the detail page with gold advantage chart
Navigation: Test all sidebar links respond correctly
Manual Verification Checklist
Please confirm these items work after implementation:

Check	Description
☐	Dashboard displays Win Rate, KDA, Matches, Best Role cards
☐	Radar chart shows play style visualization
☐	Smart Insights section displays at least one insight
☐	Recent Activity shows 5 most recent matches
☐	Workday toggle filters all data to business hours only
☐	Match history list paginates correctly
☐	Match type filters (Ranked/Normal/Turbo) work
☐	Match detail view shows gold advantage chart
☐	API calls are cached (visible in DevTools > Application > LocalStorage)
☐	No console errors on any page
