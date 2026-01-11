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
                    <div class="flex mb-2 items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide"><span>Crítico</span><span>Saudável (6 Meses)</span><span>Excelente (12+)</span></div>
                    <div class="overflow-hidden h-3 mb-2 text-xs flex rounded-full bg-gray-200 dark:bg-gray-700"><div id="goal-runway-bar" style="width:0%" class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500 transition-all duration-1000 ease-out"></div></div>
                    <div class="flex justify-between text-[10px] text-gray-400"><span>0</span><span>6</span><span>12+</span></div>
                </div>
                <div class="grid grid-cols-2 gap-4 mt-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                    <div class="text-center"><div class="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Saldo Total Disponível</div><div class="text-sm font-bold text-gray-700 dark:text-gray-200 val-privacy" id="goal-total-balance">...</div></div>
                    <div class="text-center border-l border-gray-100 dark:border-gray-700"><div class="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Média Gastos (6 Meses)</div><div class="text-sm font-bold text-gray-700 dark:text-gray-200 val-privacy" id="goal-avg-expense">...</div></div>
                </div>
            </div>

            <h3 class="font-semibold text-gray-700 dark:text-gray-200 mb-4 px-1 flex items-center gap-2">
                <i class="fa-solid fa-bullseye text-indigo-500"></i> Meus Objetivos
            </h3>
            <div id="goals-grid" class="flex flex-col gap-4 pb-6">
                <div class="text-center py-8 text-gray-400 text-sm">Carregando metas...</div>
            </div>
        `;
    },

    render() {
        const container = Utils.DOM.get('view-goals');
        if (!container) return;

        // CORREÇÃO: Força a injeção do template se o Grid novo não existir
        // Isso remove qualquer HTML antigo que esteja "travando" a renderização
        if (!container.querySelector('#goals-grid')) {
            container.innerHTML = this.getTemplate();
        }

        const stats = DataService.getGoalsStats();

        // 1. Runway
        Utils.DOM.updateText('goal-total-balance', Utils.formatCurrency(stats.currentBalance));
        Utils.DOM.updateText('goal-avg-expense', Utils.formatCurrency(stats.avgExp));
        Utils.DOM.updateText('goal-runway-val', stats.runway);
        const runwayBar = Utils.DOM.get('goal-runway-bar');
        if(runwayBar) {
            const pct = Math.min((parseFloat(stats.runway) / 12) * 100, 100);
            runwayBar.style.width = `${pct}%`;
            runwayBar.className = `shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-1000 ease-out ${stats.runway < 3 ? 'bg-rose-500' : (stats.runway < 6 ? 'bg-amber-500' : 'bg-emerald-500')}`;
        }

        // 2. Grid de Metas
        const grid = Utils.DOM.get('goals-grid');
        if(grid) {
            if (stats.goals && stats.goals.length > 0) {
                grid.innerHTML = stats.goals.map(g => this.createGoalCard(g)).join('');
            } else {
                grid.innerHTML = `
                <div class="text-center py-8 text-gray-400 text-xs border border-dashed border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <p class="font-bold mb-1">Nenhuma meta encontrada</p>
                    <p>Verifique se os dados estão preenchidos na aba 'Metas' da planilha.</p>
                </div>`;
            }
        }
    },

    createGoalCard(goal) {
        // Lógica de Imagem
        let mediaHtml = '';
        if (goal.image && goal.image.startsWith('http')) {
            mediaHtml = `<img src="${goal.image}" class="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700" onerror="this.src='https://placehold.co/600x400?text=Meta'">`;
        } else {
            const iconClass = goal.image || 'fa-solid fa-bullseye';
            mediaHtml = `<div class="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-400 text-4xl"><i class="${iconClass}"></i></div>`;
        }

        // Lógica de Datas
        const totalMonthsNeeded = goal.monthly > 0 ? Math.ceil(goal.total / goal.monthly) : 0;
        const monthsElapsed = totalMonthsNeeded - goal.monthsLeft;
        
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth() - monthsElapsed, 1);
        const endDate = new Date(today.getFullYear(), today.getMonth() + goal.monthsLeft, 1);
        
        const formatDate = (d) => `${AppParams.months.short[d.getMonth()]} ${d.getFullYear()}`;
        const dateRange = `${formatDate(startDate)} - ${formatDate(endDate)}`;

        return `
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 flex flex-col sm:flex-row gap-5 items-stretch hover:shadow-md transition-all">
            <div class="relative w-full sm:w-40 h-40 shrink-0 rounded-xl overflow-hidden group">
                ${mediaHtml}
                <span class="absolute bottom-2 left-2 right-2 bg-white/95 text-gray-700 text-[10px] font-bold py-1 px-2 rounded-md text-center shadow-sm backdrop-blur-sm truncate">
                    ${dateRange}
                </span>
            </div>
            
            <div class="flex-1 w-full flex flex-col justify-between">
                <div class="flex justify-between items-start mb-3">
                    <h4 class="font-bold text-lg text-gray-800 dark:text-white leading-tight">${goal.title}</h4>
                    <button onclick="window.open('${AppParams.urls.goalsEdit}', '_blank')" class="text-gray-400 hover:text-indigo-600 transition-colors">
                        <i class="fa-solid fa-ellipsis"></i>
                    </button>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-2">
                    <div>
                        <p class="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Valor total</p>
                        <p class="text-sm font-bold text-emerald-600 dark:text-emerald-400 val-privacy">${Utils.formatCurrency(goal.total)}</p>
                        <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-2 mb-0.5">Valor já arrecadado</p>
                        <p class="text-sm font-bold text-emerald-600 dark:text-emerald-400 val-privacy">${Utils.formatCurrency(goal.current)}</p>
                    </div>
                    <div>
                        <p class="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Valor gasto</p>
                        <p class="text-sm font-bold text-rose-600 dark:text-rose-400 val-privacy">R$ 0,00</p>
                        <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-2 mb-0.5">Saldo em conta</p>
                        <p class="text-sm font-bold text-emerald-600 dark:text-emerald-400 val-privacy">${Utils.formatCurrency(goal.current)}</p>
                    </div>
                    <div class="sm:text-right">
                        <p class="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Parcelas restantes</p>
                        <p class="text-sm font-bold text-gray-800 dark:text-white">${goal.monthsLeft}</p>
                        <div class="mt-3">
                            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                <div class="bg-teal-400 h-2.5 rounded-full transition-all duration-1000" style="width: ${Math.min(goal.percent, 100)}%"></div>
                            </div>
                            <p class="text-xs font-bold text-teal-500 mt-1 text-right">${goal.percent.toFixed(1)}%</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    }
};

Goals.init();
