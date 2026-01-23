const UI = {
    // Lista de abas que existem no HTML atual
    validTabs: ['dashboard', 'report', 'compare', 'goals', 'data'],

    init() {
        // Pode adicionar listeners globais de UI aqui se necessário
    },

    switchTab(tabName) {
        // 1. Validação de Segurança
        // Se tentar abrir uma aba que não existe, para o código antes de quebrar
        const targetSection = document.getElementById(`view-${tabName}`);
        if (!targetSection) {
            console.warn(`UI Error: Tentativa de acessar aba inexistente 'view-${tabName}'`);
            return;
        }

        // 2. Esconde TODAS as seções válidas
        this.validTabs.forEach(tab => {
            const el = document.getElementById(`view-${tab}`);
            if (el) {
                el.classList.add('hidden');
                // Remove animações para reiniciar quando abrir novamente
                el.classList.remove('fade-in'); 
            }
        });

        // 3. Mostra APENAS a seção alvo
        targetSection.classList.remove('hidden');
        targetSection.classList.add('fade-in'); // Adiciona efeito de entrada

        // 4. Atualiza os Botões do Menu (Estilo Ativo/Inativo)
        this.updateNavButtons(tabName);

        // 5. Avisa o sistema que a aba mudou (Importante para carregar tabelas/gráficos)
        document.dispatchEvent(new CustomEvent('tabChanged', { detail: { tab: tabName } }));
        
        // Salva a aba atual no Estado (opcional, mas bom para UX)
        if(window.AppState) AppState.currentTab = tabName;
    },

    updateNavButtons(activeTab) {
        // Lista de botões no menu superior
        const buttons = ['dashboard', 'report', 'compare', 'goals', 'data'];

        buttons.forEach(btnName => {
            const btn = document.getElementById(`btn-${btnName}`);
            if (!btn) return;

            if (btnName === activeTab) {
                // Estilos de Botão Ativo (Azul / Destaque)
                // Remove estilos inativos
                btn.classList.remove('text-gray-500', 'hover:text-gray-700', 'tab-inactive');
                // Adiciona estilos ativos (borda inferior ou cor)
                btn.classList.add('text-blue-600', 'dark:text-blue-400', 'tab-active');
                
                // Se o seu CSS usa border-bottom para tab-active:
                btn.style.borderBottomColor = 'currentColor'; 
            } else {
                // Estilos de Botão Inativo
                btn.classList.remove('text-blue-600', 'dark:text-blue-400', 'tab-active');
                btn.classList.add('text-gray-500', 'hover:text-gray-700', 'tab-inactive');
                
                btn.style.borderBottomColor = 'transparent';
            }
        });
    }
};

window.UI = UI;
