import { DataService } from '../core/DataService.js';
import { AppParams } from '../core/Config.js';
import { Utils } from '../core/Utils.js';

export const Goals = {
    init() {
        this.render();
        DataService.subscribe(() => this.render());
        document.addEventListener('tabChanged', (e) => {
            if (e.detail.tab === 'goals') this.render();
        });
        // Inicializa eventos da calculadora (apenas uma vez)
        this.bindCalculatorEvents();
    },

    bindCalculatorEvents() {
        // Evita múltiplos binds se o init rodar de novo
        if (this.eventsBound) return;
        this.eventsBound = true;

        // Event listener para fechar modal com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeCalculator();
        });
    },

    getTemplate() {
        return `
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 class="text-xl font-bold text-gray-800 dark:text-white">Metas & Saúde Financeira</h2>

                <div class="flex gap-2">
                    <button onclick="Goals.openCalculator()" class="text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-900/50 cursor-pointer shadow-sm">
                        <i class="fa-solid fa-calculator"></i> Simular Viagem
                    </button>

                    <button onclick="window.open('${AppParams.urls.goalsEdit}', '_blank')" class="text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800 dark:hover:bg-indigo-900/50 cursor-pointer shadow-sm">
                        <i class="fa-solid fa-pen-to-square"></i> Editar Planilha
                    </button>
                </div>
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

            <div id="calc-modal" class="hidden fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                    <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onclick="Goals.closeCalculator()"></div>
                    <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                    <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                        <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div class="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                                <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title"><i class="fa-solid fa-plane-departure text-emerald-500 mr-2"></i> Simulador de Viagem</h3>
                                <button onclick="Goals.closeCalculator()" class="text-gray-400 hover:text-gray-500"><i class="fa-solid fa-xmark"></i></button>
                            </div>

                            <div class="grid grid-cols-2 gap-4 mb-4">
                                <div class="col-span-1">
                                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">Dias de Viagem</label>
                                    <input type="number" id="calc-days" value="5" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border" oninput="Goals.calculateTotal()">
                                </div>
                                <div class="col-span-1">
                                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">Pessoas</label>
                                    <input type="number" id="calc-people" value="1" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm p-2 border" oninput="Goals.calculateTotal()">
                                </div>
                            </div>

                            <div class="space-y-3">
                                <div>
                                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">Estadia Total (R$)</label>
                                    <input type="number" id="calc-stay" placeholder="Ex: 1235" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm sm:text-sm p-2 border" oninput="Goals.calculateTotal()">
                                </div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">Refeição (por pessoa/vez)</label>
                                        <div class="relative rounded-md shadow-sm">
                                            <input type="number" id="calc-food" value="60" class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm p-2 border" oninput="Goals.calculateTotal()">
                                            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><span class="text-gray-400 text-xs">x3/dia</span></div>
                                        </div>
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">Gasolina (por dia)</label>
                                        <input type="number" id="calc-gas" value="30" class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm p-2 border" oninput="Goals.calculateTotal()">
                                    </div>
                                </div>
                                <div class="grid grid-cols-3 gap-2">
                                    <div>
                                        <label class="block text-[10px] font-medium text-gray-700 dark:text-gray-300">Limpeza</label>
                                        <input type="number" id="calc-clean" value="150" class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-xs p-2 border" oninput="Goals.calculateTotal()">
                                    </div>
                                    <div>
                                        <label class="block text-[10px] font-medium text-gray-700 dark:text-gray-300">Pedágio</label>
                                        <input type="number" id="calc-toll" value="100" class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-xs p-2 border" oninput="Goals.calculateTotal()">
                                    </div>
                                    <div>
                                        <label class="block text-[10px] font-medium text-gray-700 dark:text-gray-300">Higiene/Outros</label>
                                        <input type="number" id="calc-misc" value="150" class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-xs p-2 border" oninput="Goals.calculateTotal()">
                                    </div>
                                </div>

                                <div class="pt-2 border-t border-gray-100 dark:border-gray-700">
                                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">Margem de Segurança (%)</label>
                                    <input type="range" id="calc-margin" min="0" max="30" value="10" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" oninput="Goals.calculateTotal()">
                                    <div class="text-right text-xs text-gray-500" id="calc-margin-val">10%</div>
                                </div>
                            </div>

                            <div class="mt-4 bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg text-center">
                                <p class="text-xs text-gray-500 dark:text-gray-400">Total Previsto da Viagem</p>
                                <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400" id="calc-final-total">R$ 0,00</p>
                            </div>

                            <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <h4 class="text-sm font-bold text-gray-800 dark:text-white mb-2">Planejamento</h4>
                                <div class="flex gap-2 text-xs mb-2">
                                    <button onclick="Goals.togglePlanMode('contribution')" id="btn-mode-contribution" class="flex-1 py-1.5 px-3 rounded-md bg-indigo-100 text-indigo-700 font-medium">Por Aporte Mensal</button>
                                    <button onclick="Goals.togglePlanMode('time')" id="btn-mode-time" class="flex-1 py-1.5 px-3 rounded-md bg-gray-100 text-gray-600">Por Data Limite</button>
                                </div>

                                <div id="plan-contribution-group">
                                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">Quanto guardar por mês?</label>
                                    <input type="number" id="calc-monthly-input" placeholder="Ex: 500" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm p-2 border" oninput="Goals.calculatePlan()">
                                    <p class="text-xs text-indigo-600 mt-2 font-medium" id="calc-plan-result-time">Preencha o valor acima...</p>
                                </div>

                                <div id="plan-time-group" class="hidden">
                                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">Meses até a viagem</label>
                                    <input type="number" id="calc-months-input" placeholder="Ex: 6" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm p-2 border" oninput="Goals.calculatePlan()">
                                    <p class="text-xs text-indigo-600 mt-2 font-medium" id="calc-plan-result-contribution">Preencha os meses acima...</p>
                                </div>
                            </div>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button type="button" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm" onclick="Goals.copyTotal()">
                                Copiar Total
                            </button>
                            <button type="button" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700" onclick="Goals.closeCalculator()">
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    render() {
        const container = Utils.DOM.get('view-goals');
        if (!container) return;
        if (!container.querySelector('#goals-grid')) container.innerHTML = this.getTemplate();

        const stats = DataService.getGoalsStats();

        // Renderiza Dados Principais
        Utils.DOM.updateText('goal-total-balance', Utils.formatCurrency(stats.currentBalance));
        Utils.DOM.updateText('goal-avg-expense', Utils.formatCurrency(stats.avgExp));
        Utils.DOM.updateText('goal-runway-val', stats.runway);
        const runwayBar = Utils.DOM.get('goal-runway-bar');
        if(runwayBar) {
            const pct = Math.min((parseFloat(stats.runway) / 12) * 100, 100);
            runwayBar.style.width = `${pct}%`;
            runwayBar.className = `shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-1000 ease-out ${stats.runway < 3 ? 'bg-rose-500' : (stats.runway < 6 ? 'bg-amber-500' : 'bg-emerald-500')}`;
        }

        // Renderiza Grid
        const grid = Utils.DOM.get('goals-grid');
        if(grid) {
            if (stats.goals && stats.goals.length > 0) {
                grid.innerHTML = stats.goals.map(g => this.createGoalCard(g)).join('');
            } else {
                grid.innerHTML = `<div class="text-center py-8 text-gray-400 text-xs border border-dashed border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800/50"><p class="font-bold mb-1">Nenhuma meta encontrada</p><p>Verifique se os dados estão preenchidos na aba 'Metas' da planilha.</p></div>`;
            }
        }
    },

    createGoalCard(goal) {
        let mediaHtml = '';
        if (goal.image && goal.image.startsWith('http')) {
            mediaHtml = `<img src="${goal.image}" class="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700" onerror="this.src='https://placehold.co/600x400?text=Meta'">`;
        } else {
            const iconClass = goal.image || 'fa-solid fa-bullseye';
            mediaHtml = `<div class="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-400 text-4xl"><i class="${iconClass}"></i></div>`;
        }

        let barColor = 'bg-blue-500';
        let barWidth = Math.min(goal.percent, 100);
        if(goal.percent >= 100) barColor = 'bg-emerald-500';
        else if(goal.percent < 30) barColor = 'bg-rose-500';
        else if(goal.percent < 70) barColor = 'bg-amber-500';

        let dateRange = "Sem prazo";
        if (goal.monthly > 0 && goal.monthsLeft > 0) {
            const today = new Date();
            const totalMonths = Math.ceil(goal.total / goal.monthly);
            const start = new Date(today.getFullYear(), today.getMonth() - (totalMonths - goal.monthsLeft), 1);
            const end = new Date(today.getFullYear(), today.getMonth() + goal.monthsLeft, 1);
            const fmt = (d) => `${AppParams.months.short[d.getMonth()]} ${d.getFullYear()}`;
            dateRange = `${fmt(start)} - ${fmt(end)}`;
        }

        return `
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700 flex flex-col sm:flex-row gap-5 items-stretch hover:shadow-md transition-all">
            <div class="relative w-full sm:w-1/3 h-40 shrink-0 rounded-xl overflow-hidden group">
                ${mediaHtml}
                <span class="absolute bottom-2 left-2 right-2 bg-white/95 text-gray-700 text-[10px] font-bold py-1 px-2 rounded-md text-center shadow-sm backdrop-blur-sm truncate">${dateRange}</span>
            </div>
            <div class="flex-1 w-full flex flex-col justify-between">
                <div class="flex justify-between items-start mb-3">
                    <h4 class="font-bold text-lg text-gray-800 dark:text-white leading-tight">${goal.title}</h4>
                    <button onclick="window.open('${AppParams.urls.goalsEdit}', '_blank')" class="text-gray-400 hover:text-indigo-600 transition-colors"><i class="fa-solid fa-pen"></i></button>
                </div>
                <div class="grid grid-cols-2 gap-y-4 gap-x-6">
                    <div>
                        <p class="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Valor total</p>
                        <p class="text-sm font-bold text-emerald-600 dark:text-emerald-400 val-privacy">${Utils.formatCurrency(goal.total)}</p>
                        <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-2 mb-0.5">Valor já arrecadado</p>
                        <p class="text-sm font-bold text-emerald-600 dark:text-emerald-400 val-privacy">${Utils.formatCurrency(goal.current)}</p>
                    </div>
                    <div class="sm:text-right">
                        <p class="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Aporte Mensal</p>
                        <p class="text-sm font-bold text-indigo-600 dark:text-indigo-400 val-privacy flex items-center sm:justify-end gap-1">${Utils.formatCurrency(goal.monthly)}</p>
                        <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-2 mb-0.5">Parcelas restantes</p>
                        <p class="text-sm font-bold text-gray-800 dark:text-white">${goal.monthsLeft}</p>
                    </div>
                </div>
                <div class="mt-4">
                    <div class="flex justify-between text-xs mb-1"><span class="font-bold text-teal-500">${goal.percent.toFixed(1)}%</span></div>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                        <div class="${barColor} h-2.5 rounded-full transition-all duration-1000" style="width: ${barWidth}%"></div>
                    </div>
                </div>
            </div>
        </div>`;
    },

    // --- LÓGICA DA CALCULADORA ---
    openCalculator() {
        Utils.DOM.get('calc-modal').classList.remove('hidden');
        this.calculateTotal(); // Recalcula valores padrão
    },

    closeCalculator() {
        Utils.DOM.get('calc-modal').classList.add('hidden');
    },

    calculateTotal() {
        const getVal = (id) => parseFloat(document.getElementById(id).value) || 0;

        const days = getVal('calc-days');
        const people = Math.max(1, getVal('calc-people'));
        const stay = getVal('calc-stay');
        const food = getVal('calc-food') * 3 * days * people; // 3 refeições/dia * pessoas
        const gas = getVal('calc-gas') * days;
        const clean = getVal('calc-clean');
        const toll = getVal('calc-toll');
        const misc = getVal('calc-misc');
        const marginPct = getVal('calc-margin');

        Utils.DOM.updateText('calc-margin-val', marginPct + '%');

        const subtotal = stay + food + gas + clean + toll + misc;
        const total = subtotal * (1 + (marginPct/100));

        this.currentSimulatedTotal = total;
        Utils.DOM.updateText('calc-final-total', Utils.formatCurrency(total));

        // Atualiza o planejamento se houver valores
        this.calculatePlan();
    },

    togglePlanMode(mode) {
        const btnContrib = document.getElementById('btn-mode-contribution');
        const btnTime = document.getElementById('btn-mode-time');
        const groupContrib = document.getElementById('plan-contribution-group');
        const groupTime = document.getElementById('plan-time-group');

        if (mode === 'contribution') {
            btnContrib.className = "flex-1 py-1.5 px-3 rounded-md bg-indigo-100 text-indigo-700 font-medium";
            btnTime.className = "flex-1 py-1.5 px-3 rounded-md bg-gray-100 text-gray-600";
            groupContrib.classList.remove('hidden');
            groupTime.classList.add('hidden');
            this.activePlanMode = 'contribution';
        } else {
            btnTime.className = "flex-1 py-1.5 px-3 rounded-md bg-indigo-100 text-indigo-700 font-medium";
            btnContrib.className = "flex-1 py-1.5 px-3 rounded-md bg-gray-100 text-gray-600";
            groupTime.classList.remove('hidden');
            groupContrib.classList.add('hidden');
            this.activePlanMode = 'time';
        }
        this.calculatePlan();
    },

    calculatePlan() {
        if (!this.currentSimulatedTotal) return;

        if (this.activePlanMode === 'time') {
            const months = parseFloat(document.getElementById('calc-months-input').value) || 0;
            if (months > 0) {
                const needed = this.currentSimulatedTotal / months;
                Utils.DOM.updateText('calc-plan-result-contribution', `Você precisará guardar ${Utils.formatCurrency(needed)} por mês.`);
            } else {
                Utils.DOM.updateText('calc-plan-result-contribution', 'Preencha os meses acima...');
            }
        } else {
            // Default: Contribution
            const contrib = parseFloat(document.getElementById('calc-monthly-input').value) || 0;
            if (contrib > 0) {
                const months = Math.ceil(this.currentSimulatedTotal / contrib);
                Utils.DOM.updateText('calc-plan-result-time', `Você atingirá a meta em aproximadamente ${months} meses.`);
            } else {
                Utils.DOM.updateText('calc-plan-result-time', 'Preencha o valor acima...');
            }
        }
    },

    copyTotal() {
        if (this.currentSimulatedTotal) {
            navigator.clipboard.writeText(this.currentSimulatedTotal.toFixed(2).replace('.', ','));
            const btn = event.target;
            const originalText = btn.innerText;
            btn.innerText = "Copiado!";
            setTimeout(() => btn.innerText = originalText, 2000);
        }
    }
};
