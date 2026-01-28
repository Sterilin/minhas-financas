import { AppParams } from './core/Config.js';
import { Utils } from './core/Utils.js';
import { AppState } from './core/AppState.js';
import { DataService } from './core/DataService.js';
import { ChartManager } from './core/ChartManager.js';
import { UI } from './core/UI.js';
import { Dashboard } from './modules/Dashboard.js';
import { Report } from './modules/Report.js';
import { Compare } from './modules/Compare.js';
import { Goals } from './modules/Goals.js';
import { Tables } from './modules/Tables.js';

document.addEventListener('DOMContentLoaded', () => {
    // Expose globals for HTML event handlers
    window.AppParams = AppParams;
    window.Utils = Utils;
    window.AppState = AppState;
    window.UI = UI;
    window.DataService = DataService;
    window.ChartManager = ChartManager;

    window.Dashboard = Dashboard;
    window.Report = Report;
    window.Compare = Compare;
    window.Goals = Goals;
    window.Tables = Tables;

    // 1. Atualiza a data no cabeçalho
    if (Utils && Utils.DOM) {
        Utils.DOM.updateText('current-date', new Date().toLocaleDateString('pt-BR'));
    }

    // 2. Define os Handlers globais (usados nos onclicks do HTML)
    window.Handlers = {
        // UI & Tema
        toggleTheme: () => UI.toggleTheme && UI.toggleTheme(),
        togglePrivacy: () => UI.togglePrivacy && UI.togglePrivacy(),
        switchTab: (t) => UI.switchTab(t),

        // Relatórios (Report.js)
        handleViewChange: () => Report.handleViewChange(),
        handleProjectionSliderChange: (v) => Report.handleProjectionSliderChange(v),
        toggleAllYears: () => Report.toggleAllYears(),
        toggleReportYear: (y) => Report.toggleReportYear(y),
        toggleMonth: (y, i) => Report.toggleMonth(y, i),
        toggleAllMonths: (y, all) => Report.toggleAllMonths(y, all),

        // Comparativo (Compare.js)
        toggleAutoSync: () => Compare.toggleAutoSync(),
        updateCompareSelectors: () => Compare.updateSelectors(),
        handleSliderChange: (v) => Compare.handleSliderChange(v),
        onSelectionChange: (src) => Compare.onSelectionChange(src),
        runComparison: (src) => Compare.runComparison(src),

        // Goals
        openCalculator: () => Goals.openCalculator(),
        closeCalculator: () => Goals.closeCalculator(),
        calculateTotal: () => Goals.calculateTotal(),
        togglePlanMode: (m) => Goals.togglePlanMode(m),
        calculatePlan: () => Goals.calculatePlan(),
        copyTotal: () => Goals.copyTotal(),

        // Data/Tables
        switchSubTab: (t) => Tables.switchSubTab(t)
    };

    // 3. Inicializa os Módulos Específicos
    Dashboard.init();
    Report.init();
    Compare.init();
    Goals.init();
    Tables.init();

    // 4. Inicia o Carregamento de Dados
    DataService.init();

    // 5. Define a aba inicial (Dashboard)
    UI.switchTab('dashboard');
});
