const Tables = {
    init() {
        // Tenta renderizar imediatamente
        this.render();
        
        // Se inscreve para atualizações de dados
        if (window.DataService && typeof DataService.subscribe === 'function') {
            DataService.subscribe(() => this.render());
        }

        // Ouve mudanças de aba para atualizar a visualização
        document.addEventListener('tabChanged', (e) => {
            const activeTab = e.detail && e.detail.tab ? e.detail.tab : '';
            // Lista de abas que contêm tabelas
            const tableTabs = ['consolidated', 'bradesco', 'santander', 'history', 'expenses', 'data'];
            
            if (tableTabs.includes(activeTab)) {
                // Pequeno delay para garantir que a classe 'hidden' já foi removida do HTML
                setTimeout(() => this.render(), 50);
            }
            const t = e.detail.tab;
            if(t === 'bradesco') this.renderBradesco();
            if(t === 'history') this.renderHistory();     // Agora exibe Conta Santander
            if(t === 'santander') this.renderSantander(); // Agora exibe Cartão Santander
            if(t === 'consolidated') this.renderConsolidated();
        });
    },

    render() {
        // Helper para verificar visibilidade
        const isVisible = (id) => {
            const el = document.getElementById(id);
            return el && !el.classList.contains('hidden');
        };

        // Renderiza apenas a tabela que está visível na tela
        if (isVisible('view-consolidated')) this.renderConsolidated();
        if (isVisible('view-bradesco')) this.renderBradesco();
        if (isVisible('view-santander')) this.renderSantanderCard();
        if (isVisible('view-history')) this.renderSantanderAccount();
        if (isVisible('view-expenses')) this.renderExpenses();
    // Renderiza Bradesco (Já configurado anteriormente, mantido para consistência)
    renderBradesco() {
        const tbody = Utils.DOM.get('bradesco-table-body');
        if(!tbody) return;
        this.renderGenericTable(tbody, DataService.bradescoTransactions);
    },

    // --- TABELA CONSOLIDADA ---
    renderConsolidated() {
        const tbody = document.getElementById('consolidated-table-body');
        if (!tbody) return;

        // Proteção caso o DataService ainda não tenha carregado
        if (!window.DataService || typeof DataService.getConsolidatedTransactions !== 'function') {
            tbody.innerHTML = '<tr><td colspan="5" class="px-3 py-4 text-center text-xs text-gray-400">Carregando dados...</td></tr>';
            return;
        }
    // Renderiza Conta Santander
    renderHistory() {
        const tbody = Utils.DOM.get('history-table-body'); // ID no HTML é 'history-table-body' para a seção view-history
        if(!tbody) return;
        this.renderGenericTable(tbody, DataService.santanderAccountTransactions);
    },

        const data = DataService.getConsolidatedTransactions();
    // Renderiza Cartão Santander
    renderSantander() {
        const tbody = Utils.DOM.get('santander-table-body');
        const status = Utils.DOM.get('santander-status');
        if(!tbody) return;

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-3 py-4 text-center text-xs text-gray-400">Nenhum dado encontrado.</td></tr>';
        const data = DataService.santanderCardTransactions || [];
        if(status) status.innerText = `${data.length} registros`;

        if(data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-xs text-gray-400">Nenhum registro encontrado.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(t => {
            const dateStr = t.date ? t.date.toLocaleDateString() : '-';
            const val = t.value || 0;
            const valClass = val >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
            
            // Lógica de Cores e Ícones para a Origem
            let sourceHtml = '';
            const s = (t.sourceLabel || '').toLowerCase();
            
            if (s.includes('bradesco')) {
                sourceHtml = `<span class="font-bold text-red-700 dark:text-red-400 flex items-center gap-1"><i class="fa-solid fa-building-columns text-[10px]"></i> Bradesco</span>`;
            } else if (s.includes('santander')) {
                const icon = s.includes('cartão') ? 'fa-brands fa-cc-mastercard' : 'fa-solid fa-building-columns';
                sourceHtml = `<span class="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1"><i class="${icon} text-[10px]"></i> Santander</span>`;
            } else {
                sourceHtml = `<span class="text-gray-600 dark:text-gray-400">${t.sourceLabel || 'Outros'}</span>`;
            }

            return `
                <tr class="bg-white border-b hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors">
                    <td class="px-3 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white text-xs">${dateStr}</td>
                    <td class="px-3 py-3 text-xs">${sourceHtml}</td>
                    <td class="px-3 py-3 text-xs text-gray-600 dark:text-gray-300 truncate max-w-[150px]" title="${t.description}">${t.description || 'Sem descrição'}</td>
                    <td class="px-3 py-3 text-xs text-gray-500 dark:text-gray-400"><span class="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">${t.category || 'Geral'}</span></td>
                    <td class="px-3 py-3 text-right font-bold text-xs ${valClass} val-privacy">${Utils.formatCurrency(val)}</td>
                </tr>
            `;
        }).join('');
    },

    // --- TABELA BRADESCO ---
    renderBradesco() {
        const tbody = document.getElementById('bradesco-table-body');
        if (!tbody) return;
        const data = (window.DataService && DataService.bradescoTransactions) ? DataService.bradescoTransactions : [];
        this.renderSimpleTable(tbody, data);
    },

    // --- TABELA SANTANDER CONTA ---
    renderSantanderAccount() {
        const tbody = document.getElementById('history-table-body');
        if (!tbody) return;
        const data = (window.DataService && DataService.santanderAccountTransactions) ? DataService.santanderAccountTransactions : [];
        this.renderSimpleTable(tbody, data);
        const frag = document.createDocumentFragment();
        data.slice(0, 100).forEach(t => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors";
            const valClass = t.value > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400';
            tr.innerHTML = `<td class="px-3 py-2 whitespace-nowrap text-xs font-medium">${t.date.toLocaleDateString('pt-BR')}</td>
                <td class="px-3 py-2 whitespace-nowrap text-sm font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[200px]" title="${t.description}">${t.description}</td>
                <td class="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">${t.category || '-'}</td>
                <td class="px-3 py-2 whitespace-nowrap text-right text-xs font-bold ${valClass} val-privacy">${Utils.formatCurrency(Math.abs(t.value))}</td>`;
            frag.appendChild(tr);
        });
        tbody.innerHTML = '';
        tbody.appendChild(frag);
    },

    // --- TABELA SANTANDER CARTÃO ---
    renderSantanderCard() {
        const tbody = document.getElementById('santander-table-body');
        if (!tbody) return;
        
        const data = (window.DataService && DataService.santanderCardTransactions) ? DataService.santanderCardTransactions : [];
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-3 py-4 text-center text-xs text-gray-400">Nenhum dado encontrado.</td></tr>';
    renderConsolidated() {
        const tbody = Utils.DOM.get('consolidated-table-body');
        if(!tbody) return;
        const data = DataService.getConsolidatedTransactions();
        if(data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-xs text-gray-400">Nenhum registro consolidado encontrado.</td></tr>';
            return;
        }
        const frag = document.createDocumentFragment();
        data.slice(0, 100).forEach(t => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors";
            const colorClass = UI.getCategoryColor(t.category);
            
            let badge = '<span class="bg-gray-100 text-gray-700 text-[10px] px-1.5 py-0.5 rounded">Conta</span>';
            if (t.source === 'santander_card') badge = '<span class="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-[10px] px-1.5 py-0.5 rounded border border-purple-200">Cartão</span>';
            else if (t.source === 'bradesco') badge = '<span class="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] px-1.5 py-0.5 rounded border border-red-200">Bradesco</span>';
            else if (t.source === 'santander_acc') badge = '<span class="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] px-1.5 py-0.5 rounded border border-red-200">Santander</span>';

        tbody.innerHTML = data.map(t => {
            // No cartão, despesa é positivo no dado bruto, mas queremos mostrar vermelho/negativo se for gasto
            const isExpense = t.type === 'expense'; 
            const valClass = isExpense ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400';
            const displayVal = isExpense ? -Math.abs(t.value) : Math.abs(t.value);

            return `
                <tr class="bg-white border-b hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors">
                    <td class="px-3 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white text-xs">${t.date.toLocaleDateString()}</td>
                    <td class="px-3 py-3 text-xs text-gray-500 dark:text-gray-400">Fatura</td>
                    <td class="px-3 py-3 text-xs text-gray-600 dark:text-gray-300 truncate max-w-[200px]" title="${t.description}">${t.description}</td>
                    <td class="px-3 py-3 text-xs text-gray-500 dark:text-gray-400"><span class="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">${t.category}</span></td>
                    <td class="px-3 py-3 text-right font-bold text-xs ${valClass} val-privacy">${Utils.formatCurrency(displayVal)}</td>
                </tr>
            `;
        }).join('');
    },

    // --- TABELA OUTROS/DESPESAS ---
    renderExpenses() {
        const tbody = document.getElementById('expenses-table-body');
        if (!tbody) return;
        // Placeholder ou lógica customizada
        tbody.innerHTML = '<tr><td colspan="4" class="px-3 py-4 text-center text-xs text-gray-400">Selecione uma visualização específica.</td></tr>';
            const isInc = t.value >= 0;
            
            tr.innerHTML = `<td class="px-3 py-2 whitespace-nowrap text-xs font-medium">${t.date.toLocaleDateString('pt-BR')}</td>
                <td class="px-3 py-2 whitespace-nowrap">${badge}</td>
                <td class="px-3 py-2 whitespace-nowrap text-sm font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[150px]" title="${t.description}">${t.description}</td>
                <td class="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400"><span class="flex items-center gap-2"><span class="w-2 h-2 rounded-full ${colorClass}"></span>${t.category}</span></td>
                <td class="px-3 py-2 whitespace-nowrap text-right text-xs font-bold ${isInc ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} val-privacy">${Utils.formatCurrency(t.value)}</td>`;
            frag.appendChild(tr);
        });
        tbody.innerHTML = '';
        tbody.appendChild(frag);
    },

    // Helper genérico
    renderSimpleTable(tbody, data) {
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-3 py-4 text-center text-xs text-gray-400">Nenhum dado encontrado.</td></tr>';
    // Helper reutilizável para tabelas de Extrato Bancário (Bradesco e Santander Conta)
    renderGenericTable(tbody, data) {
        if(!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-xs text-gray-400">Nenhum registro encontrado.</td></tr>';
            return;
        }
        tbody.innerHTML = data.map(t => {
            const val = t.value || 0;
            const valClass = val >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
            return `
                <tr class="bg-white border-b hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors">
                    <td class="px-3 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white text-xs">${t.date.toLocaleDateString()}</td>
                    <td class="px-3 py-3 text-xs text-gray-500 dark:text-gray-400">${val >= 0 ? 'Entrada' : 'Saída'}</td>
                    <td class="px-3 py-3 text-xs text-gray-500 dark:text-gray-400"><span class="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">${t.category}</span></td>
                    <td class="px-3 py-3 text-xs text-gray-600 dark:text-gray-300 truncate max-w-[200px]" title="${t.description}">${t.description}</td>
                    <td class="px-3 py-3 text-right font-bold text-xs ${valClass} val-privacy">${Utils.formatCurrency(val)}</td>
                </tr>
        const frag = document.createDocumentFragment();
        data.slice(0, 100).forEach(t => {
            const isIncome = t.value >= 0;
            const badge = isIncome 
                ? '<span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded dark:bg-emerald-900 dark:text-emerald-200">Entrada</span>' 
                : '<span class="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded dark:bg-rose-900 dark:text-rose-200">Saída</span>';
            
            const tr = document.createElement('tr');
            tr.className = "hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors";
            tr.innerHTML = `
                <td class="px-3 py-2 whitespace-nowrap text-xs font-medium">${t.date.toLocaleDateString('pt-BR')}</td>
                <td class="px-3 py-2 whitespace-nowrap">${badge}</td>
                <td class="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">${t.category}</td>
                <td class="px-3 py-2 whitespace-nowrap text-sm font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[200px]" title="${t.description}">${t.description}</td>
                <td class="px-3 py-2 whitespace-nowrap text-right text-xs font-bold ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} val-privacy">${Utils.formatCurrency(t.value)}</td>
            `;
        }).join('');
            frag.appendChild(tr);
        });
        tbody.innerHTML = '';
        tbody.appendChild(frag);
    }
};
window.Tables = Tables;
