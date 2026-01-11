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
                <h2 class="text-lg font-semibold text-gray-700 dark:text-gray-200">Visão Mensal Geral</h2>
                <span class="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full font-medium" id="current-month-badge">Carregando...</span>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div class="bg-white p-5 rounded-xl card-shadow border-l-4 border-indigo-500 dark:bg-gray-800 transition-theme">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Saldo Atual (Real)</p>
                            <h3 class="text-xl font-bold text-gray-800 mt-1 dark:text-white val-privacy" id="dash-real-balance">...</h3>
                        </div>
                        <div class="bg-indigo-100 text-indigo-600 p-2 rounded-lg dark:bg-indigo-900/30 dark:text-indigo-400"><i class="fa-solid fa-wallet"></i></div>
                    </div>
                </div>

                <div class="bg-white p-5 rounded-xl card-shadow border-l-4 border-purple-500 dark:bg-gray-800 transition-theme">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fatura Aberta</p>
                            <h3 class="text-xl font-bold text-gray-800 mt-1 dark:text-white val-privacy" id="dash-open-invoice">...</h3>
                        </div>
                        <div class="bg-purple-100 text-purple-600 p-2 rounded-lg dark:bg-purple-900/30 dark:text-purple-400"><i class="fa-brands fa-cc-mastercard"></i></div>
                    </div>
                    <p class="text-[10px] text-gray-400 mt-1">Passivo (16/M-1 a 15/M)</p>
                </div>

                <div class="bg-white p-5 rounded-xl card-shadow border-l-4 border-emerald-500 dark:bg-gray-800 transition-theme">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Receita Prevista</p>
                            <h3 class="text-xl font-bold text-gray-800 mt-1 dark:text-white val-privacy" id="dash-predicted-income">...</h3>
                        </div>
                        <div class="bg-emerald-100 text-emerald-600 p-2 rounded-lg dark:bg-emerald-900/30 dark:text-emerald-400"><i class="fa-solid fa-arrow-trend-up"></i></div>
                    </div>
                    <p class="text-[10px] text-gray-400 mt-1">Média últimos 3 meses</p>
                </div>

                <div class="bg-white p-5 rounded-xl card-shadow border-l-4 border-orange-400 dark:bg-gray-800 transition-theme">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Custo Fixo Médio</p>
                            <h3 class="text-xl font-bold text-gray-800 mt-1 dark:text-white val-privacy" id="dash-fixed-cost">...</h3>
                        </div>
                        <div class="bg-orange-100 text-orange-600 p-2 rounded-lg dark:bg-orange-900/30 dark:text-orange-400"><i class="fa-solid fa-house-chimney"></i></div>
                    </div>
                    <p class="text-[10px] text-gray-400 mt-1">Aluguel, Luz, Internet...</p>
                </div>
            </div>

            <h3 class="font-semibold text-gray-700 dark:text-gray-200 mb-3 px-1">Saldo em Contas & Saúde</h3>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div class="bg-white p-4 rounded-xl card-shadow dark:bg-gray-800 transition-theme flex items-center justify-between border-l-4 border-red-600">
                    <div>
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bradesco</p>
                        <h3 class="text-lg font-bold text-gray-800 dark:text-white val-privacy" id="dash-bal-bradesco">...</h3>
                    </div>
                    <i class="fa-solid fa-building-columns text-red-600 text-xl opacity-50"></i>
                </div>

                <div class="bg-white p-4 rounded-xl card-shadow dark:bg-gray-800 transition-theme flex items-center justify-between border-l-4 border-rose-600">
                    <div>
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Santander</p>
                        <h3 class="text-lg font-bold text-gray-800 dark:text-white val-privacy" id="dash-bal-santander">...</h3>
                    </div>
                    <i class="fa-solid fa-building-columns text-rose-600 text-xl opacity-50"></i>
                </div>

                <div class="bg-white p-4 rounded-xl card-shadow dark:bg-gray-800 transition-theme flex items-center justify-between border-l-4 border-blue-500">
                    <div>
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Taxa Renda Disp.</p>
                        <h3 class="text-lg font-bold text-gray-800 dark:text-white val-privacy" id="dash-disposable-rate">...</h3>
                        <p class="text-[9px] text-gray-400 mt-0.5">(Saldo Disp - Fixo) / Saldo Disp</p>
                    </div>
                    <div class="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center dark:bg-blue-900/30 dark:text-blue-400">
                        <i class="fa-solid fa-percent"></i>
                    </div>
                </div>
            </div>

            <div class="mt-6 mb-3 px-1">
                <h3 class="font-semibold text-gray-700 dark:text-gray-200">Análise de Comportamento (Padrões)</h3>
                <p class="text-[10px] text-gray-400">Análise dos últimos 3 meses</p>
            </div>
            
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
                <div class="flex justify-between items-center mb-4"><h3 class="font-semibold text-gray-700 dark:text-gray-200">Ritmo de Gastos (Evolução Semanal)</h3><button onclick="Handlers.switchTab('expenses')" class="text-xs text-blue-600 hover:text-blue-700 font-medium dark:text-blue-400 transition-colors">Ver detalhes</button></div>
                <div id="weekly-chart-container" class="w-full h-40 flex items-end justify-between gap-4 px-4 val-privacy">Carregando dados...</div>
            </div>
            
            <div class="mt-6 bg-white p-5 rounded-xl card-shadow border border-gray-100 dark:bg-gray-800 dark:border-gray-700 transition-theme w-full">
                <div class="mb-4">
                     <h4 class="text-sm font-bold text-gray-700 dark:text-gray-200">Inflação Pessoal - Fatura Santander</h4>
                     <p class="text-[10px] text-gray-400">Evolução de categorias mês a mês (Apenas Gastos de Fatura)</p>
                 </div>
                 <div class="w-full h-64 val-privacy"><canvas id="inflationChart"></canvas></div>
            </div>
        `;
    },

    renderWeeklyChart(weeklyData) {
        const container = Utils.DOM.get('weekly-chart-container');
        if(!container) return;
        
        const total = weeklyData.reduce((a,b) => a+b, 0);
        if(total === 0) {
            container.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">Sem dados neste mês.</div>';
            return;
        }

        const max = Math.max(...weeklyData, 1);
        const labels = ['Semana 1 (1-7)', 'Semana 2 (8-14)', 'Semana 3 (15-21)', 'Semana 4 (22+)'];
        
        const html = weeklyData.map((val, i) => {
            const pct = Math.round((val / max) * 100);
            const displayVal = Utils.formatCurrency(val);
            const isHigh = (val / total) > 0.3; 
            const color = isHigh ? 'bg-rose-500' : 'bg-blue-500';
            
            return `
                <div class="flex-1 flex flex-col items-center group h-full justify-end">
                    <div class="relative w-full bg-gray-100 dark:bg-gray-700 rounded-t-lg flex items-end h-full overflow-hidden">
                        <div class="${color} w-full transition-all duration-700 ease-out rounded-t-lg relative group-hover:opacity-90" style="height: ${pct}%">
                            <span class="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-600 dark:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-white dark:bg-gray-800 px-1 rounded shadow">${displayVal}</span>
                        </div>
                    </div>
                    <div class="mt-2 text-[10px] font-medium text-gray-500 text-center uppercase tracking-wide">${labels[i]}</div>
                    <div class="text-xs font-bold text-gray-800 dark:text-gray-200 mt-0.5">${displayVal}</div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = html;
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

        // --- CORREÇÃO: Chamada apenas do novo gráfico ---
        this.renderWeeklyChart(stats.metrics.weeklyPace);

        const inflationData = DataService.getYearlyCategoryBreakdown(year);
        setTimeout(() => ChartManager.renderInflation(year, inflationData), 0);
    }
};

Dashboard.init();
