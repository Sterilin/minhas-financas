const Goals = {
    init() {
        this.render();
        DataService.subscribe(() => this.render());
        document.addEventListener('tabChanged', (e) => {
            if (e.detail.tab === 'goals') this.render();
        });
    },

    getTemplate() {
        return `
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-gray-800 dark:text-white">Metas & Saúde Financeira</h2>
                <button onclick="window.open('${AppParams.urls.goalsEdit}', '_blank')" class="text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800 dark:hover:bg-indigo-900/50 cursor-pointer">
                    <i class="fa-solid fa-pen-to-square"></i> Atualizar Metas
                </button>
            </div>

            <div class="bg-white p-6 rounded-xl card-shadow dark:bg-gray-800 transition-theme mb-8 border-l-4 border-emerald-500">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h4 class="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <i class="fa-solid fa-shield-heart text-emerald-500"></i> Cobertura de Emergência (Runway)
                        </h4>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md">
                            Baseado na sua média de gastos real dos últimos 6 meses.
                        </p>
                    </div>
                    <div class="text-right">
                        <div class="text-3xl font-bold text-gray-800 dark:text-white val-privacy" id="goal-runway-val">...</div>
                        <div class="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Meses de Cobertura</div>
                    </div>
                </div>

                <div class="relative pt-6 pb-2 mt-2">
                    <div class="flex mb-2 items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        <span>Crítico</span>
                        <span>Saudável (6 Meses)</span>
                        <span>Excelente (12+)</span>
                    </div>
                    <div class="overflow-hidden h-3 mb-2 text-xs flex rounded-full bg-gray-200 dark:bg-gray-700">
                        <div id="goal-runway-bar" style="width:0%" class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500 transition-all duration-1000 ease-out"></div>
                    </div>
                    <div class="flex justify-between text-[10px] text-gray-400">
                        <span>0</span><span>6</span><span>12+</span>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4 mt-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                    <div class="text-center">
                        <div class="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Saldo Total Disponível</div>
                        <div class="text-sm font-bold text-gray-700 dark:text-gray-200 val-privacy" id="goal-total-balance">...</div>
                    </div>
                    <div class="text-center border-l border-gray-100 dark:border-gray-700">
                        <div class="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Média Gastos (6 Meses)</div>
                        <div class="text-sm font-bold text-gray-700 dark:text-gray-200 val-privacy" id="goal-avg-expense">...</div>
                    </div>
                </div>
            </div>

            <h3 class="font-semibold text-gray-700 dark:text-gray-200 mb-4 px-1 flex items-center gap-2">
                <i class="fa-solid fa-bullseye text-indigo-500"></i> Meus Objetivos
            </h3>
            <div id="goals-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                <div class="col-span-full text-center py-8 text-gray-400 text-sm">Carregando metas...</div>
            </div>
        `;
    },

    render() {
        const container = Utils.DOM.get('view-goals');
        if(container && container.children.length === 0) {
            container.innerHTML = this.getTemplate();
        }

        const stats = DataService.getGoalsStats();

        // 1. Atualiza Runway e Saldos
        Utils.DOM.updateText('goal-total-balance', Utils.formatCurrency(stats.currentBalance));
        Utils.DOM.updateText('goal-avg-expense', Utils.formatCurrency(stats.avgExp));
        Utils.DOM.updateText('goal-runway-val', stats.runway);

        const runwayBar = Utils.DOM.get('goal-runway-bar');
        if(runwayBar) {
            const pct = Math.min((stats.runway / 12) * 100, 100);
            runwayBar.style.width = `${pct}%`;
            runwayBar.className = `shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-1000 ease-out ${stats.runway < 3 ? 'bg-rose-500' : (stats.runway < 6 ? 'bg-amber-500' : 'bg-emerald-500')}`;
        }

        // 2. Renderiza Grid de Metas
        const grid = Utils.DOM.get('goals-grid');
        if(grid && stats.goals && stats.goals.length > 0) {
            grid.innerHTML = stats.goals.map(g => this.createGoalCard(g)).join('');
        } else if (grid) {
            grid.innerHTML = '<div class="col-span-full text-center py-8 text-gray-400 text-xs border border-dashed border-gray-300 rounded-lg">Nenhuma meta encontrada na planilha.</div>';
        }
    },

    createGoalCard(goal) {
        // Lógica de Imagem
        let mediaHtml = '';
        if (goal.image && goal.image.startsWith('http')) {
            // Imagem externa
            mediaHtml = `<img src="${goal.image}" class="w-full h-full object-cover transition-transform hover:scale-105 duration-500" onerror="this.src='https://placehold.co/600x400?text=Meta'">`;
        } else {
            // Ícone FontAwesome
            const iconClass = goal.image || 'fa-solid fa-bullseye';
            mediaHtml = `<div class="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-400 text-4xl"><i class="${iconClass}"></i></div>`;
        }

        // Cor da Barra
        let barColor = 'bg-blue-500';
        if(goal.percent >= 100) barColor = 'bg-emerald-500';
        else if(goal.percent < 30) barColor = 'bg-rose-500';
        else if(goal.percent < 70) barColor = 'bg-amber-500';

        // Previsão de Tempo
        let forecastHtml = '<span class="text-emerald-600 font-bold flex items-center gap-1"><i class="fa-solid fa-check"></i> Concluído!</span>';
        if(goal.percent < 100) {
            if (goal.monthsLeft > 0) {
                forecastHtml = `Faltam <span class="font-bold text-gray-800 dark:text-white mx-1">${goal.monthsLeft} meses</span>`;
            } else {
                forecastHtml = '<span class="text-gray-400">Sem previsão</span>';
            }
        }

        return `
        <div class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:bg-gray-800 dark:border-gray-700 flex flex-col group hover:shadow-md transition-shadow relative">
            <div class="h-32 bg-gray-200 relative overflow-hidden">
                ${mediaHtml}
                <span class="absolute top-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm shadow-sm">
                    ${goal.percent.toFixed(0)}%
                </span>
                <button onclick="window.open('${AppParams.urls.goalsEdit}', '_blank')" class="absolute top-2 left-2 bg-white/90 text-gray-600 hover:text-indigo-600 p-1.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity text-xs" title="Atualizar valor na planilha">
                    <i class="fa-solid fa-pen"></i>
                </button>
            </div>
            
            <div class="p-4 flex-1 flex flex-col justify-between">
                <div>
                    <h4 class="font-bold text-gray-800 dark:text-white truncate text-sm mb-2" title="${goal.title}">${goal.title}</h4>
                    
                    <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span class="val-privacy font-semibold text-gray-700 dark:text-gray-300">${Utils.formatCurrency(goal.current)}</span>
                        <span class="val-privacy">${Utils.formatCurrency(goal.total)}</span>
                    </div>
                    
                    <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-3">
                        <div class="${barColor} h-2 rounded-full transition-all duration-1000 relative" style="width: ${Math.min(goal.percent, 100)}%"></div>
                    </div>
                </div>

                <div class="pt-3 border-t border-gray-50 dark:border-gray-700 flex justify-between items-center mt-auto">
                    <div class="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1" title="Aporte Mensal">
                        <i class="fa-solid fa-piggy-bank"></i> +${Utils.formatCurrency(goal.monthly)}
                    </div>
                    <div class="text-[10px] text-gray-500 dark:text-gray-400">
                        ${forecastHtml}
                    </div>
                </div>
            </div>
        </div>`;
    }
};

Goals.init();
