# workday-dota-report
Relatórios das jogatinas dele, dentro do horário de trabalho.

Apenas aceita contribuições por VIBE CODING

## Histórico de Versões

### v2.0.0 - Evolution Dashboard (SPA)
_Migração completa para Single Page Application com foco em analytics e UX moderna._

- **Arquitetura & Tech Stack**
  - Migração de PHP para **Vanilla JS SPA** (sem backend necessário).
  - Integração direta com **OpenDota API** via browser.
  - Implementação de **Clean Architecture** (Service, Domain, Presentation Layers).
  - Sistema de **Cache LocalStorage** com TTL para otimização de requisições.

- **Dashboard & UX**
  - Nova interface **Dark Mode** inspirada em dashboards profissionais (eSports).
  - **Sidebar de Navegação** responsiva.
  - **Cards de Métricas** (Win Rate, KDA, Partidas, Melhor Função) com indicadores de tendência.
  - **Gráfico de Radar** para visualização de estilo de jogo (Luta, Farm, Suporte, etc).
  - Painel de **Smart Insights** com dicas automáticas baseadas no desempenho.

- **Funcionalidades de Partida**
  - **Filtro Global de Horário Comercial**: Alternância instantânea entre "Remunerado" (09h-18h) e "Todas".
  - **Histórico de Partidas**: Lista com filtros (Ranked, Normal, Turbo) e busca por herói/ID.
  - **Detalhes da Partida**: Gráfico de Vantagem de Ouro, Placar Detalhado e Tabs de navegação.
