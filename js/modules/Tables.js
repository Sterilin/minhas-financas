const Tables = {
    currentSubTab: 'audit', // Aba padrão

    init() {
        // Tenta renderizar assim que inicia
        this.render();

        // Se inscreve para atualizações de dados
        if (window.DataService && typeof DataService.subscribe === 'function') {
            DataService.subscribe(() => this.render());
        }

        // Ouve a troca de abas do menu principal
        document.addEventListener('tabChanged', (e) => {
            if (e.detail && e.detail.tab === 'data') {
                // Pequeno delay para garantir que o DOM está visível
                setTimeout(() => this.render(), 50);
            }
        });
    },

    // Chamado pelos botões do submenu no HTML
    switchSubTab(tabName) {
        this.currentSubTab = tabName;
        
        // 1. Atualiza visual dos botões
        const buttons = ['audit', 'bradesco', 'santander-acc', 'santander-card'];
        buttons.forEach(btn => {
            const el = document.getElementById(`tab-btn-${btn}`);
            if (el) {
                if (btn === tabName) {
                    el.className = "px-3 py-1.5 text-xs font-medium rounded-md transition-all shadow-sm bg-white text-gray-800 dark:bg-gray-600 dark:text-white whitespace-nowrap";
                } else {
                    el.className = "px-3 py-1.5 text-xs font-medium rounded-md transition-all text-gray-500 hover:text-gray-700 dark:text-gray-400 whitespace-nowrap";
                }
            }
        });

        // 2. Alterna a visibilidade das áreas (Auditoria vs Tabelas)
        const auditView = document.getElementById('subview-audit');
        const bankView = document.getElementById('subview-bank');

        if (tabName === 'audit') {
            if(auditView) auditView.classList.remove('hidden');
            if(bankView) bankView.classList.add('hidden');
        } else {
            if(auditView) auditView.classList.add('hidden');
            if(bankView) bankView.classList.remove('hidden');
        }

        // 3. Renderiza o conteúdo da aba selecionada
        this.render();
    },

    render() {
        // Só processa se a aba 'Dados' estiver visível
        const container = document.getElementById('view-data');
        if (!container || container.classList.contains('hidden')) return;

        if (this.currentSubTab === 'audit') {
            this.renderAudit();
        } else {
            this.renderBankTable(this.currentSubTab);
        }
    },

    // --- LÓGICA DA AUDITORIA (Cálculo do Mês Atual) ---
    renderAudit() {
        const incomeBody = document.getElementById('audit-income-body');
        const expenseBody = document.getElementById('audit-expense-body');
        
        // Se os elementos não existirem no HTML, para a execução
        if (!incomeBody || !expenseBody) return;

        // Pega período atual do DataService
        const latest = DataService.getLatestPeriod(); // {year, month}
        const year = latest.year;
        const month = latest.month;

        // Junta todas as transações
        const allTrans = [
            ...(DataService.bradescoTransactions || []),
            ...(DataService.santanderAccountTransactions || []),
            ...(DataService.santanderCardTransactions || [])
        ];

        // Filtra transações do Mês Fiscal Vigente
        const activeTrans = allTrans.filter(t => {
            // Lógica de data fiscal (dia 16 do mês anterior até 15 do atual)
            let m = t.date.getMonth();
            let y = t.date.getFullYear();
            if (t.date.getDate() >= 16) { m++; if (m > 11) { m = 0; y++; } }
            
            const isTargetMonth = (m === month && y === year);
            
            // Verifica se está na lista de ignorados (Config.js)
            const isIgnored = AppParams.ignorePatterns.some(p => 
                t.description.toLowerCase().includes(p)
            );
            
            return isTargetMonth && !isIgnored;
        });

        // Separa Receitas e Despesas
        const incomeList = [];
        const expenseList = [];

        activeTrans.forEach(t => {
            let isExpense = false;
            let val = 0;

            if (t.source === 'santander_card') {
                // No cartão, type='expense' é gasto
                if (t.type === 'expense') { isExpense = true; val = t.value; }
            } else {
                // Em contas, valor negativo é gasto
                if (t.value < 0) { isExpense = true; val = Math.abs(t.value); }
                else { val = t.value; }
            }

            if (val > 0) {
                const item = { ...t, absValue: val };
                if (isExpense) expenseList.push(item);
                else incomeList.push(item);
            }
        });

        // Ordena por valor decrescente
        incomeList.sort((a,b) => b.absValue - a.absValue);
        expenseList.sort((a,b) => b.absValue - a.absValue);

        // Função auxiliar para criar as linhas da tabela
        const renderRows = (list, colorClass) => {
            if (list.length === 0) return '<tr><td class="p-4 text-xs text-gray-400 text-center">Nenhum registro considerado neste período.</td></tr>';
            
            return list.map(t => `
                <tr class="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td class="px-4 py-2">
                        <div class="flex justify-between items-start gap-2">
                            <div class="overflow-hidden">
                                <p class="text-xs font-medium text-gray-800 dark:text-white truncate" title="${t.description}">${t.description}</p>
                                <p class="text-[10px] text-gray-400 mt-0.5">${t.date.toLocaleDateString()} • ${t.source === 'santander_card' ? 'Fatura' : 'Conta'}</p>
                            </div>
                            <span class="text-xs font-bold ${colorClass} whitespace-nowrap val-privacy">${Utils.formatCurrency(t.absValue)}</span>
                        </div>
                    </td>
                </tr>
            `).join('');
        };

        // Injeta o HTML
        incomeBody.innerHTML = renderRows(incomeList, 'text-emerald-600 dark:text-emerald-400');
        expenseBody.innerHTML = renderRows(expenseList, 'text-rose-600 dark:text-rose-400');

        // Atualiza os totais nos cabeçalhos
        const totalInc = incomeList.reduce((acc, t) => acc + t.absValue, 0);
        const totalExp = expenseList.reduce((acc, t) => acc + t.absValue, 0);
        
        Utils.DOM.updateText('audit-income-total', Utils.formatCurrency(totalInc));
        Utils.DOM.updateText('audit-expense-total', Utils.formatCurrency(totalExp));
    },

    // --- LÓGICA DAS TABELAS DE BANCO (Dados Brutos) ---
    renderBankTable(source) {
        const tbody = document.getElementById('bank-table-body');
        if (!tbody) return;

        let data = [];
        if (source === 'bradesco') data = DataService.bradescoTransactions || [];
        else if (source === 'santander-acc') data = DataService.santanderAccountTransactions || [];
        else if (source === 'santander-card') data = DataService.santanderCardTransactions || [];

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-xs text-gray-400">Nenhum dado encontrado para esta fonte.</td></tr>';
            return;
        }

        // Limita a exibição para não travar o navegador
        const displayData = data.slice(0, 150);

        tbody.innerHTML = displayData.map(t => {
            let valClass = 'text-gray-800 dark:text-gray-200';
            let displayVal = t.value;

            // Normaliza cores e sinais
            if (source === 'santander-card') {
                if (t.type === 'expense') {
                    valClass = 'text-rose-600 dark:text-rose-400';
                    displayVal = -Math.abs(t.value); // Mostra negativo visualmente
                } else {
                    valClass = 'text-emerald-600 dark:text-emerald-400';
                }
            } else {
                if (t.value < 0) valClass = 'text-rose-600 dark:text-rose-400';
                else valClass = 'text-emerald-600 dark:text-emerald-400';
            }

            return `
                <tr class="bg-white border-b hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors">
                    <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">${t.date.toLocaleDateString()}</td>
                    <td class="px-4 py-3 text-xs font-medium text-gray-700 dark:text-gray-200 truncate max-w-[200px]" title="${t.description}">${t.description}</td>
                    <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                        <span class="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-[10px]">${t.category || 'Geral'}</span>
                    </td>
                    <td class="px-4 py-3 text-xs font-bold text-right ${valClass} val-privacy">${Utils.formatCurrency(displayVal)}</td>
                </tr>
            `;
        }).join('');
    }
};

// Expõe globalmente
window.Tables = Tables;
