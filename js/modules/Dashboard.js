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
            <div class="flex justify-between items-center mb-6">
                <div class="flex items-center gap-2">
                    <h2 class="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">Resumo Financeiro</h2>
                </div>
                <span class="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1.5 rounded-full font-medium shadow-sm" id="current-month-badge">Carregando...</span>
            </div>

            <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4 pl-1 border-l-4 border-indigo-500">Visão Mensal Geral</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="bg-white p-5 rounded-xl card-shadow border border-gray-100 dark:bg-gray-800 dark:border-gray-700 transition-theme hover:shadow-md">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Saldo Atual (Real)</p>
                            <h3 class="text-xl font-bold text-gray-800 mt-1 dark:text-white val-privacy" id="dash-real-balance">...</h3>
                        </div>
                        <div class="bg-indigo-50 text-indigo-600 p-2 rounded-lg dark:bg-indigo-900/30 dark:text-indigo-400"><i class="fa-solid fa-wallet"></i></div>
                    </div>
                </div>

                <div class="bg-white p-5 rounded-xl card-shadow border border-gray-100 dark:bg-gray-800 dark:border-gray-700 transition-theme hover:shadow-md">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fatura Aberta</p>
                            <h3 class="text-xl font-bold text-gray-800 mt-1 dark:text-white val-privacy" id="dash-open-invoice">...</h3>
                        </div>
                        <div class="bg-purple-50 text-purple-600 p-2 rounded-lg dark:bg-purple-900/30 dark:text-purple-400"><i class="fa-brands fa-cc-mastercard"></i></div>
                    </div>
                    <p class="text-[10px] text-gray-400 mt-2 font-medium">Passivo (16/M-1 a 15/M)</p>
                </div>

                <div class="bg-white p-5 rounded-xl card-shadow border border-gray-100 dark:bg-gray-800 dark:border-gray-700 transition-theme hover:shadow-md">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Receita Prevista</p>
                            <h3 class="text-xl font-bold text-gray-800 mt-1 dark:text-white val-privacy" id="dash-predicted-income">...</h3>
                        </div>
                        <div class="bg-emerald-50 text-emerald-600 p-2 rounded-lg dark:bg-emerald-900/30 dark:text-emerald-400"><i class="fa-solid fa-arrow-trend-up"></i></div>
                    </div>
                    <p class="text-[10px] text-gray-400 mt-2 font-medium">Média últimos 3 meses</p>
                </div>

                <div class="bg-white p-5 rounded-xl card-shadow border border-gray-100 dark:bg-gray-800 dark:border-gray-700 transition-theme hover:shadow-md">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Custo Fixo Médio</p>
                            <h3 class="text-xl font-bold text-gray-800 mt-1 dark:text-white val-privacy" id="dash-fixed-cost">...</h3>
                        </div>
                        <div class="bg-orange-50 text-orange-600 p-2 rounded-lg dark:bg-orange-900/30 dark:text-orange-400"><i class="fa-solid fa-house-chimney"></i></div>
                    </div>
                    <p class="text-[10px] text-gray-400 mt-2 font-medium">Aluguel, Luz, Internet...</p>
                </div>
            </div>

            <h3 class="text-lg font-bold text-gray-800 dark:text-white mt-8 mb-4 pl-1 border-l-4 border-blue-500">Saldo em Contas & Saúde</h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="bg-white p-4 rounded-xl card-shadow dark:bg-gray-800 transition-theme flex items-center justify-between border-l-4 border-red-600 hover:shadow-md">
                    <div>
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bradesco</p>
                        <h3 class="text-lg font-bold text-gray-800 dark:text-white val-privacy" id="dash-bal-bradesco">...</h3>
                    </div>
                    <i class="fa-solid fa-building-columns text-red-600 text-xl opacity-20"></i>
                </div>

                <div class="bg-white p-4 rounded-xl card-shadow dark:bg-gray-800 transition-theme flex items-center justify-between border-l-4 border-rose-600 hover:shadow-md">
                    <div>
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Santander</p>
                        <h3 class="text-lg font-bold text-gray-800 dark:text-white val-privacy" id="dash-bal-santander">...</h3>
                    </div>
                    <i class="fa-solid fa-building-columns text-rose-600 text-xl opacity-20"></i>
                </div>

                <div class="bg-white p-4 rounded-xl card-shadow dark:bg-gray-800 transition-theme flex items-center justify-between border-l-4 border-blue-500 hover:shadow-md">
                    <div>
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Taxa Renda Disp.</p>
                        <h3 class="text-lg font-bold text-gray-800 dark:text-white val-privacy" id="dash-disposable-rate">...</h3>
                        <p class="text-[9px] text-gray-400 mt-0.5 font-medium">Margem após fixos</p>
                    </div>
                    <div class="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center dark:bg-blue-900/30 dark:text-blue-400">
                        <i class="fa-solid fa-percent"></i>
                    </div>
                </div>
            </div>

            <h3 class="text-lg font-bold text-gray-800 dark:text-white mt-8 mb-4 pl-1 border-l-4 border-rose-500">Inflação Pessoal - Fatura Santander</h3>
            <div class="bg-white p-5 rounded-xl card-shadow border border-gray-100 dark:bg-gray-800 dark:border-gray-700 transition-theme w-full">
                <div class="mb-4 flex justify-between items-end">
                     <div>
                        <p class="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Evolução de Categorias</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Histórico das últimas 12 faturas fechadas (Apenas consumo real)</p>
                     </div>
                 </div>
                 <div class="w-full h-64 val-privacy"><canvas id="inflationChart"></canvas></div>
            </div>

            <div class="mt-8 mb-4 pl-1 border-l-4 border-purple-500">
                <h3 class="text-lg font-bold text-gray-800 dark:text-white">Análise de Comportamento (Padrões)</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Análise consolidada dos últimos 3 meses</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-white p-5 rounded-xl card-shadow dark:bg-gray-800 transition-theme">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h4 class="text-sm font-bold text-gray-700 dark:text-gray-200">Princípio de Pareto (80/20)</h4>
                            <p class="text-[10px] text-gray-400 mt-0.5">Onde seu dinheiro realmente vai</p>
                        </div>
                        <div class="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg text-xs dark:bg-indigo-900/30 dark:text-indigo-400"><i class="fa-solid fa-chart-pie"></i></div>
                    </div>
                    <div id="pareto-content" class="mt-4 val-privacy text-xs text-gray-400">Carregando dados...</div>
                </div>

                <div class="bg-white p-5 rounded-xl card-shadow dark:bg-gray-800 transition-theme">
                    <div class="flex justify-between items-start mb-2">
                         <div>
                             <h4 class="text-sm font-bold text-gray-700 dark:text-gray-200">Mapa de Calor de Gastos</h4>
                            <p class="text-[10px] text-gray-400 mt-0.5">Concentração de saídas por dia</p>
                        </div>
                        <div class="bg-orange-50 text-orange-600 p-1.5 rounded-lg text-xs dark:bg-orange-900/30 dark:text-orange-400"><i class="fa-solid fa-fire"></i></div>
                    </div>
                    <div id="heatmap-container" class="grid grid-cols-7 gap-1 mt-2 val-privacy text-xs text-gray-400">Carregando dados...</div>
                 </div>
            </div>

        `;
    },

    render() {
        const container = Utils.DOM.get('view-dashboard');

        if(container && container.children.length === 0) {
            container.innerHTML = this.getTemplate();
        }

        if ((!DataService.bradescoTransactions || DataService.bradescoTransactions.length === 0) &&
            (!DataService.santanderAccountTransactions || DataService.santanderAccountTransactions.length === 0) &&
            (!DataService.santanderCardTransactions || DataService.santanderCardTransactions.length === 0)) {
            return;
        }

        const { year, month } = DataService.getLatestPeriod();
        const stats = DataService.getDashboardStats(year, month);

        Utils.DOM.updateText('current-month-badge', `${AppParams.months.full[month]} ${year}`);

        const updateVal = (id, val) => Utils.DOM.updateText(id, Utils.formatCurrency(val));

        updateVal('dash-real-balance', stats.metrics.realBalance);
        updateVal('dash-open-invoice', stats.metrics.openInvoice);
        updateVal('dash-predicted-income', stats.metrics.predictedIncome);
        updateVal('dash-fixed-cost', stats.metrics.fixedCost);

        updateVal('dash-bal-bradesco', stats.metrics.balBrad);
        updateVal('dash-bal-santander', stats.metrics.balSant);
        Utils.DOM.updateText('dash-disposable-rate', stats.metrics.disposableRate.toFixed(1) + '%');

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
                    const isOverLimit = c.val > c.limit;
                    const statusColor = isOverLimit ? 'bg-red-500' : 'bg-emerald-500';
                    const diff = c.val - c.limit;
                    const limitStr = Utils.formatCurrency(c.limit);

                    const max = Math.max(c.val, c.limit);
                    const valPct = max > 0 ? (c.val / max) * 100 : 0;
                    const limitPct = max > 0 ? (c.limit / max) * 100 : 0;

                    return `<div class="mb-3 last:mb-0">
                            <div class="flex justify-between items-end mb-1">
                                <span class="text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1.5"><span class="w-2 h-2 rounded-full ${colorClass}"></span> ${c.cat}</span>
                                <div class="text-right">
                                    <span class="text-xs font-bold text-gray-800 dark:text-white">${Utils.formatCurrency(c.val)}</span>
                                    <span class="text-[9px] block ${isOverLimit ? 'text-red-500' : 'text-emerald-500'} font-medium">Meta: ${limitStr}</span>
                                </div>
                            </div>
                            <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 relative">
                                <div class="absolute top-0 bottom-0 w-0.5 bg-gray-400 dark:bg-gray-500 z-10" style="left: ${limitPct}%"></div>
                                <div class="${statusColor} h-1.5 rounded-full transition-all duration-500" style="width: ${valPct}%"></div>
                            </div>
                        </div>`;
                }).join('');

                paretoEl.innerHTML = `
                    <div class="mb-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                        <div><span class="text-2xl font-bold text-gray-800 dark:text-white leading-none">${count}</span><span class="text-xs text-gray-500 dark:text-gray-400 block mt-1">Categorias (Top)</span></div>
                        <div class="text-right"><span class="text-lg font-bold text-indigo-600 dark:text-indigo-400 leading-none">${pct}%</span><span class="text-xs text-gray-500 dark:text-gray-400 block mt-1">do Total de Gastos</span></div>
                    </div>
                    <div class="flex flex-col overflow-y-auto max-h-[220px] pr-1 custom-scrollbar">${listHTML}</div>
                    <div class="mt-3 text-[10px] flex items-center justify-center gap-4 text-gray-400 border-t border-gray-50 dark:border-gray-700 pt-2">
                        <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> Abaixo da Média</span>
                        <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-red-500"></span> Acima da Média</span>
                    </div>`;
            }
        }

        const hData = stats.metrics.heatmap;
        const heatEl = Utils.DOM.get('heatmap-container');
        if (heatEl) {
            const maxVal = hData.reduce((m, d) => Math.max(m, d.val), 1);

            heatEl.innerHTML = hData.map((d, i) => {
                const day = i + 1;
                const hasData = d.val > 0;

                let bgClass = 'bg-gray-100 dark:bg-gray-700 text-gray-400';
                let style = '';

                if (hasData) {
                    bgClass = `text-white ${UI.getCategoryColor(d.topCat)}`;
                    const intensity = Math.max(0.4, d.val / maxVal);
                    style = `opacity: ${intensity}`;
                }

                const title = `Dia ${day}: ${Utils.formatCurrency(d.val)} (${d.topCat || '-'})`;

                return `<div class="${bgClass} rounded-sm aspect-square flex items-center justify-center text-[8px] hover:scale-125 transition-transform cursor-default font-medium" style="${style}" title="${title}">${day}</div>`;
            }).join('');
        }

        const inflationData = DataService.getLast12ClosedInvoicesBreakdown();
        setTimeout(() => ChartManager.renderInflation(year, inflationData), 0);
    }
};
window.Dashboard = Dashboard;