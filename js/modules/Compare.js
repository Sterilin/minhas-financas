import { DataService } from '../core/DataService.js';
import { AppState } from '../core/AppState.js';
import { AppParams } from '../core/Config.js';
import { Utils } from '../core/Utils.js';
import { ChartManager } from '../core/ChartManager.js';

export const Compare = {
    init() {
        DataService.subscribe(() => {
            this.updateSelectors();
        });

        document.addEventListener('tabChanged', (e) => {
            if (e.detail.tab === 'compare') {
                this.updateSelectors();
            }
        });
    },

    toggleAutoSync() {
        AppState.isAutoSync = !AppState.isAutoSync;
        if(AppState.isAutoSync) this.handleSliderChange(Utils.DOM.getValue('compare-slider'));
    },

    updateSelectors() {
        const type = Utils.DOM.getValue('compare-type');
        const [yA, yB, pA, pB] = [Utils.DOM.get('comp-year-a'), Utils.DOM.get('comp-year-b'), Utils.DOM.get('comp-period-a'), Utils.DOM.get('comp-period-b')];
        if(!yA) return;

        yA.innerHTML = yB.innerHTML = AppParams.years.map(y => `<option value="${y}">${y}</option>`).join('');
        const periods = type === 'monthly' ? AppParams.months.short : (type === 'quarterly' ? AppParams.quarters.short : []);
        pA.innerHTML = pB.innerHTML = periods.map((l,i) => `<option value="${i}">${l}</option>`).join('');

        const latest = DataService.getLatestPeriod();
        yA.value = AppParams.years.includes(latest.year) ? latest.year : AppParams.years[AppParams.years.length-1];
        pA.value = type === 'monthly' ? latest.month : Math.floor(latest.month / 3);
        yB.value = yA.value; pB.value = pA.value;

        const sCont = Utils.DOM.get('slider-container');
        const slider = Utils.DOM.get('compare-slider');
        if(type === 'yearly') {
            sCont.style.display = 'none';
            pA.style.display='none'; pB.style.display='none';
            this.runComparison('init');
        } else {
            sCont.style.display = 'block';
            pA.style.display='block'; pB.style.display='block';
            if(type === 'monthly') {
                slider.min=3; slider.max=12; slider.step=3; slider.value=12;
                Utils.DOM.updateHTML('slider-labels', [3,6,9,12].map(i=>`<span id="label-${i}">${i} Meses</span>`).join(''));
            } else {
                slider.min=1; slider.max=4; slider.step=1; slider.value=4;
                Utils.DOM.updateHTML('slider-labels', [1,2,3,4].map(i=>`<span id="label-${i}">${i} Tri</span>`).join(''));
            }
            this.handleSliderChange(slider.value);
        }
    },

    handleSliderChange(val) {
        const type = Utils.DOM.getValue('compare-type');
        if(type === 'yearly') return;

        Utils.DOM.updateText('compare-diff-indicator', `${val} ${type==='monthly'?'Meses':'Trimestres'} de diferença`);
        document.querySelectorAll('#slider-labels span').forEach(s => s.className='');
        const lbl = document.getElementById(`label-${val}`);
        if(lbl) lbl.className = "text-indigo-500 font-bold";

        const [yA, pA] = [parseInt(Utils.DOM.getValue('comp-year-a')), parseInt(Utils.DOM.getValue('comp-period-a'))];
        const factor = type === 'monthly' ? 12 : 4;
        const totB = (yA * factor + pA) - parseInt(val);

        const yB = Math.floor(totB / factor);
        let pB = totB % factor;
        if(pB < 0) pB += factor;

        const selY = Utils.DOM.get('comp-year-b').querySelector(`option[value="${yB}"]`);
        if(selY) { Utils.DOM.get('comp-year-b').value = yB; Utils.DOM.get('comp-period-b').value = pB; }

        this.runComparison('slider');
    },

    onSelectionChange(src) {
        if(src === 'A' && AppState.isAutoSync) this.handleSliderChange(Utils.DOM.getValue('compare-slider'));
        else this.runComparison(src);
    },

    runComparison(src) {
        const type = Utils.DOM.getValue('compare-type');
        const [yA, pA] = [parseInt(Utils.DOM.getValue('comp-year-a')), parseInt(Utils.DOM.getValue('comp-period-a'))];
        const [yB, pB] = [parseInt(Utils.DOM.getValue('comp-year-b')), parseInt(Utils.DOM.getValue('comp-period-b'))];

        if((src === 'A' || src === 'B') && !AppState.isAutoSync && type !== 'yearly') {
            const f = type === 'monthly' ? 12 : 4;
            const diff = Math.abs((yA*f+pA) - (yB*f+pB));
            const slider = Utils.DOM.get('compare-slider');
            if(diff >= slider.min && diff <= slider.max && diff % slider.step === 0) {
                slider.value = diff;
                this.handleSliderChange(diff); return;
            } else {
                Utils.DOM.updateText('compare-diff-indicator', "Personalizado");
                document.querySelectorAll('#slider-labels span').forEach(s => s.className='');
            }
        }

        const getData = (y, p) => {
            const res = DataService.getMonthly(y);
            if(!res) return { inc:0, exp:0, bal:0 };
            let i=0, e=0;
            if(type === 'monthly') { i = res.income[p]; e = res.expenses[p]; }
            else if(type === 'quarterly') { const s = p*3; i = res.income.slice(s,s+3).reduce((a,b)=>a+b,0); e = res.expenses.slice(s,s+3).reduce((a,b)=>a+b,0); }
            else { i = res.income.reduce((a,b)=>a+b,0); e = res.expenses.reduce((a,b)=>a+b,0); }
            return { inc: i, exp: e, bal: i - e };
        };

        const dA = getData(yA, pA), dB = getData(yB, pB);
        let lA = yA, lB = yB;
        if(type !== 'yearly') {
            const arr = type === 'monthly' ? AppParams.months.short : AppParams.quarters.short;
            lA = `${arr[pA]}/${yA.toString().substr(2)}`; lB = `${arr[pB]}/${yB.toString().substr(2)}`;
        }
        ChartManager.renderCompare([lA, lB], dA, dB);

        const genBadge = (lbl, vA, vB, invertLogic) => {
            const d = vA - vB;
            const pct = vB === 0 ? (vA === 0 ? 0 : 100) : ((d / vB) * 100).toFixed(1);
            const isBad = invertLogic ? d > 0 : d < 0;
            const color = isBad ? 'text-rose-500' : 'text-emerald-500';
            const icon = d >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
            return `<div class="flex flex-col items-center justify-center p-2 bg-white dark:bg-gray-800 rounded shadow-sm border border-gray-100 dark:border-gray-700">
                    <div class="text-[10px] uppercase text-gray-400 mb-1">${lbl}</div>
                    <div class="flex items-center gap-1 font-bold text-xs ${color}"><i class="fa-solid ${icon}"></i> ${Math.abs(pct)}%</div>
                    <div class="text-[9px] text-gray-400 mt-0.5">${d > 0 ? '+' : '-'} ${Utils.formatCurrency(Math.abs(d))}</div>
                    </div>`;
        };
        Utils.DOM.updateHTML('compare-flow-badges', genBadge('Receita', dA.inc, dB.inc, false) + genBadge('Gastos', dA.exp, dB.exp, true) + genBadge('Saldo', dA.bal, dB.bal, false));

        const max = Math.max(Math.abs(dA.bal), Math.abs(dB.bal)) || 1;
        const genBar = (v, name, color) => {
            const pct = max===0 ? 0 : Math.round((Math.abs(v)/max)*100);
            const valColor = v >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400';
            return `<div class="flex flex-col items-center h-full justify-end group w-20">
                    <span class="mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">${name}</span>
                    <div class="relative w-14 h-48 bg-gray-100 dark:bg-gray-700 rounded-2xl overflow-hidden flex items-end shadow-inner">
                        <div class="w-full transition-all duration-700 ease-out rounded-t-xl" style="height: ${pct}%; background-color: ${color}; opacity: 0.9;"></div>
                    </div>
                    <div class="mt-3 text-center"><div class="text-sm font-bold ${valColor}">${Utils.formatCurrency(v)}</div><div class="text-[10px] text-gray-400 font-normal">(${pct}%)</div></div>
                    </div>`;
        };
        Utils.DOM.updateHTML('balance-evolution-container', genBar(dA.bal, 'Ref. (A)', '#3b82f6') + genBar(dB.bal, 'Comp. (B)', '#6366f1'));
    }
};
