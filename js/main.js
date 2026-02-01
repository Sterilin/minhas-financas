// Expose globals for HTML event handlers
window.Handlers = {
    toggleTheme: () => window.UI.toggleTheme(),
    togglePrivacy: () => window.UI.togglePrivacy(),
    switchTab: (t) => window.UI.switchTab(t),
    handleViewChange: () => window.Report.handleViewChange(),
    handleProjectionSliderChange: (v) => window.Report.handleProjectionSliderChange(v),
    toggleAllYears: () => window.Report.toggleAllYears(),
    toggleReportYear: (y) => window.Report.toggleReportYear(y),
    toggleMonth: (y, i) => window.Report.toggleMonth(y, i),
    toggleAllMonths: (y, all) => window.Report.toggleAllMonths(y, all),
    toggleAutoSync: () => window.Compare.toggleAutoSync(),
    updateCompareSelectors: () => window.Compare.updateSelectors(),
    handleSliderChange: (v) => window.Compare.handleSliderChange(v),
    onSelectionChange: (src) => window.Compare.onSelectionChange(src),
    runComparison: (src) => window.Compare.runComparison(src)
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded');
    if (window.Utils && window.Utils.DOM) {
        window.Utils.DOM.updateText('current-date', new Date().toLocaleDateString('pt-BR'));
    }

    try {
        // Init modules if they exist
        if(window.Dashboard) window.Dashboard.init();
        if(window.Report) window.Report.init();
        if(window.Compare) window.Compare.init();
        if(window.Goals) window.Goals.init();
        if(window.Tables) window.Tables.init();

        if(window.DataService) window.DataService.init();

        console.log('Switching to dashboard...');
        if(window.UI) window.UI.switchTab('dashboard');
    } catch (e) {
        console.error('Error in initialization:', e);
    }
});
