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
    <div class="flex justify-between items-center mb-8 relative z-10">
        <div>
            <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Tranquilidade Financeira</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Seu panorama orgânico e atualizado</p>
        </div>
        <span class="text-sm bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-4 py-2 rounded-full font-semibold shadow-sm border border-blue-200 dark:border-blue-800" id="current-month-badge">Carregando...</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 relative z-10">
        <div class="col-span-1 lg:col-span-5 bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-900 dark:to-gray-800 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden group border border-gray-700">
            <div class="absolute top-0 right-0 -mr-8 -mt-8 w-48 h-48 rounded-full bg-white opacity-5 blur-2xl group-hover:opacity-10 transition-opacity duration-700"></div>
            <div class="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 rounded-full bg-blue-500 opacity-20 blur-2xl"></div>
            <div class="relative z-10">
                <div class="flex justify-between items-start mb-6">
                    <div class="bg-white/10 p-2.5 rounded-xl backdrop-blur-md border border-white/10"><i class="fa-solid fa-seedling text-xl text-blue-200"></i></div>
                    <span class="text-xs font-semibold bg-white/10 text-white px-3 py-1 rounded-full backdrop-blur-md">Reserva Líquida</span>
                </div>
                <h3 class="text-4xl sm:text-5xl font-extrabold val-privacy tracking-tight mb-2 text-white" id="dash-real-balance">...</h3>
                <p class="text-gray-300 text-sm font-medium">Patrimônio Imediato Total</p>
                <div class="mt-8 grid grid-cols-2 gap-4">
                    <div class="bg-white/5 rounded-2xl p-4 backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-colors">
                        <div class="flex items-center gap-2 mb-2"><div class="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(206,116,95,0.8)]"></div><p class="text-gray-300 text-xs uppercase tracking-wider font-semibold">Bradesco</p></div>
                        <p class="font-bold val-privacy text-lg text-white" id="dash-bal-bradesco">...</p>
                    </div>
                    <div class="bg-white/5 rounded-2xl p-4 backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-colors">
                        <div class="flex items-center gap-2 mb-2"><div class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(149,172,117,0.8)]"></div><p class="text-gray-300 text-xs uppercase tracking-wider font-semibold">Santander</p></div>
                        <p class="font-bold val-privacy text-lg text-white" id="dash-bal-santander">...</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-span-1 lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div class="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-200 dark:border-gray-700 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
                <div class="absolute top-0 right-0 w-24 h-24 bg-rose-50 dark:bg-rose-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div class="flex items-center gap-4 mb-4 relative z-10"><div class="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center text-xl border border-rose-200/50 shadow-[0_0_20px_rgba(186,92,69,0.35)] dark:shadow-[0_0_20px_rgba(186,92,69,0.2)]"><i class="fa-solid fa-credit-card"></i></div><div><p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Fatura Aberta</p><p class="text-xs text-gray-500">Cartão de Crédito</p></div></div>
                <h3 class="text-3xl font-bold text-gray-800 dark:text-white val-privacy tracking-tight" id="dash-open-invoice">...</h3>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-200 dark:border-gray-700 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
                <div class="absolute top-0 right-0 w-24 h-24 bg-emerald-50 dark:bg-emerald-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div class="flex items-center gap-4 mb-4 relative z-10"><div class="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center text-xl border border-emerald-200/50 shadow-[0_0_20px_rgba(125,148,93,0.35)] dark:shadow-[0_0_20px_rgba(125,148,93,0.2)]"><i class="fa-solid fa-arrow-trend-up"></i></div><div><p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Receita Prevista</p><p class="text-xs text-gray-500">Média de entradas</p></div></div>
                <h3 class="text-3xl font-bold text-gray-800 dark:text-white val-privacy tracking-tight" id="dash-predicted-income">...</h3>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-200 dark:border-gray-700 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
                <div class="absolute top-0 right-0 w-24 h-24 bg-gray-100 dark:bg-gray-700/50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div class="flex items-center gap-4 mb-4 relative z-10"><div class="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center text-xl border border-gray-200/50 shadow-[0_0_20px_rgba(140,134,122,0.35)] dark:shadow-[0_0_20px_rgba(140,134,122,0.2)]"><i class="fa-solid fa-house-chimney"></i></div><div><p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Custo Fixo Médio</p><p class="text-xs text-gray-500">Despesas essenciais</p></div></div>
                <h3 class="text-3xl font-bold text-gray-800 dark:text-white val-privacy tracking-tight" id="dash-fixed-cost">...</h3>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-200 dark:border-gray-700 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-1 transition-transform">
                <div class="absolute top-0 right-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div class="flex items-center gap-4 mb-4 relative z-10"><div class="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center text-xl border border-blue-200/50 shadow-[0_0_20px_rgba(217,165,32,0.35)] dark:shadow-[0_0_20px_rgba(217,165,32,0.2)]"><i class="fa-solid fa-droplet"></i></div><div><p class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Renda Disponível</p><p class="text-xs text-gray-500">Margem pós-fixos</p></div></div>
                <h3 class="text-3xl font-bold text-gray-800 dark:text-white val-privacy tracking-tight" id="dash-disposable-rate">...</h3>
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8 relative z-10">
        <div class="xl:col-span-2 bg-white dark:bg-gray-800 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-200 dark:border-gray-700 w-full">
            <div class="flex justify-between items-start mb-6"><div><h3 class="text-lg font-bold text-gray-900 dark:text-white">Raízes do Consumo</h3><p class="text-sm text-gray-500 mt-1">Evolução dos gastos por categoria</p></div><div class="bg-gray-100 dark:bg-gray-700/50 p-2.5 rounded-xl text-gray-500 border border-gray-200 dark:border-gray-600 shadow-[0_0_15px_rgba(140,134,122,0.3)] dark:shadow-[0_0_15px_rgba(140,134,122,0.15)]"><i class="fa-solid fa-chart-line"></i></div></div>
            <div class="w-full h-72 val-privacy"><canvas id="inflationChart"></canvas></div>
        </div>
        <div class="xl:col-span-1 bg-white dark:bg-gray-800 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-200 dark:border-gray-700 flex flex-col h-full">
            <div class="flex justify-between items-start mb-6"><div><h3 class="text-lg font-bold text-gray-900 dark:text-white">Poda de Despesas</h3><p class="text-sm text-gray-500 mt-1">Onde sua energia se concentra (Pareto)</p></div><div class="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2.5 rounded-xl border border-blue-100 dark:border-blue-800/50 shadow-[0_0_15px_rgba(217,165,32,0.3)] dark:shadow-[0_0_15px_rgba(217,165,32,0.15)]"><i class="fa-solid fa-scissors"></i></div></div>
            <div id="pareto-content" class="flex-1 val-privacy text-sm text-gray-500 mt-4">Calculando concentrações...</div>
        </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-200 dark:border-gray-700 mb-8 relative z-10">
        <div class="flex justify-between items-start mb-6"><div><h3 class="text-lg font-bold text-gray-900 dark:text-white">Clima Diário</h3><p class="text-sm text-gray-500 mt-1">Intensidade do movimento financeiro neste mês</p></div><div class="bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 p-2.5 rounded-xl border border-rose-100 dark:border-rose-800/50 shadow-[0_0_15px_rgba(186,92,69,0.3)] dark:shadow-[0_0_15px_rgba(186,92,69,0.15)]"><i class="fa-solid fa-sun"></i></div></div>
        <div id="heatmap-container" class="grid grid-cols-7 gap-2 val-privacy text-center text-sm text-gray-500">Semeando dados...</div>
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
                    const clClass = UI.getCategoryColor(c.cat);
                    const over = c.val > c.limit;
                    const stColor = over ? 'bg-rose-500' : 'bg-emerald-500';
                    const limStr = Utils.formatCurrency(c.limit), max = Math.max(c.val, c.limit);
                    const vPct = max>0?(c.val/max)*100:0, lPct = max>0?(c.limit/max)*100:0;
                    return `<div class="mb-5 last:mb-0 group"><div class="flex justify-between items-end mb-2.5"><span class="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2.5"><span class="w-2.5 h-2.5 rounded-full ${clClass} shadow-sm"></span> ${c.cat}</span><div class="text-right"><span class="text-[15px] font-bold text-gray-900 dark:text-white">${Utils.formatCurrency(c.val)}</span><span class="text-[10px] block ${over?'text-rose-600':'text-emerald-600'} font-semibold mt-0.5">Média Ref: ${limStr}</span></div></div><div class="w-full bg-gray-100 dark:bg-gray-700/60 rounded-full h-2.5 relative overflow-hidden shadow-inner"><div class="absolute top-0 bottom-0 w-[3px] bg-gray-400 dark:bg-gray-400 z-10" style="left: ${lPct}%"></div><div class="${stColor} h-full rounded-full transition-all duration-700" style="width: ${vPct}%"></div></div></div>`;
                }).join('');

                paretoEl.innerHTML = `<div class="mb-6 flex items-center justify-between bg-gray-50 dark:bg-gray-700/30 p-4 rounded-[1rem] border border-gray-200 dark:border-gray-700/50"><div><span class="text-3xl font-black text-gray-900 dark:text-white leading-none">${count}</span><span class="text-xs text-gray-500 dark:text-gray-400 block mt-1 font-medium">Focos Centrais</span></div><div class="text-right"><span class="text-3xl font-black text-blue-600 dark:text-blue-400 leading-none">${pct}%</span><span class="text-xs text-gray-500 dark:text-gray-400 block mt-1 font-medium">Da Área Total</span></div></div><div class="flex flex-col overflow-y-auto max-h-[280px] pr-2 custom-scrollbar">${listHTML}</div>`;
            }
        }

        const hData = stats.metrics.heatmap;
        const heatEl = Utils.DOM.get('heatmap-container');
        if (heatEl) {
            const maxVal = hData.reduce((m, d) => Math.max(m, d.val), 1);

            heatEl.innerHTML = hData.map((d, i) => {
                const day = i + 1, hasData = d.val > 0;
                let bg = 'bg-gray-100 dark:bg-gray-700/50 text-gray-400 border border-gray-200 dark:border-gray-700/50', style = '';
                if (hasData) {
                    bg = `text-white ${UI.getCategoryColor(d.topCat)} shadow-md border-transparent`;
                    const intensity = Math.max(0.4, d.val / maxVal);
                    style = `opacity: ${intensity}; transform: scale(${0.96 + (intensity * 0.04)})`;
                }
                return `<div class="${bg} rounded-2xl aspect-square flex items-center justify-center text-sm font-bold hover:scale-110 hover:opacity-100 hover:shadow-lg transition-all cursor-default relative group" style="${style}" title="Dia ${day}: ${Utils.formatCurrency(d.val)} (${d.topCat || '-'})">${day}</div>`;
            }).join('');
        }

        const inflationData = DataService.getLast12ClosedInvoicesBreakdown();
        setTimeout(() => ChartManager.renderInflation(year, inflationData), 0);
    }
};
window.Dashboard = Dashboard;
