const UI = {
    // --- Utilitários de Interface ---
    getCategoryColor(name) {
        if(!name) return 'bg-gray-400';
        if (AppParams.colors.categories[name]) return AppParams.colors.categories[name];
        
        const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-fuchsia-500', 'bg-indigo-500', 'bg-teal-500', 'bg-lime-600', 'bg-orange-500', 'bg-sky-500'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) { hash = name.charCodeAt(i) + ((hash << 5) - hash); }
        return colors[Math.abs(hash) % colors.length];
    },

    toggleTheme() {
        AppState.isDark = !AppState.isDark;
        document.documentElement.classList.toggle('dark', AppState.isDark);
        Utils.DOM.updateHTML('btn-theme', AppState.isDark ? '<i class="fa-regular fa-sun"></i>' : '<i class="fa-regular fa-moon"></i>');
        ChartManager.updateTheme();
        
        // Disparar evento customizado se algum módulo precisar reagir
        document.dispatchEvent(new CustomEvent('themeChanged', { detail: { isDark: AppState.isDark } }));
    },
    
    togglePrivacy() {
        AppState.isPrivacy = !AppState.isPrivacy;
        Utils.DOM.get('app-body').classList.toggle('privacy-active', AppState.isPrivacy);
        Utils.DOM.updateHTML('btn-privacy', AppState.isPrivacy ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>');
    },

    // --- Navegação ---
    switchTab(tabName) {
        // Esconder todos
        ['dashboard', 'report', 'compare', 'goals', 'expenses', 'history', 'santander', 'consolidated'].forEach(t => {
            const el = Utils.DOM.get(`view-${t}`);
            if(el) el.classList.add('hidden');
            const btn = Utils.DOM.get(`btn-${t}`);
            if(btn) btn.className = `py-3 px-1 transition-colors flex items-center gap-2 shrink-0 text-sm font-medium ${t === tabName ? 'tab-active' : 'tab-inactive'}`;
        });
        
        // Mostrar atual
        const view = Utils.DOM.get(`view-${tabName}`);
        if(view) view.classList.remove('hidden');
        
        // Lógica da Sub-navegação
        const isSubNav = ['expenses', 'history', 'santander', 'consolidated'].includes(tabName);
        Utils.DOM.get('sub-nav-data').classList.toggle('hidden', !isSubNav);
        
        if (isSubNav) {
            Utils.DOM.get('btn-data').className = 'tab-active py-3 px-1 transition-colors flex items-center gap-2 shrink-0 text-sm font-medium';
            ['expenses', 'history', 'santander', 'consolidated'].forEach(sub => {
                const b = Utils.DOM.get(`btn-${sub}`);
                if(b) b.className = `px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-2 ${tabName === sub ? 'subtab-active' : 'subtab-inactive'}`;
            });
        } else {
            Utils.DOM.get('btn-data').className = 'tab-inactive py-3 px-1 transition-colors flex items-center gap-2 shrink-0 text-sm font-medium';
        }

        // Notifica módulos que a aba mudou (para renderizarem se necessário)
        document.dispatchEvent(new CustomEvent('tabChanged', { detail: { tab: tabName } }));
        
        // Hacks de compatibilidade com Chart.js (redimensionamento ao exibir)
        if(tabName === 'report' || tabName === 'compare') {
            setTimeout(() => { ChartManager.resize(); }, 100);
        }
    }
};
window.UI = UI;