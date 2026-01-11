const Tables = {
    init() {
        document.addEventListener('tabChanged', (e) => {
            const t = e.detail.tab;
            if(t === 'bradesco') this.renderBradesco(); // Nova aba
            if(t === 'history') this.renderHistory();
            if(t === 'santander') this.renderSantander();
            if(t === 'consolidated') this.renderConsolidated();
        });
    },

    // Nova função: Tabela Bradesco
    renderBradesco() {
        const tbody = Utils.DOM.get('bradesco-table-body');
        if(!tbody) return;
        
        // Usa a nova lista específica do DataService
        const data = DataService.bradescoTransactions || [];
        
        if(data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-xs text-gray-400">Nenhum registro encontrado.</td></tr>';
            return;
        }

        const frag = document.createDocumentFragment();
        data.slice(0, 100).forEach(t => { // Limite visual
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
            frag.appendChild(tr);
        });
        tbody.innerHTML = '';
        tbody.appendChild(frag);
    },

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
            const sourceBadge = t.sourceType === 'card' 
                ? '<span class="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-[10px] px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800">Cartão</span>'
                : (t.source === 'bradesco' 
                    ? '<span class="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800">Bradesco</span>'
                    : '<span class="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 text-[10px] px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">Conta</span>');
            
            const isInc = t.value >= 0;
            
            tr.innerHTML = `<td class="px-3 py-2 whitespace-nowrap text-xs font-medium">${t.date.toLocaleDateString('pt-BR')}</td>
                <td class="px-3 py-2 whitespace-nowrap">${sourceBadge}</td>
                <td class="px-3 py-2 whitespace-nowrap text-sm font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[150px]" title="${t.description}">${t.description}</td>
                <td class="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400"><span class="flex items-center gap-2"><span class="w-2 h-2 rounded-full ${colorClass}"></span>${t.category}</span></td>
                <td class="px-3 py-2 whitespace-nowrap text-right text-xs font-bold ${isInc ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} val-privacy">${Utils.formatCurrency(t.value)}</td>`;
            frag.appendChild(tr);
        });
        tbody.innerHTML = '';
        tbody.appendChild(frag);
    },

    renderSantander() {
        const thead = Utils.DOM.get('santander-table-head');
        const tbody = Utils.DOM.get('santander-table-body');
        const status = Utils.DOM.get('santander-status');
        if(!tbody) return;
        
        // Usa lista específica do Santander
        const data = DataService.santanderTransactions || [];
        
        if(status) status.innerText = `${data.length} registros`;
        if(thead) {
            // Cabeçalho dinâmico baseado no TSV (opcional, aqui fixamos para simplicidade)
            thead.innerHTML = '<tr><th class="px-3 py-2 rounded-l-lg">Data</th><th class="px-3 py-2">Descrição</th><th class="px-3 py-2">Categoria</th><th class="px-3 py-2 text-right rounded-r-lg">Valor</th></tr>';
        }

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

    renderHistory() {
        // Renomeado para Conta Santander - Usa lógica similar ao Santander mas focada em Conta se houver separação futura
        // Por enquanto, mostra Santander também ou vazio se não houver dados de conta específicos
        this.renderSantander(); 
    }
};

Tables.init();
