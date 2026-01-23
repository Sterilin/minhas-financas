const Tables = {
    init() {
        // 1. Tenta renderizar assim que inicia
        this.render();
        
        // 2. Se inscreve para receber avisos quando os dados mudarem
        if (window.DataService && typeof DataService.subscribe === 'function') {
            DataService.subscribe(() => this.render());
        }

        // 3. Ouve quando você clica nas abas para desenhar a tabela certa
        document.addEventListener('tabChanged', (e) => {
            // Pequeno delay para garantir que a tela trocou de aba
            setTimeout(() => this.render(), 50);
        });
    },

    // Função principal que decide qual tabela desenhar
    render() {
        // Helper para saber se um elemento está visível na tela
        const isVisible = (id) => {
            const el = document.getElementById(id);
            return el && !el.classList.contains('hidden');
        };

        // Verifica qual aba está aberta e chama a função correspondente
        if (isVisible('view-consolidated')) this.renderConsolidated();
        if (isVisible('view-bradesco')) this.renderBradesco();
        if (isVisible('view-santander')) this.renderSantanderCard();
        if (isVisible('view-history')) this.renderSantanderAccount();
    },

    // --- 1. EXTRATO CONSOLIDADO ---
    renderConsolidated() {
        const tbody = document.getElementById('consolidated-table-body');
        if (!tbody) return;

        const data = DataService.getConsolidatedTransactions();
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-3 py-4 text-center text-xs text-gray-400">Nenhum dado encontrado.</td></tr>';
            return;
        }

        // Limita a 100 itens para não travar a tela se tiver muitos dados
        const displayData = data.slice(0, 100);

        tbody.innerHTML = displayData.map(t => {
            const dateStr = t.date ? t.date.toLocaleDateString() : '-';
            const val = t.value || 0;
            const valClass = val >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
            
            // Ícones e cores por banco
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
                    <td class="px-3 py-3 text-xs text-gray-600 dark:text-gray-300 truncate max-w-[200px]" title="${t.description}">${t.description || 'Sem descrição'}</td>
                    <td class="px-3 py-3 text-xs text-gray-500 dark:text-gray-400"><span class="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">${t.category || 'Geral'}</span></td>
                    <td class="px-3 py-3 text-right font-bold text-xs ${valClass} val-privacy">${Utils.formatCurrency(val)}</td>
                </tr>
            `;
        }).join('');
    },

    // --- 2. BRADESCO ---
    renderBradesco() {
        const tbody = document.getElementById('bradesco-table-body');
        if (!tbody) return;
        const data = DataService.bradescoTransactions || [];
        this.renderGenericTable(tbody, data);
    },

    // --- 3. SANTANDER CONTA (Histórico) ---
    renderSantanderAccount() {
        const tbody = document.getElementById('history-table-body');
        if (!tbody) return;
        const data = DataService.santanderAccountTransactions || [];
        this.renderGenericTable(tbody, data);
    },

    // --- 4. SANTANDER CARTÃO ---
    renderSantanderCard() {
        const tbody = document.getElementById('santander-table-body');
        if (!tbody) return;
        
        const data = DataService.santanderCardTransactions || [];
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-3 py-4 text-center text-xs text-gray-400">Nenhum dado encontrado.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(t => {
            // No cartão: 'expense' = gasto (Vermelho), outros = pagamento/estorno (Verde)
            const isExpense = t.type === 'expense'; 
            const valClass = isExpense ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400';
            // Se for despesa, mostra negativo visualmente
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

    // --- HELPER GENÉRICO (Para tabelas simples) ---
    renderGenericTable(tbody, data) {
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-3 py-4 text-center text-xs text-gray-400">Nenhum dado encontrado.</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(t => {
            const val = t.value || 0;
            const valClass = val >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
            
            return `
                <tr class="bg-white border-b hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors">
                    <td class="px-3 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white text-xs">${t.date.toLocaleDateString()}</td>
                    <td class="px-3 py-3 text-xs text-gray-500 dark:text-gray-400">${val >= 0 ? 'Entrada' : 'Saída'}</td>
                    <td class="px-3 py-3 text-xs text-gray-600 dark:text-gray-300 truncate max-w-[200px]" title="${t.description}">${t.description}</td>
                    <td class="px-3 py-3 text-xs text-gray-500 dark:text-gray-400"><span class="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">${t.category}</span></td>
                    <td class="px-3 py-3 text-right font-bold text-xs ${valClass} val-privacy">${Utils.formatCurrency(val)}</td>
                </tr>
            `;
        }).join('');
    }
};

window.Tables = Tables;
