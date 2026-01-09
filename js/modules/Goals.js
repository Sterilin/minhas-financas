const Goals = {
    init() {
        document.addEventListener('tabChanged', (e) => {
            if (e.detail.tab === 'goals') this.render();
        });
    },

    render() {
        const stats = DataService.getGoalsStats();
        Utils.DOM.updateText('goal-total-balance', Utils.formatCurrency(stats.currentBalance));
        Utils.DOM.updateText('goal-avg-expense', Utils.formatCurrency(stats.avgExp));
        Utils.DOM.updateText('goal-runway-val', stats.runway.toFixed(1));

        let pct = (stats.runway / 12) * 100;
        if(pct > 100) pct = 100;
        const bar = Utils.DOM.get('goal-runway-bar');
        if(bar) {
            bar.style.width = `${pct}%`;
            bar.className = `shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-1000 ease-out ${stats.runway < 3 ? 'bg-rose-500' : (stats.runway < 6 ? 'bg-yellow-500' : 'bg-emerald-500')}`;
        }
    }
};
Goals.init();