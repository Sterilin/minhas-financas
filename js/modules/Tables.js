const Tables = {
    init() {
        this.render();
        DataService.subscribe(() => this.render());
        document.addEventListener('tabChanged', (e) => {
            // Renderiza apenas se a aba ativa for uma das abas de dados/tabelas
            if (['consolidated', 'bradesco', 'santander', 'history', 'expenses'].includes(e.detail.tab)) {
                this.render();
            }
        });
    },

    render() {
        // Verifica qual subtabela está visível e renderiza
        if (!Utils.DOM.get('view-consolidated').classList.contains('hidden')) this.renderConsolidated();
        if (!Utils.DOM.get('view-bradesco').classList.contains('hidden')) this.renderBradesco();
        if (!Utils.DOM.get('view-santander').classList.contains('hidden')) this.renderSantanderCard();
        if (!Utils.DOM.get('view-history').classList.contains('hidden')) this.renderSantanderAccount();
        if (!Utils.DOM.get('view-expenses').classList.contains('hidden')) this.renderExpenses();
    },

    // --- TABELA CONSOLIDADA (COM CORES NA ORIGEM) ---
    renderConsolidated() {
        const tbody = Utils.DOM.get('consolidated-table-body');
        if (!tbody) return;

        const data = DataService.getConsolidatedTransactions();
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-3 py-4 text-center text-xs text-gray-400">Nenhum dado encontrado.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(t => {
            const date = t.date.toLocaleDateString();
            const valClass = t.value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
            
            // Lógica de Cores e Ícones para a Origem
            let sourceHtml = '';
            const s = t.sourceLabel.toLowerCase();
            
            if (s.includes('bradesco')) {
                // Bradesco: Vermelho Escuro
                sourceHtml = `<span class="font-bold text-red-700 dark:text-red-400 flex items-center gap-1"><i class="fa-solid fa-building-columns text-[10px]"></i> Bradesco</span>`;
            } else if (s.includes('santander')) {
                // Santander: Rose (para diferenciar)
                const icon = s.includes('cartão') ? 'fa-brands fa-cc-mastercard' : 'fa-solid fa-building-columns';
                sourceHtml = `<span class="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1"><i class="${icon} text-[10px]"></i> Santander</span>`;
            } else {
                sourceHtml = `<span class="text-gray-600 dark:text-gray-400">${t.sourceLabel}</span>`;
            }

            return `
                <tr class="bg-white border-b hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors">
                    <td class="px-3 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white text-xs">${date}</td>
                    <td class="px-3 py-3 text-xs">${sourceHtml}</td>
                    <td class="px-3 py-3 text-xs text-gray-600 dark:text-gray-300 truncate max-w-[150px]" title="${t.description}">${t.description}</td>
                    <td class="px-3 py-3 text-xs text-gray-500 dark:text-gray-400"><span class="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">${t.category}</span></td>
                    <td class="px-3 py-3 text-right font-bold text-xs ${valClass} val-privacy">${Utils.formatCurrency(t.value)}</td>
                </tr>
            `;
        }).join('');
    },

    renderBradesco() {
        const tbody = Utils.DOM.get('bradesco-table-body');
        if (!tbody) return;
        const data = DataService.bradescoTransactions || [];
        this.renderSimpleTable(tbody, data);
    },

    renderSantanderAccount() {
        const tbody = Utils.DOM.get('history-table-body');
        if (!tbody) return;
        const data = DataService.santanderAccountTransactions || [];
        this.renderSimpleTable(tbody, data);
    },

    renderSantanderCard() {
        const tbody = Utils.DOM.get('santander-table-body');
        if (!tbody) return;
        
        // No cartão, despesas são positivas no TSV original, mas queremos mostrar negativo visualmente se for gasto
        // O DataService já normaliza isso no getConsolidated, mas a lista crua (santanderCardTransactions) pode variar.
        // Vamos usar a lista crua, mas ajustando a cor.
        const data = DataService.santanderCardTransactions || [];
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-3 py-4 text-center text-xs text-gray-400">Nenhum dado encontrado.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(t => {
            // No contexto de fatura: valor positivo = compra (vermelho), valor negativo = pagamento (verde)
            // Mas verifique a lógica do seu DataService. Normalmente no parser: type: val > 0 ? 'expense' : 'income'
            const isExpense = t.type === 'expense'; 
            const valClass = isExpense ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400';
            const displayVal = isExpense ? -Math.abs(t.value) : Math.abs(t.value); // Força sinal visual

            return `
                <tr class="bg-white border-b hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors">
                    <td class="px-3 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white text-xs">${t.date.toLocaleDateString()}</td>
                    <td class="px-3 py-3 text-xs text-gray-500 dark:text-gray-400">Fatura</td>
                    <td class="px-3 py-3 text-xs text-gray-600 dark:text-gray-300 truncate max-w-[200px]">${t.description}</td>
                    <td class="px-3 py-3 text-xs text-gray-500 dark:text-gray-400"><span class="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">${t.category}</span></td>
                    <td class="px-3 py-3 text-right font-bold text-xs ${valClass} val-privacy">${Utils.formatCurrency(displayVal)}</td>
                </tr>
            `;
        }).join('');
    },

    renderExpenses() {
        const tbody = Utils.DOM.get('expenses-table-body');
        if (!tbody) return;
        // Exemplo: mostrar top despesas ou algo específico
        // Por padrão, se não houver lógica específica, limpa ou mostra consolidado filtrado
        tbody.innerHTML = '<tr><td colspan="4" class="px-3 py-4 text-center text-xs text-gray-400">Selecione uma visualização específica.</td></tr>';
    },

    // Helper para tabelas simples (Bradesco e Santander Conta)
    renderSimpleTable(tbody, data) {
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-3 py-4 text-center text-xs text-gray-400">Nenhum dado encontrado.</td></tr>';
            return;
        }
        tbody.innerHTML = data.map(t => {
            const valClass = t.value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
            return `
                <tr class="bg-white border-b hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors">
                    <td class="px-3 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white text-xs">${t.date.toLocaleDateString()}</td>
                    <td class="px-3 py-3 text-xs text-gray-500 dark:text-gray-400">${t.type === 'income' ? 'Entrada' : 'Saída'}</td>
                    <td class="px-3 py-3 text-xs text-gray-500 dark:text-gray-400"><span class="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">${t.category}</span></td>
                    <td class="px-3 py-3 text-xs text-gray-600 dark:text-gray-300 truncate max-w-[200px]" title="${t.description}">${t.description}</td>
                    <td class="px-3 py-3 text-right font-bold text-xs ${valClass} val-privacy">${Utils.formatCurrency(t.value)}</td>
                </tr>
            `;
        }).join('');
    }
};
window.Tables = Tables;
