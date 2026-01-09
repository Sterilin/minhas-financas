const Dashboard = {
    init() {
        this.render();
        DataService.subscribe(() => this.render());
        document.addEventListener('tabChanged', (e) => {
            if (e.detail.tab === 'dashboard') this.render();
        });
    },

    getTemplate() {
        return `
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-lg font-semibold text-gray-700 dark:text-gray-200">Visão Geral (Mês Atual)</h2>
                <span class="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full font-medium" id="current-month-badge">Carregando...</span>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div class="bg-white p-5 rounded-xl card-shadow border-l-4 border-emerald-500 dark:bg-gray-800 transition-theme">
                    <div class="flex justify-between items-start">
                        <div><p class="text-sm text-gray-500 font-medium uppercase dark:text-gray-400">Ganhos Totais (Conta)</p><h3 class="text-2xl font-bold text-gray-800 mt-1 dark:text-white val-privacy" id="dash-total-income">...</h3></div>
                        <div class="bg-emerald-100 text-emerald-600 p-2 rounded-lg dark:bg-emerald-900/30 dark:text-emerald-400"><i class="fa-solid fa-arrow-trend-up"></i></div>
                    </div>
                    <p id="income-trend-container" class="text-xs mt-3 flex items-center text-gray-400"><i id="income-trend-icon" class="fa-solid fa-minus mr-1"></i> <span id="dash-income-trend">...</span> vs mês anterior</p>
                </div>

                <div class="bg-white p-5 rounded-xl card-shadow border-l-4 border-rose-500 dark:bg-gray-800 transition-theme">
                    <div class="flex justify-between items-start">
                        <div><p class="text-sm text-gray-500 font-medium uppercase dark:text-gray-400">Gastos Totais (Conta)</p><h3 class="text-2xl font-bold text-gray-800 mt-1 dark:text-white val-privacy" id="dash-total-expense">...</h3></div>
                        <div class="bg-rose-100 text-rose-600 p-2 rounded-lg dark:bg-rose-900/30 dark:text-rose-400"><i class="fa-solid fa-arrow-trend-down"></i></div>
                    </div>
                    <p id="expense-trend-container" class="text-xs mt-3 flex items-center text-gray-400"><i id="expense-trend-icon" class="fa-solid fa-minus mr-1"></i> <span id="dash-expense-trend">...</span> vs mês anterior</p>
                </div>

                <div class="bg-white p-5 rounded-xl card-shadow border-l-4 border-purple-500 dark:bg-gray-800 transition-theme">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-sm text-gray-500 font-medium uppercase dark:text-gray-400">Fatura Cartão</p>
                            <h3 class="text-2xl font-bold text-gray-800 mt-1 dark:text-white val-privacy" id="dash-card-invoice">...</h3>
                        </div>
                        <div class="bg-purple-100 text-purple-600 p-2 rounded-lg dark:bg-purple-900/30 dark:text-purple-400"><i class="fa-brands fa-cc-mastercard"></i></div>
                    </div>
                    <p class="text-xs text-gray-400 mt-2 dark:text-gray-500">Fatura Atual (16/M-1 a 15/M)</p>
                </div>

                <div class="bg-white p-5 rounded-xl card-shadow border-l-4 border-orange-400 dark:bg-gray-800 transition-theme">
                    <div class="flex justify-between items-start">
                        <div><p class="text-sm text-gray-500 font-medium uppercase dark:text-gray-400">Custo Fixo</p><h3 class="text-2xl font-bold text-gray-800 mt-1 dark:text-white val-privacy" id="dash-fixed-cost">...</h3><div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2"><div class="bg-orange-400 h-1.5 rounded-full" style="width: 70%"></div></div></div>
                        <div class="bg-orange-100 text-orange-600 p-2 rounded-lg dark:bg-orange-900/30 dark:text-orange-400"><i class="fa-solid fa-house-chimney"></i></div>
                    </div>
                    <p class="text-xs text-gray-400 mt-2 dark:text-gray-500">Aluguel, Luz, Internet, Serviços...</p>
                </div>

                <div class="bg-white p-5 rounded-xl card-shadow border-l-4 border-indigo-500 dark:bg-gray-800 transition-theme">
                    <div class="flex justify-between items-start">
                        <div><p class="text-sm text-gray-500 font-medium uppercase dark:text-gray-400">Saldo Atual (Conta)</p><h3 class="text-2xl font-bold text-gray-800 mt-1 dark:text-white val-privacy" id="dash-balance">...</h3><p class="text-xs text-indigo-600 font-semibold mt-1 dark:text-indigo-400">Fluxo de Caixa</p></div>
                        <div class="bg-indigo-100 text-indigo-600 p-2 rounded-lg dark:bg-indigo-900/30 dark:text-indigo-400"><i class="fa-solid fa-wallet"></i></div>
                    </div>
                    <button class="w-full mt-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded hover:bg-indigo-50 transition dark:text-indigo-400 dark:border-indigo-800 dark:hover:bg-indigo-900/30" onclick="Handlers.switchTab('report')">Ver Relatório Completo</button>
                </div>

                <div class="bg-white p-5 rounded-xl card-shadow border-l-4 border-teal-500 dark:bg-gray-800 transition-theme">
                    <div class="flex justify-between items-start">
                        <div><p class="text-sm text-gray-500 font-medium uppercase dark:text-gray-400">Saldo em Conta</p><h3 class="text-2xl font-bold text-gray-800 mt-1 dark:text-white val-privacy" id="dash-account-balance">...</h3><p class="text-xs text-teal-600 font-semibold mt-1 dark:text-teal-400">Extrato Bancário</p></div>
                        <div class="bg-teal-100 text-teal-600 p-2 rounded-lg dark:bg-teal-900/30 dark:text-teal-400"><i class="fa-solid fa-building-columns"></i></div>
                    </div>
                    <button class="w-full mt-3 py-1.5 text-xs font-medium text-teal-600 border border-teal-200 rounded hover:bg-teal-50 transition dark:text-teal-400 dark:border-teal-800 dark:hover:bg-teal-900/30" onclick="Handlers.switchTab('history')">Ver Extrato</button>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div class="bg-white p-5 rounded-xl card-shadow dark:bg-gray-800 transition-theme flex items-center justify-between">
                     <div>
                         <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Taxa de Renda Disponível</p>
                         <h3 class="text-xl font-bold text-gray-800 dark:text-white val-privacy" id="dash-discretionary">...</h3>
                         <p class="text-[10px] text-gray-400 mt-1">(Receita - Custos Fixos) / Receita</p>
                    </div>
                     <div class="h-10 w-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center dark:bg-purple-900/30 dark:text-purple-400">
                         <i class="fa-solid fa-percent"></i>
                      </div>
                </div>
                <div class="bg-white p-5 rounded-xl card-shadow dark:bg-gray-800 transition-theme flex items-center justify-between">
                    <div>
                        <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Ponto de Equilíbrio</p>
                        <h3 class="text-xl font-bold text-gray-800 dark:text-white" id="dash-breakeven">...</h3>
                        <p class="text-[10px] text-gray-400 mt-1">Dia onde Receita acumulada > Despesas</p>
                     </div>
                    <div class="h-10 w-10 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center dark:bg-cyan-900/30 dark:text-cyan-400">
                        <i class="fa-solid fa-scale-unbalanced"></i>
                    </div>
               </div>
            </div>

            <h3 class="font-semibold text-gray-700 dark:text-gray-200 mt-6 mb-3 px-1">Análise de Comportamento (Padrões)</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-white p-5 rounded-xl card-shadow dark:bg-gray-800 transition-theme">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h4 class="text-sm font-bold text-gray-700 dark:text-gray-200">Princípio de Pareto (80/20) - Cartões</h4>
                            <p class="text-[10px] text-gray-400 mt-0.5">Categorias que mais impactam seu orçamento</p>
                        </div>
                        <div class="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg text-xs dark:bg-indigo-900/30 dark:text-indigo-400"><i class="fa-solid fa-chart-pie"></i></div>
                    </div>
                    <div id="pareto-content" class="mt-4 val-privacy text-xs text-gray-400">Carregando dados...</div>
                </div>
                
                <div class="bg-white p-5 rounded-xl card-shadow dark:bg-gray-800 transition-theme">
                    <div class="flex justify-between items-start mb-2">
                         <div>
                             <h4 class="text-sm font-bold text-gray-700 dark:text-gray-200">Mapa de Calor de Gastos</h4>
                            <p class="text-[10px] text-gray-400 mt-0.5">Concentração de saídas por dia do mês</p>
                        </div>
                        <div class="bg-orange-100 text-orange-600 p-1.5 rounded-lg text-xs dark:bg-orange-900/30 dark:text-orange-400"><i class="fa-solid fa-fire"></i></div>
                    </div>
                    <div id="heatmap-container" class="grid grid-cols-7 gap-1 mt-2 val-privacy text-xs text-gray-400">Carregando dados...</div>
                 </div>
            </div>

            <div class="mt-6 bg-white p-5 rounded-xl card-shadow dark:bg-gray-800 transition-theme">
                <div class="flex justify-between items-center mb-4"><h3 class="font-semibold text-gray-700 dark:text-gray-200">Distribuição de Gastos</h3><button onclick="Handlers.switchTab('expenses')" class="text-xs text-blue-600 hover:text-blue-700 font-medium dark:text-blue-400 transition-colors">Ver detalhes</button></div>
                <div id="block-chart-container" class="w-full h-64 flex gap-2 overflow-hidden rounded-lg val-privacy font-sans items-center justify-center text-xs text-gray-400">Carregando dados...</div>
            </div>

            <div class="mt-6 bg-white p-5 rounded-xl card-shadow border border-gray-100 dark:bg-gray-800 dark:border-gray-700 transition-theme w-full">
                <div class="mb-4">
                     <h4 class="text-sm font-bold text-gray-700 dark:text-gray-200">Inflação Pessoal (Evolução de Categorias)</h4>
                     <p class="text-[10px] text-gray-400">Histórico anual de gastos no Cartão por categoria</p>
                 </div>
                 <div class="w-full h-64 val-privacy"><canvas id="inflationChart"></canvas></div>
            </div>
        `;
    },

    renderBlockChart(items) {
        const container = Utils.DOM.get('block-chart-container');
        if(!container) return;
        const total = items.reduce((a,b) => a+b.v, 0);
        
        if(total === 0) { 
            container.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">Sem dados</div>';
            return; 
        }

        let html = '';
        if (items[0]) {
            const p = Math.round((items[0].v/total)*100);
            html += `<div class="flex-1 flex flex-col gap-2 p-1">
                <div class="${items[0].c} h-full w-full rounded-lg flex flex-col items-start justify-end p-3 text-white relative">
                    <span class="text-xs font-semibold opacity-80">${items[0].k}</span>
                    <span class="text-lg font-bold">${Utils.formatCurrency(items[0].v)}</span>
                    <span class="absolute top-2 right-2 text-xs font-bold opacity-60">${p}%</span>
                </div>
            </div>`;
        }
        html += '<div class="flex-1 flex flex-col gap-2 p-1">';
        if (items[1]) {
                const p = Math.round((items[1].v/total)*100);
                html += `<div class="${items[1].c} h-1/2 w-full rounded-lg flex flex-col items-start justify-end p-3 text-white relative">
                <span class="text-xs font-semibold opacity-80">${items[1].k}</span>
                <span class="text-base font-bold">${Utils.formatCurrency(items[1].v)}</span>
                <span class="absolute top-2 right-2 text-xs font-bold opacity-60">${p}%</span>
                </div>`;
        }
        html += '<div class="flex-1 flex gap-2">';
        for(let i=2; i<Math.min(items.length, 5); i++) {
            const p = Math.round((items[i].v/total)*100);
            html += `<div class="${items[i].c} flex-1 rounded-lg flex flex-col items-center justify-center p-1 text-white relative">
                <span class="text-[10px] font-semibold opacity-80 truncate w-full text-center">${items[i].k}</span>
                <span class="text-xs font-bold">${p}%</span>
            </div>`;
        }
        html += '</div></div>';
        container.innerHTML = html;
    },

    render() {
        const container = Utils.DOM.get('view-dashboard');
        
        if(container && container.children.length === 0) {
            container.innerHTML = this.getTemplate();
        }

        if (!DataService.transactions || DataService.transactions.length === 0) {
            return;
        }

        const { year, month } = DataService.getLatestPeriod();
        const stats = DataService.getDashboardStats(year, month);
        
        Utils.DOM.updateText('current-month-badge', `${AppParams.months.full[month]} ${year}`);

        const updateVal = (id, val) => Utils.DOM.updateText(id, Utils.formatCurrency(val));
        const updateTrend = (containerId, textId, trendVal, isIncome) => {
            const isPos = trendVal >= 0;
            const color = isIncome ? (isPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400') : (isPos ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400');
            const el = Utils.DOM.get(containerId);
            if(el) {
                el.className = `text-xs mt-3 flex items-center ${color}`;
                Utils.DOM.updateText(textId, `${isPos?'+':''}${trendVal.toFixed(1)}%`);
                el.querySelector('i').className = `fa-solid ${isPos ? 'fa-caret-up' : 'fa-caret-down'} mr-1`;
            }
        };

        updateVal('dash-total-income', stats.metrics.income);
        updateVal('dash-total-expense', stats.metrics.expense);
        updateVal('dash-balance', stats.metrics.balance);
        updateVal('dash-fixed-cost', stats.metrics.fixedCost);
        updateVal('dash-account-balance', stats.metrics.accountBalance);
        updateVal('dash-card-invoice', stats.metrics.cardInvoice);
        
        Utils.DOM.updateText('dash-discretionary', `${stats.metrics.discretionaryRatio.toFixed(1)}%`);
        const beDay = stats.metrics.breakEvenDay;
        Utils.DOM.updateText('dash-breakeven', beDay ? `Dia ${beDay}` : 'Não atingido');

        // Pareto
        const pData = stats.metrics.pareto;
        const paretoEl = Utils.DOM.get('pareto-content');
        if (paretoEl) {
            if (pData.totalExp === 0) {
                paretoEl.innerHTML = '<p class="text-xs text-gray-400">Sem dados de despesas.</p>';
            } else {
                const pct = ((pData.totalPareto / pData.totalExp) * 100).toFixed(1);
                const count = pData.topCats.length;
                const listHTML = pData.topCats.map(c => {
                    const colorClass = UI.getCategoryColor(c.cat);
                    const catPct = ((c.val / pData.totalExp) * 100).toFixed(1);
                    return `<div class="mb-3 last:mb-0">
                            <div class="flex justify-between items-end mb-1">
                                <span class="text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1.5"><span class="w-2 h-2 rounded-full ${colorClass}"></span> ${c.cat}</span>
                                <span class="text-xs font-bold text-gray-800 dark:text-white">${Utils.formatCurrency(c.val)} <span class="text-[9px] font-normal text-gray-400 ml-0.5">(${catPct}%)</span></span>
                            </div>
                            <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                                <div class="${colorClass} h-1.5 rounded-full" style="width: ${catPct}%"></div>
                            </div>
                        </div>`;
                }).join('');
                
                paretoEl.innerHTML = `
                    <div class="mb-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                        <div><span class="text-2xl font-bold text-gray-800 dark:text-white leading-none">${count}</span><span class="text-xs text-gray-500 dark:text-gray-400 block mt-1">Categorias Principais</span></div>
                        <div class="text-right"><span class="text-lg font-bold text-indigo-600 dark:text-indigo-400 leading-none">${pct}%</span><span class="text-xs text-gray-500 dark:text-gray-400 block mt-1">do Total de Gastos</span></div>
                    </div>
                    <div class="flex flex-col overflow-y-auto max-h-[180px] pr-1 custom-scrollbar">${listHTML}</div>
                    <div class="mt-3 text-[10px] text-center text-gray-400 italic border-t border-gray-50 dark:border-gray-700 pt-2">Foco nestas categorias para maior impacto.</div>`;
            }
        }

        // Heatmap
        const hData = stats.metrics.heatmap;
        const heatEl = Utils.DOM.get('heatmap-container');
        if (heatEl) {
            const maxVal = Math.max(...hData, 1);
            heatEl.innerHTML = hData.map((val, i) => {
                const day = i + 1;
                const intensity = val === 0 ? 0 : Math.max(0.1, val / maxVal);
                const bg = val === 0 ? 'bg-gray-100 dark:bg-gray-700 text-gray-400' : 'bg-rose-500 dark:bg-rose-600 text-white';
                const style = val > 0 ? `opacity: ${0.2 + (intensity * 0.8)}` : '';
                const title = `Dia ${day}: ${Utils.formatCurrency(val)}`;
                return `<div class="${bg} rounded-sm aspect-square flex items-center justify-center text-[8px] hover:scale-125 transition-transform cursor-default font-medium" style="${style}" title="${title}">${day}</div>`; 
            }).join('');
        }

        updateTrend('income-trend-container', 'dash-income-trend', stats.trends.income, true);
        updateTrend('expense-trend-container', 'dash-expense-trend', stats.trends.expense, false);

        stats.categories.forEach(cat => { cat.c = UI.getCategoryColor(cat.k); });
        this.renderBlockChart(stats.categories);

        // --- Renderização do Gráfico de Inflação (Novo Local) ---
        // Usa o ano atual do contexto para exibir a inflação
        const inflationData = DataService.getYearlyCategoryBreakdown(year);
        // Garante que o ChartManager tenha acesso ao canvas que acabou de ser criado via innerHTML
        setTimeout(() => ChartManager.renderInflation(year, inflationData), 0);
    }
};

Dashboard.init();
