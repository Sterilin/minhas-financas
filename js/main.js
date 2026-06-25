import { Utils } from './core/Utils.js';
import { UI } from './core/UI.js';
import { DataService } from './core/DataService.js';
import { Dashboard } from './modules/Dashboard.js';
import { Report } from './modules/Report.js';
import { Compare } from './modules/Compare.js';
import { Goals } from './modules/Goals.js';
import { Tables } from './modules/Tables.js';

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

// Also expose Tables to handle its specific onclick in index.html (Tables.switchSubTab)
window.Tables = Tables;
window.Goals = Goals;

// Expose DataService for Playwright verification
window.DataService = DataService;

document.addEventListener('DOMContentLoaded', () => {
    if (Utils && Utils.DOM) {
        Utils.DOM.updateText('current-date', new Date().toLocaleDateString('pt-BR'));
    }

    try {
        // Init modules if they exist
        if(Dashboard) Dashboard.init();
        if(Report) Report.init();
        if(Compare) Compare.init();
        if(Goals) Goals.init();
        if(Tables) Tables.init();

        if(DataService) DataService.init();

        if(UI) UI.switchTab('dashboard');
    } catch (e) {
        console.error('Error in initialization:', e);
    }
});
