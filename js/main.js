// js/main.js
document.addEventListener('DOMContentLoaded', () => {
    Utils.DOM.updateText('current-date', new Date().toLocaleDateString('pt-BR'));

    window.Handlers = {
        // ... (seus handlers anteriores mantidos aqui) ...
        toggleTheme: () => UI.toggleTheme(),
        togglePrivacy: () => UI.togglePrivacy(),
        switchTab: (t) => UI.switchTab(t),
        // ...
        // Report
        handleViewChange: () => Report.handleViewChange(),
        handleProjectionSliderChange: (v) => Report.handleProjectionSliderChange(v),
        toggleAllYears: () => Report.toggleAllYears(),
        toggleReportYear: (y) => Report.toggleReportYear(y),
        toggleMonth: (y, i) => Report.toggleMonth(y, i),
        toggleAllMonths: (y, all) => Report.toggleAllMonths(y, all),
        // Compare
        toggleAutoSync: () => Compare.toggleAutoSync(),
        updateCompareSelectors: () => Compare.updateSelectors(),
        handleSliderChange: (v) => Compare.handleSliderChange(v),
        onSelectionChange: (src) => Compare.onSelectionChange(src),
        runComparison: (src) => Compare.runComparison(src),
        initInflationSelector: () => Compare.initInflationSelector(),
        updateInflationChart: () => Compare.updateInflationChart()
    };

    // 1. Força a aba Dashboard a ser a ativa visualmente logo no início
    UI.switchTab('dashboard');

    // 2. Inicia o carregamento de dados
    DataService.init();
});