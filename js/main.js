document.addEventListener('DOMContentLoaded', () => {
    // 1. Atualiza a data no cabeçalho
    if (window.Utils && Utils.DOM) {
        Utils.DOM.updateText('current-date', new Date().toLocaleDateString('pt-BR'));
    }

    // 2. Define os Handlers globais (usados nos onclicks do HTML)
    window.Handlers = {
        // UI & Tema
        toggleTheme: () => UI.toggleTheme && UI.toggleTheme(),
        togglePrivacy: () => UI.togglePrivacy && UI.togglePrivacy(),
        switchTab: (t) => UI.switchTab(t),

        // Relatórios (Report.js)
        handleViewChange: () => window.Report && Report.handleViewChange(),
        handleProjectionSliderChange: (v) => window.Report && Report.handleProjectionSliderChange(v),
        toggleAllYears: () => window.Report && Report.toggleAllYears(),
        toggleReportYear: (y) => window.Report && Report.toggleReportYear(y),
        toggleMonth: (y, i) => window.Report && Report.toggleMonth(y, i),
        toggleAllMonths: (y, all) => window.Report && Report.toggleAllMonths(y, all),

        // Comparativo (Compare.js)
        toggleAutoSync: () => window.Compare && Compare.toggleAutoSync(),
        updateCompareSelectors: () => window.Compare && Compare.updateSelectors(),
        handleSliderChange: (v) => window.Compare && Compare.handleSliderChange(v),
        onSelectionChange: (src) => window.Compare && Compare.onSelectionChange(src),
        runComparison: (src) => window.Compare && Compare.runComparison(src),
        initInflationSelector: () => window.Compare && Compare.initInflationSelector(),
        updateInflationChart: () => window.Compare && Compare.updateInflationChart()
    };

    // 3. Inicializa os Módulos Específicos (se existirem)
    if (window.Tables && typeof Tables.init === 'function') {
        Tables.init();
    }
    
    // 4. Inicia o Carregamento de Dados
    if (window.DataService) {
        DataService.init();
    }

    // 5. Define a aba inicial (Dashboard)
    // O novo UI.js protege contra erro se 'dashboard' não existir
    UI.switchTab('dashboard');
});
