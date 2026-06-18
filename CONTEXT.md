# 📄 Dossiê Técnico e Contexto - Minhas Finanças Pro

## 1. Visão Geral e Stack Tecnológica
O "Minhas Finanças Pro" é uma SPA (Single Page Application) focada na gestão financeira pessoal, operando estritamente no client-side (browser).
* **Linguagem:** Vanilla JavaScript (ES6+). Sem frameworks pesados (React/Vue/Angular).
* **Estilização:** Tailwind CSS (via script CDN) com suporte robusto a Dark/Light mode e design responsivo.
* **Gráficos:** Chart.js para visualização de dados.
* **Ícones:** FontAwesome.
* **Arquitetura:** Padrão Modular com injeção no escopo global (`window.Modulo`), utilizando um padrão *Observer* simples (`subscribe`/`notify`) no `DataService` para reatividade.

## 2. Estrutura de Diretórios e Módulos (Arquitetura)
O código está logicamente separado entre lógica de negócio (Core) e visualização de ecrãs (Modules).

### 📁 `js/core/` (Lógica e Dados)
* `Config.js` (`AppParams`): Centraliza constantes. Define URLs do Google Sheets, paleta de cores das categorias, meses, trimestres e padrões de strings a serem ignorados no parser.
* `DataService.js`: O coração da aplicação. Faz o fetch (TSV), parse de dados brutos (bancos), calcula períodos fiscais, gere o cache e processa a inteligência de dados (ex: Pareto, Heatmap, Projeções).
* `UI.js`: Gestor de interface global. Alterna abas principais, controla temas, aplica o blur de "Modo Privacidade" e resgata cores de categorias (`getCategoryColor`).
* `Utils.js`: Funções puras utilitárias (formatação de moeda `Intl.NumberFormat`, seleção limpa de DOM).
* `ChartManager.js`: *Wrapper* do Chart.js. Responsável por criar, configurar (cores, grids) e destruir instâncias de gráficos (evitando memory leaks).
* `AppState.js`: Guarda o estado global da sessão (anos selecionados, status do dark mode).

### 📁 `js/modules/` (Controladores de Views)
* `Dashboard.js`: Renderiza a aba Resumo (Cards principais, Pareto Comparativo, Heatmap com cores por categoria dominante, Transações Recentes).
* `Report.js`: Renderiza a aba Relatórios (Gráficos de fluxo de caixa, Projeção Holt-Winters).
* `Compare.js`: Aba Comparativo (Mês A vs Mês B com sliders de tempo).
* `Goals.js`: Aba Metas (Cálculo de Runway/Cobertura de Emergência e acompanhamento do progresso das metas).
* `Tables.js`: Aba Dados (Auditoria cruzada do mês fiscal e listagem bruta de extratos por banco).

## 3. Fluxo de Dados (Ingestão, Tratamento e Cache)
A aplicação não possui um backend tradicional. Usa uma arquitetura baseada em folhas de cálculo públicas.

1. **Ingestão (Input):** Os dados são lidos a partir de URLs públicas do Google Sheets em formato TSV (Tab-Separated Values). As planilhas contêm extratos do Bradesco, Santander (Conta), Santander (Cartão) e Metas.
2. **Fetch & Proxy:** O `DataService` tenta buscar via `fetch` direto. Se falhar (CORS), utiliza um proxy de fallback (`api.allorigins.win`).
3. **Parser:** O sistema tenta usar um Web Worker (`parser.worker.js`) para não travar a UI ao processar grandes volumes de texto. Se o Worker falhar, faz o parse na Main Thread usando Regex simples e quebra de linhas/tabs.
4. **Mês Fiscal (Regra de Negócio Crítica):** Os dados não são agrupados do dia 1 ao 30/31. A função `getFiscalPeriod()` define que o mês financeiro vai do **dia 16 do mês anterior ao dia 15 do mês vigente**.
5. **Cache:** Após o parse, os dados são hidratados (strings viram objetos `Date`) e salvos no `localStorage` (`finance_cache`) com um TTL (Time-to-Live) de 10 minutos. Isto minimiza as requisições à API do Google.

## 4. UI: Estrutura, Navegação e Interatividade
A interface é baseada em "Views" (secções do HTML ocultadas/exibidas com a classe `.hidden`).

* **Menus Principais (Abas):** Controladas pelo `UI.switchTab(tabName)`. As abas válidas são `dashboard`, `report`, `compare`, `goals` e `data`.
* **Secção Dados (`#view-data`):** Estrutura unificada com submenus (`audit`, `bradesco`, `santander-acc`, `santander-card`) controlados por `Tables.switchSubTab()`.
* **Botões Utilitários (Header):**
  * *Privacidade (`togglePrivacy`):* Adiciona a classe `privacy-active` no body, aplicando `blur(6px)` nos elementos com a classe `.val-privacy`.
  * *Tema (`toggleTheme`):* Alterna a classe `dark` no root HTML.

## 5. Categorização, Formatação e Cores
O sistema possui uma forte ênfase visual de "semáforo" e mapas de cor associados a categorias.

* **Categorias Base:** 'Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Outros', 'Salário', 'Freelance', 'Investimento'.
* **Paleta de Cores (Tailwind):** Controlada por `UI.getCategoryColor(categoria)`.
  * *Receitas/Positivos:* Emerald (`text-emerald-600`, `bg-emerald-500`).
  * *Despesas/Negativos:* Rose (`text-rose-600`, `bg-rose-500`).
  * *Saldos/Neutros:* Blue/Indigo (`text-blue-600`, `bg-indigo-500`).
* **Tratamento Monetário:** `Utils.formatCurrency(val)` utiliza `Intl.NumberFormat('pt-BR')`.

## 6. Lógicas de Negócio Críticas (Core Features)
* **Heatmap (Dashboard):** Mostra os dias do mês. A cor de cada dia não é fixa; é determinada pela *categoria onde se gastou mais* naquele dia (`topCat`), gerida pelo `DataService.getDashboardStats`.
* **Princípio de Pareto Comparativo (Dashboard):** Destaca as categorias responsáveis por 80% dos gastos do mês. Mostra uma barra de progresso do gasto atual versus uma linha de referência (limite), que é a **média de gastos dessa categoria nos últimos 3 meses**.
* **Auditoria de Dados (Tables):** Mostra exatamente as transações que compõem o resumo financeiro do mês (filtrando o período fiscal e ignorando transações da *ignorePatterns* listadas no `Config.js`).
* **Runway/Cobertura (Goals):** Calcula quantos meses o utilizador sobrevive com o saldo atual mantendo a média de gastos dos últimos 6 meses.

## 7. Diretrizes para a IA (Como evoluir este código)
Ao propor novas implementações para este projeto, a IA deve observar o seguinte:
1. **Evitar Quebras Estruturais:** Manter a injeção de dependências global (`window.NomeDoModulo`) a não ser que seja explicitamente pedida uma refatoração total para ES Modules (`import/export`).
2. **Seguir o Fluxo Atual:** Modificações nos dados devem ser processadas no `DataService.js`, a UI deve ser gerida pelo HTML template strings dos módulos (`Dashboard.js`, etc.) e o CSS deve focar-se exclusivamente em classes utilitárias do Tailwind CSS.
3. **Foco na Segurança:** Tratar os dados provenientes do Google Sheets com cuidado ao injetar via `innerHTML` para evitar potenciais vulnerabilidades de XSS (Cross-Site Scripting).
4. **Performance DOM:** Priorizar o uso de lógicas que evitem *reflows* excessivos no DOM quando forem criados componentes dinâmicos grandes.