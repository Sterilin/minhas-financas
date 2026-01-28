import { DataService } from '../core/DataService.js';
import { AppState } from '../core/AppState.js';
import { AppParams } from '../core/Config.js';
import { Utils } from '../core/Utils.js';
import { ChartManager } from '../core/ChartManager.js';

export const Report = {
    init() {
        DataService.subscribe(() => {
            // Define o padrão para os últimos 12 meses ao carregar novos dados
            this.setLast12Months();

            this.renderYearToggles();
            this.renderMonthButtons();
            this.updateCharts();
        });
    },

    // --- Nova Lógica: Janela de 12 Meses ---
    setLast12Months() {
        const latest = DataService.getLatestPeriod(); // { year: 2025, month: 10 }

        // Reseta seleções
        AppState.selectedYears = [];
        AppState.reportSelections = {};

        // Loop para pegar os últimos 12 meses (0 a 11)
        for (let i = 0; i < 12; i++) {
            let y = latest.year;
            let m = latest.month - i;

            // Ajuste de virada de ano
            if (m < 0) {
                m += 12;
                y -= 1;
            }

            // Adiciona o ano à lista se não existir
            if (!AppState.selectedYears.includes(y)) {
                AppState.selectedYears.push(y);
            }

            // Inicializa o array do ano se não existir
            if (!AppState.reportSelections[y]) {
                AppState.reportSelections[y] = [];
            }

            // Adiciona o mês
            AppState.reportSelections[y].push(m);
        }

        // Ordenação para garantir consistência visual
        AppState.selectedYears.sort((a, b) => a - b);
        AppState.selectedYears.forEach(y => {
            if (AppState.reportSelections[y]) {
                AppState.reportSelections[y].sort((a, b) => a - b);
            }
        });

        // Força a visualização para Mensal, pois 12 meses em Trimestral ficaria estranho se quebrado
        const filterView = Utils.DOM.get('filter-view');
        if(filterView) filterView.value = 'monthly';
    },

    // --- Renderização de Controles ---
    renderYearToggles() {
        const c = Utils.DOM.get('year-toggles-container');
        if(!c) return;
        c.innerHTML = '';
        const allYears = AppParams.years;
        const isAllSelected = allYears.length > 0 && AppState.selectedYears.length === allYears.length;

        const createBtn = (text, onClick, isActive, title) => {
            const btn = document.createElement('button');
            btn.className = `px-3 py-1.5 text-[10px] sm:text-xs rounded-full transition-all border font-medium ${isActive ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'}`;
            btn.textContent = text;
            btn.onclick = onClick;
            if(title) btn.title = title;
            return btn;
        };

        // Botão para resetar para 12 meses
        c.appendChild(createBtn('12 Meses', () => {
            this.setLast12Months();
            this.renderYearToggles();
            this.renderMonthButtons();
            this.updateCharts();
        }, false, "Visualizar últimos 12 meses"));

        c.appendChild(createBtn('Todos', () => this.toggleAllYears(), isAllSelected));

        AppParams.years.forEach(y => c.appendChild(createBtn(y, () => this.toggleReportYear(y), AppState.selectedYears.includes(y))));
    },

    renderMonthButtons() {
        const c = Utils.DOM.get('month-buttons-container');
        if(!c) return;
        c.innerHTML = '';
        const isM = Utils.DOM.getValue('filter-view') === 'monthly';
        const labels = isM ? AppParams.months.short : AppParams.quarters.short;
        const allInd = labels.map((_,i)=>i);

        AppState.selectedYears.forEach(y => {
            const div = document.createElement('div');
            div.className = 'flex flex-col gap-1 pb-2 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0';

            // Exibe o ano sempre que houver mais de um ano selecionado OU para clareza na visualização de 12 meses
            div.innerHTML = `<span class="text-[10px] font-bold text-gray-400 uppercase">${y}</span>`;

            const grp = document.createElement('div'); grp.className = 'flex flex-wrap gap-2';
            const sel = AppState.reportSelections[y] || [];

            const bAll = document.createElement('button'); bAll.textContent = 'Todos';
            bAll.onclick = () => this.toggleAllMonths(y, allInd);
            bAll.className = `px-3 py-1.5 text-[10px] sm:text-xs rounded-full transition-all font-medium ${sel.length === allInd.length ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`;
            grp.appendChild(bAll);

            labels.forEach((l, i) => {
                const b = document.createElement('button'); b.textContent = l;
                b.onclick = () => this.toggleMonth(y, i);
                const act = sel.includes(i);
                b.className = `px-3 py-1.5 text-[10px] sm:text-xs rounded-full transition-all ${act ? 'bg-blue-100 text-blue-700 border border-blue-200 font-bold dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800 shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:hover:bg-gray-700'}`;
                grp.appendChild(b);
            });
            div.appendChild(grp); c.appendChild(div);
        });
    },

    // --- Lógica de Gráficos (Mantendo correções anteriores) ---
    updateCharts() {
        const viewType = Utils.DOM.getValue('filter-view');
        const sourceFilter = Utils.DOM.getValue('filter-source');
        const isMonthly = viewType === 'monthly';

        const data = { labels: [], years: [], inc: [], exp: [], bal: [] };
        const projectionData = { labels: [], years: [], bal: [] };

        let isCustom = false;
        const fullCount = isMonthly ? 12 : 4;

        AppState.selectedYears.forEach(y => {
            const indices = AppState.reportSelections[y] || [];
            if (indices.length > 0 && indices.length < fullCount) isCustom = true;

            const res = DataService.getAggregated(y, isMonthly, indices, sourceFilter);

            res.labels.forEach((l, i) => {
                // Filtro visual de zeros
                if (res.income[i] === 0 && res.expenses[i] === 0 && res.balances[i] === 0) return;

                data.labels.push(l); data.years.push(y);
                data.inc.push(res.income[i]);
                data.exp.push(res.expenses[i]);
                // Fluxo de Caixa: Mostra apenas Santander
                data.bal.push(res.balancesSantander[i]);

                // Projeção: Usa saldo Conjunto
                projectionData.labels.push(l);
                projectionData.years.push(y);
                projectionData.bal.push(res.balances[i]);
            });
        });

        // Limite de visualização (scroll virtual) - Mantém 12 meses visíveis
        const maxVisible = 12;
        if (data.labels.length > maxVisible) {
            const s = data.labels.length - maxVisible;
            ['labels', 'years', 'inc', 'exp', 'bal'].forEach(k => data[k] = data[k].slice(s));
            projectionData.labels = projectionData.labels.slice(s);
            projectionData.years = projectionData.years.slice(s);
            projectionData.bal = projectionData.bal.slice(s);
        }

        let statusText = "";
        if (data.labels.length === 0) statusText = "Nenhum dado com valor no período selecionado";
        else if (isCustom) statusText = "Exibindo combinação personalizada (Filtro Ativo)";
        else statusText = `Visualizando ${data.labels.length} ${isMonthly ? 'meses' : 'trimestres'}`;

        if(sourceFilter !== 'all') {
            statusText += ` (${sourceFilter === 'account' ? 'Somente Conta' : 'Somente Fatura'})`;
        }

        Utils.DOM.updateText('chart-status-text', statusText);

        ChartManager.renderReport(data);

        const tInc = data.inc.reduce((a,b)=>a+b,0);
        const tExp = data.exp.reduce((a,b)=>a+b,0);
        const finalBalance = data.bal.length > 0 ? data.bal[data.bal.length - 1] : 0;
        const netFlow = tInc - tExp;

        Utils.DOM.updateText('total-gains', Utils.formatCurrency(tInc));
        Utils.DOM.updateText('total-costs', Utils.formatCurrency(tExp));
        Utils.DOM.updateText('yearly-balance', Utils.formatCurrency(finalBalance));
        Utils.DOM.updateText('avg-savings', tInc>0 ? ((netFlow/tInc)*100).toFixed(1) + '%' : '0%');

        this.updateProjection(projectionData);
    },

    updateProjection(histData) {
        const sliderVal = parseInt(Utils.DOM.getValue('projection-slider')) || 6;
        const viewType = Utils.DOM.getValue('filter-view');
        const lastVisibleVal = histData.bal.length > 0 ? histData.bal[histData.bal.length - 1] : 0;

        let trend = 0;
        if(histData.bal.length >= 2) {
            trend = (lastVisibleVal - histData.bal[0]) / (histData.bal.length - 1);
        }
        const stdDev = Math.max(Math.abs(lastVisibleVal) * 0.1, 100);

        let pData = {
            labels: [...histData.labels],
            years: [...histData.years],
            hist: [...histData.bal],
            proj: Array(histData.bal.length).fill(null),
            up: Array(histData.bal.length).fill(null),
            low: Array(histData.bal.length).fill(null)
        };

        if(pData.hist.length > 0) {
            const idx = pData.hist.length - 1;
            pData.proj[idx] = pData.up[idx] = pData.low[idx] = lastVisibleVal;
        }

        let curVal = lastVisibleVal;
        let currentYear = pData.years.length ? pData.years[pData.years.length-1] : new Date().getFullYear();
        let lastLabel = pData.labels.length ? pData.labels[pData.labels.length-1] : (viewType==='monthly'?'Dez':'Q4');
        let currentIdx = viewType === 'monthly' ? AppParams.months.short.indexOf(lastLabel) : AppParams.quarters.short.indexOf(lastLabel);
        if(currentIdx === -1) currentIdx = viewType === 'monthly' ? 11 : 3;

        for(let i=1; i<=sliderVal; i++) {
            currentIdx++;
            if (viewType === 'monthly') {
                if(currentIdx > 11) { currentIdx = 0; currentYear++; }
                pData.labels.push(AppParams.months.short[currentIdx]);
            } else {
                if(currentIdx > 3) { currentIdx = 0; currentYear++; }
                pData.labels.push(AppParams.quarters.short[currentIdx]);
            }
            pData.years.push(currentYear);
            curVal += (trend * 0.8);
            const int = 1.96 * stdDev * Math.sqrt(i * 0.5);

            pData.hist.push(null); pData.proj.push(curVal);
            pData.up.push(curVal + int);
            pData.low.push(curVal - int);
        }

        ChartManager.renderProjection(pData);
        this.renderProjectionAnalysis(lastVisibleVal, pData);
    },

    renderProjectionAnalysis(startVal, pData) {
        const finalProj = pData.proj[pData.proj.length - 1];
        const finalUp = pData.up[pData.up.length - 1];
        const finalLow = pData.low[pData.low.length - 1];
        const calcPct = (end, start) => start === 0 ? 0 : ((end - start) / Math.abs(start)) * 100;
        const formatCard = (title, val, pct) => `
            <div class="flex flex-col p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700">
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">${title}</span>
                <div class="flex items-baseline gap-2">
                    <span class="text-sm font-bold text-gray-700 dark:text-white">${Utils.formatCurrency(val)}</span>
                    <span class="text-xs font-bold ${pct >= 0 ? 'text-emerald-500' : 'text-rose-500'}">${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%</span>
                </div>
                <div class="text-[9px] text-gray-400 mt-1">vs Saldo Conjunto Atual</div>
            </div>`;
        Utils.DOM.updateHTML('projection-analysis',
            formatCard('Cenário Base', finalProj, calcPct(finalProj, startVal)) +
            formatCard('Cenário Otimista', finalUp, calcPct(finalUp, startVal)) +
            formatCard('Cenário Conservador', finalLow, calcPct(finalLow, startVal))
        );
    },

    // --- Actions (Handlers) ---
    toggleAllYears() {
        AppState.selectedYears = (AppState.selectedYears.length === AppParams.years.length) ? [AppParams.years[AppParams.years.length - 1]] : [...AppParams.years];
        AppState.selectedYears.sort();
        this.renderYearToggles(); this.renderMonthButtons(); this.updateCharts();
    },
    toggleReportYear(y) {
        y = parseInt(y);
        if(AppState.selectedYears.includes(y)) { if(AppState.selectedYears.length>1) AppState.selectedYears = AppState.selectedYears.filter(yr=>yr!==y); }
        else AppState.selectedYears.push(y);
        AppState.selectedYears.sort();
        this.renderYearToggles(); this.renderMonthButtons(); this.updateCharts();
    },
    toggleMonth(y, i) {
        let cur = AppState.reportSelections[y] || [];
        cur = cur.includes(i) ? cur.filter(x=>x!==i) : [...cur, i].sort((a,b)=>a-b);
        AppState.reportSelections[y] = cur;
        this.renderMonthButtons(); this.updateCharts();
    },
    toggleAllMonths(y, all) {
        const cur = AppState.reportSelections[y] || [];
        AppState.reportSelections[y] = cur.length === all.length ? [] : [...all];
        this.renderMonthButtons(); this.updateCharts();
    },
    handleViewChange() {
        const viewType = Utils.DOM.getValue('filter-view');
        // Se trocar para mensal, podemos querer voltar para 12 meses?
        // Por padrão, seleciona tudo, mas o usuário pode clicar no botão "12 Meses" se quiser.
        const allIndices = viewType === 'monthly' ? Array.from({length:12},(_,i)=>i) : [0,1,2,3];
        AppParams.years.forEach(y => AppState.reportSelections[y] = [...allIndices]);

        const slider = Utils.DOM.get('projection-slider');
        const [lMin, lMax, lVal] = [Utils.DOM.get('proj-slider-label-min'), Utils.DOM.get('proj-slider-label-max'), Utils.DOM.get('proj-slider-label-val')];

        if (viewType === 'monthly') {
            slider.max = 6; slider.value = 6; lMin.innerText = '1 Mês'; lMax.innerText = '6 Meses'; lVal.innerText = '6 Meses';
        } else {
            slider.max = 4; slider.value = 2; lMin.innerText = '1 Tri'; lMax.innerText = '4 Tri'; lVal.innerText = '2 Tri';
        }
        this.renderMonthButtons(); this.updateCharts();
    },
    handleProjectionSliderChange(v) {
        const view = Utils.DOM.getValue('filter-view');
        Utils.DOM.updateText('proj-slider-label-val', `${v} ${view==='monthly' ? (v==1?'Mês':'Meses') : (v==1?'Trimestre':'Trimestres')}`);
        this.updateCharts();
    }
};
