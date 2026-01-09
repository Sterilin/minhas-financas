const Tables = {
    init() {
        document.addEventListener('tabChanged', (e) => {
            const t = e.detail.tab;
            if(t === 'expenses') this.renderExpenses();
            if(t === 'history') this.renderHistory();
            if(t === 'santander') this.renderSantander();
            if(t === 'consolidated') this.renderConsolidated();
        });
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
                ? '<span class="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-[10px] px-2 py-0.5 rounded font-bold border border-rose-200 dark:border-rose-800">Cartão</span>'
                : '<span class="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] px-2 py-0.5 rounded font-bold border border-blue-200 dark:border-blue-800">Conta</span>';
            const isExp = t.type === 'expense';
            const valColor = isExp ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400';
            const sign = isExp ? '-' : '+';
            const displayVal = Math.abs(t.value);
            tr.innerHTML = `<td class="px-3 py-2 whitespace-nowrap text-xs font-medium">${t.date.toLocaleDateString('pt-BR')}</td>
                <td class="px-3 py-2 whitespace-nowrap">${sourceBadge}</td>
                <td class="px-3 py-2 whitespace-nowrap text-sm font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[200px]" title="${t.description}">${t.description}</td>
                <td class="px-3 py-2 whitespace-nowrap"><span class="flex items-center gap-2"><span class="w-2 h-2 rounded-full ${colorClass}"></span><span class="text-xs">${t.category}</span></span></td>
                <td class="px-3 py-2 whitespace-nowrap text-sm font-bold text-right ${valColor} val-privacy">${sign} ${Utils.formatCurrency(displayVal)}</td>`;
            frag.appendChild(tr);
        });
        tbody.innerHTML = ''; tbody.appendChild(frag);
    },

    renderSantander() {
        const thead = Utils.DOM.get('santander-table-head');
        const tbody = Utils.DOM.get('santander-table-body');
        const headers = DataService.santanderHeaders;
        const data = DataService.santanderTransactions;
        const indices = DataService.santanderIndices; 
        Utils.DOM.updateText('santander-status', `${data.length} registros encontrados`);
        if(headers.length > 0) {
            let headHTML = '<tr>';
            headers.forEach(h => {
                const isVal = h.toLowerCase().includes('valor') || h.toLowerCase().includes('amount');
                const align = isVal ? 'text-right' : 'text-left';
                headHTML += `<th class="px-3 py-2 whitespace-nowrap ${align}">${h}</th>`;
            });
            headHTML += '</tr>'; thead.innerHTML = headHTML;
        }
        if(data.length === 0) { tbody.innerHTML = `<tr><td colspan="${headers.length || 1}" class="text-center py-4 text-xs text-gray-400">Nenhum dado encontrado ou erro na leitura.</td></tr>`; return; }
        const frag = document.createDocumentFragment();
        data.slice(0, 100).forEach(t => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors";
            let rowHTML = '';
            t.data.forEach((cell, i) => {
                const hName = headers[i] ? headers[i].toLowerCase() : '';
                const isMoneyCol = hName.includes('valor') || hName.includes('amount');
                let displayContent = cell;
                let classes = "text-gray-600 dark:text-gray-400 text-left";
                let privacy = "";
                if (i === indices.cat) {
                    const colorClass = UI.getCategoryColor(cell);
                    displayContent = `<span class="${colorClass} text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm inline-block max-w-full truncate">${cell}</span>`;
                    classes = "text-left align-middle";
                }
                else if (isMoneyCol) {
                    classes = "font-bold text-gray-700 dark:text-gray-300 text-right";
                    privacy = "val-privacy";
                    if (cell.trim() !== '') {
                        let s = cell.replace(/["R$\s\xa0]/g, '');
                        if (s.indexOf(',') > -1) { s = s.replace(/\./g, '').replace(',', '.'); }
                        const n = parseFloat(s);
                        if (!isNaN(n)) displayContent = Utils.formatCurrency(n);
                    }
                }
                rowHTML += `<td class="px-3 py-2 whitespace-nowrap text-sm ${classes} ${privacy}">${displayContent}</td>`;
            });
            tr.innerHTML = rowHTML; frag.appendChild(tr);
        });
        tbody.innerHTML = ''; tbody.appendChild(frag);
    },

    renderExpenses() {
        const tbody = Utils.DOM.get('expenses-table-body');
        if(!tbody) return;
        const frag = document.createDocumentFragment();
        const sourceData = DataService.santanderTransactions.filter(t => t.category === 'Outros');
        if (sourceData.length === 0) { tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-xs text-gray-400">Nenhum registro "Outros" encontrado.</td></tr>'; return; }
        sourceData.slice(0, 50).forEach(t => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors";
            const colorClass = UI.getCategoryColor(t.category);
            tr.innerHTML = `<td class="px-3 py-2 whitespace-nowrap text-xs font-medium">${t.date.toLocaleDateString('pt-BR')}</td>
                <td class="px-3 py-2 whitespace-nowrap"><span class="flex items-center gap-2"><span class="w-2 h-2 rounded-full ${colorClass}"></span><span class="text-xs">${t.category}</span></span></td>
                <td class="px-3 py-2 whitespace-nowrap text-sm font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[150px]" title="${t.description}">${t.description}</td>
                <td class="px-3 py-2 whitespace-nowrap text-sm font-bold text-right text-rose-600 dark:text-rose-400 val-privacy">- ${Utils.formatCurrency(t.value)}</td>`;
            frag.appendChild(tr);
        });
        tbody.innerHTML = ''; tbody.appendChild(frag);
    },

    renderHistory() {
        const tbody = Utils.DOM.get('history-table-body');
        if(!tbody) return;
        const frag = document.createDocumentFragment();
        DataService.transactions.slice(0, 100).forEach(t => {
            const isInc = t.type === 'income';
            const label = isInc ? '<span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded dark:bg-emerald-900 dark:text-emerald-200">Receita</span>' : '<span class="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded dark:bg-rose-900 dark:text-rose-200">Despesa</span>';
            const catColor = AppParams.colors.categories[t.category] || 'bg-gray-400';
            const tr = document.createElement('tr');
            tr.className = "hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors";
            tr.innerHTML = `<td class="px-3 py-2 whitespace-nowrap text-xs font-medium">${t.date.toLocaleDateString('pt-BR')}</td>
                <td class="px-3 py-2 whitespace-nowrap">${label}</td>
                <td class="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400"><span class="flex items-center gap-2"><span class="w-2 h-2 rounded-full ${catColor}"></span><span class="text-xs">${t.category}</span></span></td>
                <td class="px-3 py-2 whitespace-nowrap text-sm font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[120px] sm:max-w-[200px]" title="${t.description}">${t.description}</td>
                <td class="px-3 py-2 whitespace-nowrap text-sm font-bold text-right ${isInc ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} val-privacy">${isInc?'+':'-'} ${Utils.formatCurrency(t.value)}</td>`;
            frag.appendChild(tr);
        });
        tbody.innerHTML = ''; tbody.appendChild(frag);
    }
};
Tables.init();