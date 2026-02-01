// Expose globals for HTML event handlers
window.Handlers = {
    toggleTheme: () => UI.toggleTheme(),
    togglePrivacy: () => UI.togglePrivacy(),
    switchTab: (t) => UI.switchTab(t),
    handleViewChange: () => Report.handleViewChange(),
    handleProjectionSliderChange: (v) => Report.handleProjectionSliderChange(v),
    toggleAllYears: () => Report.toggleAllYears(),
    toggleReportYear: (y) => Report.toggleReportYear(y),
    toggleMonth: (y, i) => Report.toggleMonth(y, i),
    toggleAllMonths: (y, all) => Report.toggleAllMonths(y, all),
    toggleAutoSync: () => Compare.toggleAutoSync(),
    updateCompareSelectors: () => Compare.updateSelectors(),
    handleSliderChange: (v) => Compare.handleSliderChange(v),
    onSelectionChange: (src) => Compare.onSelectionChange(src),
    runComparison: (src) => Compare.runComparison(src)
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded');
    if (window.Utils && Utils.DOM) {
        Utils.DOM.updateText('current-date', new Date().toLocaleDateString('pt-BR'));
    }

    try {
        // Init modules if they exist
        if(window.Dashboard) Dashboard.init();
        if(window.Report) Report.init();
        if(window.Compare) Compare.init();
        if(window.Goals) Goals.init();
        if(window.Tables) Tables.init();

        if(window.DataService) DataService.init();

        console.log('Switching to dashboard...');
        if(window.UI) UI.switchTab('dashboard');
    } catch (e) {
        console.error('Error in initialization:', e);
    }
});
