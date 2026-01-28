import { AppParams } from './Config.js';
import { AppState } from './AppState.js';

export const UI = {
    // Define as abas esperadas pelo sistema
    validTabs: ['dashboard', 'report', 'compare', 'goals', 'data'],

    init() {
        // Inicializações globais de UI se necessário
    },

    toggleTheme() {
        document.documentElement.classList.toggle('dark');
        // Salva preferência (opcional)
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    },

    togglePrivacy() {
        const body = document.getElementById('app-body');
        if (body) body.classList.toggle('privacy-active');

        const btn = document.getElementById('btn-privacy');
        if (btn) {
            const icon = btn.querySelector('i');
            if (icon) {
                if (body && body.classList.contains('privacy-active')) {
                    icon.className = 'fa-regular fa-eye-slash';
                } else {
                    icon.className = 'fa-regular fa-eye';
                }
            }
        }
    },

    // --- FUNÇÃO QUE FALTAVA ---
    getCategoryColor(category) {
        // Verifica se a categoria e os parâmetros existem para evitar erros
        if (!category || !AppParams || !AppParams.colors || !AppParams.colors.categories) {
            return 'bg-gray-400'; // Cor padrão caso não encontre
        }
        return AppParams.colors.categories[category] || 'bg-gray-400';
    },

    switchTab(tabName) {
        // 1. SEGURANÇA: Verifica se a aba alvo existe no HTML
        const targetId = `view-${tabName}`;
        const targetSection = document.getElementById(targetId);

        if (!targetSection) {
            console.warn(`⚠️ UI: A seção '${targetId}' não foi encontrada no HTML. Verifique o index.html.`);
            return; // Impede o crash
        }

        // 2. Esconde todas as abas válidas
        this.validTabs.forEach(tab => {
            const el = document.getElementById(`view-${tab}`);
            if (el) {
                el.classList.add('hidden');
                el.classList.remove('fade-in');
            }
        });

        // 3. Mostra a aba alvo
        targetSection.classList.remove('hidden');
        targetSection.classList.add('fade-in');

        // 4. Atualiza os botões do menu
        this.updateNavButtons(tabName);

        // 5. Dispara evento para carregar gráficos/tabelas
        document.dispatchEvent(new CustomEvent('tabChanged', { detail: { tab: tabName } }));

        if(AppState) AppState.currentTab = tabName;
    },

    updateNavButtons(activeTab) {
        this.validTabs.forEach(btnName => {
            const btn = document.getElementById(`btn-${btnName}`);

            // SEGURANÇA: Se o botão não existir no HTML, pula
            if (!btn) return;

            if (btnName === activeTab) {
                // Ativo
                btn.classList.remove('text-gray-500', 'hover:text-gray-700', 'tab-inactive');
                btn.classList.add('text-blue-600', 'dark:text-blue-400', 'tab-active');
                btn.style.borderBottomColor = 'currentColor';
            } else {
                // Inativo
                btn.classList.remove('text-blue-600', 'dark:text-blue-400', 'tab-active');
                btn.classList.add('text-gray-500', 'hover:text-gray-700', 'tab-inactive');
                btn.style.borderBottomColor = 'transparent';
            }
        });
    }
};
