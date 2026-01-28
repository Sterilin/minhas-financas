const AppState = {
    isDark: false,
    isPrivacy: false,
    isAutoSync: false,
    selectedYears: [2025],
    reportSelections: { '2024': Array.from({length:12}, (_,i)=>i), '2025': Array.from({length:12}, (_,i)=>i) },
    charts: { report: null, projection: null, comparison: null, inflation: null, yoy: null }
};
window.AppState = AppState;