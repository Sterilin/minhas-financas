const UI = {
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
        document.dispatchEvent(new CustomEvent('themeChanged'));
    },

    togglePrivacy() {
        AppState.isPrivacy = !AppState.isPrivacy;
        document.body.classList.toggle('privacy-active', AppState.isPrivacy);
        Utils.DOM.updateHTML('btn-privacy', AppState.isPrivacy ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>');
    },

    switchTab(tabName) {
        // Esconder todos
        document.querySelectorAll('section[id^="view-"]').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('button[id^="btn-"]').forEach(el => {
            if (el.id.includes('dashboard') || el.id.includes('report') || el.id.includes('compare') || el.id.includes('goals') || el.id ===('btn-data')) {
                 el.className = 'tab-inactive py-3 px-1 transition-colors flex items-center gap-2 shrink-0 text-sm font-medium';
            }
        });
        
        // Destacar aba principal ativa
        let mainBtn = Utils.DOM.get(`btn-${tabName}`);
        
        // Se for sub-aba de dados, destaca o botão pai "Dados"
        const isSubNav = ['expenses', 'history', 'santander', 'consolidated', 'bradesco'].includes(tabName);
        if (isSubNav) mainBtn = Utils.DOM.get('btn-data');
        
        if(mainBtn) mainBtn.className = 'tab-active py-3 px-1 transition-colors flex items-center gap-2 shrink-0 text-sm font-medium';
        
        // Mostrar atual
        const view = Utils.DOM.get(`view-${tabName}`);
        if(view) view.classList.remove('hidden');
        
        // Lógica da Sub-navegação
        Utils.DOM.get('sub-nav-data').classList.toggle('hidden', !isSubNav);
        
        if (isSubNav) {
            Utils.DOM.get('btn-data').className = 'tab-active py-3 px-1 transition-colors flex items-center gap-2 shrink-0 text-sm font-medium';
            // Atualizada lista de sub-abas
            ['expenses', 'history', 'santander', 'consolidated', 'bradesco'].forEach(sub => {
                const b = Utils.DOM.get(`btn-${sub}`);
                if(b) b.className = `px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-2 ${tabName === sub ? 'subtab-active' : 'subtab-inactive'}`;
            });
        }

        document.dispatchEvent(new CustomEvent('tabChanged', { detail: { tab: tabName } }));
        
        ChartManager.resize();
    }
};
window.UI = UI;
