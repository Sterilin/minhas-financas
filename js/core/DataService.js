const DataService = {
    bradescoTransactions: [], 
    santanderAccountTransactions: [],
    santanderCardTransactions: [],
    monthlyDataCache: {},
    
    listeners: [],
    subscribe(fn) { this.listeners.push(fn); },
    notify() { this.listeners.forEach(fn => fn(this)); },

    async init() {
        console.log("🚀 DataService: Iniciando busca de 3 fontes...");
        Utils.DOM.updateText('current-month-badge', 'Sincronizando Bancos...');

        if (!AppParams || !AppParams.urls || !AppParams.urls.bradesco) {
            console.error("⚠️ Config.js parece desatualizado.");
            return false;
        }

        try {
            const getUrl = (url) => url ? `${url}&t=${Date.now()}` : null;
            
            const results = await Promise.allSettled([
                this.fetchData(getUrl(AppParams.urls.bradesco), 'Bradesco'),
                this.fetchData(getUrl(AppParams.urls.santanderAccount), 'Conta Santander'),
                this.fetchData(getUrl(AppParams.urls.santanderCard), 'Cartão Santander')
            ]);

            if (results[0].status === 'fulfilled' && results[0].value) this.parseBradescoTSV(results[0].value);
            if (results[1].status === 'fulfilled' && results[1].value) this.parseSantanderAccountTSV(results[1].value);
            if (results[2].status === 'fulfilled' && results[2].value) this.parseSantanderCardTSV(results[2].value);

            this.buildCache();
            console.log("✅ DataService: Dados Consolidados.");
            this.notify(); 
            return true;

        } catch (error) {
            console.error("☠️ Falha Crítica:", error);
            Utils.DOM.updateText('current-month-badge', 'Erro de Conexão');
            return false;
        }
    },

    async fetchData(url, label) {
        if(!url) return "";
        try {
            const res = await fetch(url);
            if (res.ok) return await res.text();
            throw new Error(res.status);
        } catch (e) {
            console.warn(`Tentando Proxy para ${label}...`);
            try {
                const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
                const resP = await fetch(proxy);
                if (!resP.ok) throw new Error(resP.status);
                return await resP.text();
            } catch (finalError) {
                return "";
            }
        }
    },

    // --- PARSERS ---
    parseBankStatement(text, sourceLabel) {
        if (!text || typeof text !== 'string') return [];
        const rows = text.split('\n').map(r => r.trim()).filter(r => r);
        if (rows.length < 2) return [];
        
        const headers = rows[0].toLowerCase().split('\t');
        const idx = {
            date: headers.findIndex(h => h.includes('data')),
            desc: headers.findIndex(h => h.includes('histórico') || h.includes('lançamento') || h.includes('descrição')),
            val: headers.findIndex(h => h.includes('valor')),
            bal: headers.findIndex(h => h.includes('saldo'))
        };

        return rows.slice(1).map(row => {
            const cols = row.split('\t');
            if(cols.length < 3) return null;

            let date = new Date();
            const dStr = cols[idx.date];
            if(dStr && dStr.match(/^\d{2}\/\d{2}\/\d{2,4}/)) {
                const [d, m, y] = dStr.split('/');
                date = new Date(y.length===2 ? '20'+y : y, m-1, d);
            }

            const val = idx.val > -1 ? Utils.parseMoney(cols[idx.val]) : 0;
            const bal = idx.bal > -1 ? Utils.parseMoney(cols[idx.bal]) : 0;
            const desc = (idx.desc > -1 ? cols[idx.desc] : '').replace(/"/g, '');
            
            let cat = 'Outros';
            if(val > 0) cat = 'Receita';
            else if(desc.toLowerCase().includes('pix')) cat = 'Pix';
            
            return {
                date, description: desc, value: val, balance: bal,
                category: cat, source: sourceLabel, type: val >= 0 ? 'income' : 'expense'
            };
        }).filter(t => t).sort((a,b) => b.date - a.date);
    },

    parseBradescoTSV(text) {
        this.bradescoTransactions = this.parseBankStatement(text, 'bradesco');
        this.updateYearsFromData(this.bradescoTransactions);
    },

    parseSantanderAccountTSV(text) {
        this.santanderAccountTransactions = this.parseBankStatement(text, 'santander_acc');
        this.updateYearsFromData(this.santanderAccountTransactions);
    },

    parseSantanderCardTSV(text) {
        if (!text || typeof text !== 'string') return;
        const rows = text.split('\n').map(r => r.trim()).filter(r => r);
        if (rows.length < 2) return;
        const headers = rows[0].toLowerCase().split('\t');
        
        const idx = {
            date: headers.findIndex(h => h.includes('data')),
            val: headers.findIndex(h => h.includes('valor')),
            cat: headers.findIndex(h => h.includes('categ') || h.includes('ramo')),
            desc: headers.findIndex(h => h.includes('desc'))
        };
        
        this.santanderCardTransactions = rows.slice(1).map(row => {
            const cols = row.split('\t');
            let date = new Date();
             if (idx.date > -1 && cols[idx.date]) {
                const dStr = cols[idx.date];
                if(dStr.match(/^\d{2}\/\d{2}\/\d{4}/)) {
                    const [d, m, y] = dStr.split('/');
                    date = new Date(y, m-1, d);
                }
            }
            const val = idx.val > -1 ? Utils.parseMoney(cols[idx.val]) : 0;
            const desc = idx.desc > -1 ? cols[idx.desc].replace(/"/g, '') : 'Santander';
            
            return {
                date, description: desc, value: val,
                category: idx.cat > -1 ? cols[idx.cat] : 'Cartão', source: 'santander_card',
                type: val > 0 ? 'expense' : 'income' 
            };
        }).filter(t => t && t.value !== 0).sort((a,b) => b.date - a.date);
        
        this.updateYearsFromData(this.santanderCardTransactions);
    },

    updateYearsFromData(list) {
        if (!list) return;
        const years = new Set(list.map(t => t.date.getFullYear()));
        if(years.size > 0) {
            const combined = new Set([...AppParams.years, ...years]);
            AppParams.years = Array.from(combined).sort();
            AppParams.years.forEach(y => {
                if(!AppState.reportSelections[y]) AppState.reportSelections[y] = Array.from({length:12},(_,i)=>i);
            });
        }
    },

    // --- CONSOLIDAÇÃO ---

    buildCache() {
        this.monthlyDataCache = {};
        AppParams.years.forEach(y => {
            this.monthlyDataCache[y] = { 
                income: new Array(12).fill(0), expenses: new Array(12).fill(0), 
                balances: new Array(12).fill(0), 
                balancesSantander: new Array(12).fill(0),
                acc: { income: new Array(12).fill(0), expenses: new Array(12).fill(0) },
                card: { income: new Array(12).fill(0), expenses: new Array(12).fill(0) }
            };
        });

        const isIgnored = (desc) => AppParams.ignorePatterns.some(p => desc.toLowerCase().includes(p));
        
        const getFiscalPeriod = (date) => {
            let m = date.getMonth();
            let y = date.getFullYear();
            if (date.getDate() >= 16) {
                m++;
                if (m > 11) { m = 0; y++; }
            }
            return { m, y };
        };

        const balances = { bradesco: {}, santander: {} };

        // Processa Contas (Fluxo de Caixa Real)
        const processAccount = (list, bankKey) => {
            if (!list) return;
            list.forEach(t => {
                const balKey = `${t.date.getFullYear()}-${t.date.getMonth()}`;
                if (balances[bankKey][balKey] === undefined) balances[bankKey][balKey] = t.balance;

                const { m, y } = getFiscalPeriod(t.date);
                if (this.monthlyDataCache[y]) {
                    if (!isIgnored(t.description)) {
                        const val = Math.abs(t.value);
                        if (t.value > 0) {
                            this.monthlyDataCache[y].income[m] += val;
                            this.monthlyDataCache[y].acc.income[m] += val;
                        } else {
                            this.monthlyDataCache[y].expenses[m] += val;
                            this.monthlyDataCache[y].acc.expenses[m] += val;
                        }
                    }
                }
            });
        };

        processAccount(this.bradescoTransactions, 'bradesco');
        processAccount(this.santanderAccountTransactions, 'santander');

        // Processa Cartão (Apenas soma em Despesas para Gráficos, não afeta Saldo Bancário aqui)
        if (this.santanderCardTransactions) {
            this.santanderCardTransactions.forEach(t => {
                const { m, y } = getFiscalPeriod(t.date);
                if (this.monthlyDataCache[y]) {
                    if (t.type === 'expense' && !isIgnored(t.description)) {
                        const val = Math.abs(t.value);
                        this.monthlyDataCache[y].expenses[m] += val;
                        this.monthlyDataCache[y].card.expenses[m] += val;
                    }
                }
            });
        }

        // Waterfall de Saldos
        let lastBrad = 0, lastSant = 0;
        
        // Pega saldo mais recente disponível para fallback
        if(this.bradescoTransactions && this.bradescoTransactions.length) {
            lastBrad = this.bradescoTransactions[this.bradescoTransactions.length-1].balance;
        }
        if(this.santanderAccountTransactions && this.santanderAccountTransactions.length) {
            lastSant = this.santanderAccountTransactions[this.santanderAccountTransactions.length-1].balance;
        }

        AppParams.years.forEach(y => {
            for (let m = 0; m < 12; m++) {
                const key = `${y}-${m}`;
                if (balances.bradesco[key] !== undefined) lastBrad = balances.bradesco[key];
                if (balances.santander[key] !== undefined) lastSant = balances.santander[key];
                
                this.monthlyDataCache[y].balances[m] = lastBrad + lastSant;
                this.monthlyDataCache[y].balancesSantander[m] = lastSant;
            }
        });
    },

    getMonthly(year) { return this.monthlyDataCache[year]; },
    
    getLatestPeriod() {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() };
    },

    getAggregated(year, isMonthly, indices, sourceFilter = 'all') {
        const d = this.getMonthly(year);
        if (!d) return { income: [], expenses: [], balances: [], balancesSantander: [], labels: [] };
        
        let srcInc = d.income;
        let srcExp = d.expenses;
        
        if (sourceFilter === 'account') { srcInc = d.acc.income; srcExp = d.acc.expenses; }
        else if (sourceFilter === 'card') { srcInc = d.card.income; srcExp = d.card.expenses; }

        let income=[], expenses=[], balances=[], balancesSantander=[], labels=[];
        const sum = (arr) => arr.reduce((a, b) => a + b, 0);

        if (isMonthly) {
            indices.forEach(i => {
                income.push(srcInc[i]); 
                expenses.push(srcExp[i]); 
                balances.push(d.balances[i]); 
                balancesSantander.push(d.balancesSantander[i]); 
                labels.push(AppParams.months.short[i]);
            });
        } else {
            indices.forEach(q => {
                const start = q * 3;
                if (start < 12) {
                    income.push(sum(srcInc.slice(start, start + 3)));
                    expenses.push(sum(srcExp.slice(start, start + 3)));
                    balances.push(d.balances[Math.min(start + 2, 11)]); 
                    balancesSantander.push(d.balancesSantander[Math.min(start + 2, 11)]);
                    labels.push(AppParams.quarters.short[q]);
                }
            });
        }
        return { income, expenses, balances, balancesSantander, labels };
    },

    getConsolidatedTransactions() {
        const brad = (this.bradescoTransactions || []).map(t => ({...t, sourceLabel: 'Bradesco'}));
        const santAcc = (this.santanderAccountTransactions || []).map(t => ({...t, sourceLabel: 'Santander Conta'}));
        const santCard = (this.santanderCardTransactions || []).map(t => ({
            ...t, 
            value: t.type === 'expense' ? -Math.abs(t.value) : Math.abs(t.value),
            sourceLabel: 'Santander Cartão'
        }));
        return [...brad, ...santAcc, ...santCard].sort((a,b) => b.date - a.date);
    },
    
    getAllCategories() {
        const cats = new Set();
        if(this.bradescoTransactions) this.bradescoTransactions.forEach(t => cats.add(t.category));
        if(this.santanderCardTransactions) this.santanderCardTransactions.forEach(t => cats.add(t.category));
        return Array.from(cats).sort();
    },
    
    getYearlyCategoryBreakdown(year) {
        const data = Array.from({length: 12}, () => ({}));
        if(this.santanderCardTransactions) {
            this.santanderCardTransactions.forEach(t => {
                if (t.date.getFullYear() === year && t.type === 'expense') {
                    const m = t.date.getMonth();
                    const cat = t.category || 'Outros';
                    data[m][cat] = (data[m][cat] || 0) + Math.abs(t.value);
                }
            });
        }
        return { months: AppParams.months.short, categories: [], data: data };
    },

    getDashboardStats(year, month) {
        const d = this.getMonthly(year);
        
        // 1. Saldo Bancário REAL (Snapshot do Banco)
        // Se temos dados do Bradesco/Santander, usamos o saldo mais recente disponível na lista
        let currentAccountBalance = 0;
        if (this.bradescoTransactions.length > 0) currentAccountBalance += this.bradescoTransactions[0].balance;
        if (this.santanderAccountTransactions.length > 0) currentAccountBalance += this.santanderAccountTransactions[0].balance;

        // 2. Fatura Aberta (Cálculo Dinâmico 16/M-1 a 15/M)
        let invoiceTotal = 0;
        let invoiceCategories = {};
        
        // Define janela da fatura
        let startM = month - 1;
        let startY = year;
        if (startM < 0) { startM = 11; startY--; }
        const startDate = new Date(startY, startM, 16);
        const endDate = new Date(year, month, 15, 23, 59, 59);

        // Soma gastos do cartão nesta janela
        if (this.santanderCardTransactions) {
            this.santanderCardTransactions.forEach(t => {
                // Se está dentro da janela
                if (t.date >= startDate && t.date <= endDate) {
                    if (t.type === 'expense' && !AppParams.ignorePatterns.some(p => t.description.toLowerCase().includes(p))) {
                        const val = Math.abs(t.value);
                        invoiceTotal += val;
                        // Acumula categoria para o Pareto
                        const cat = t.category || 'Outros';
                        invoiceCategories[cat] = (invoiceCategories[cat] || 0) + val;
                    }
                }
            });
        }

        // 3. Métricas Gerais (Do cache consolidado)
        // Isso pega Receita e Despesa total do mês (incluindo pix, etc)
        const income = d ? d.income[month] : 0;
        const expense = d ? d.expenses[month] : 0;
        const balance = income - expense; // Fluxo de Caixa do mês (Entrou - Saiu)

        // Pareto
        const sortedCats = Object.entries(invoiceCategories).sort((a,b) => b[1] - a[1]);
        let paretoSum = 0;
        const paretoCats = [];
        for(const [cat, val] of sortedCats) {
            paretoCats.push({cat, val});
            paretoSum += val;
            if(invoiceTotal > 0 && (paretoSum / invoiceTotal) >= 0.8) break;
        }

        return {
            metrics: { 
                income, expense, balance, 
                accountBalance: currentAccountBalance, // Saldo Real (Sem deduzir fatura aberta)
                fixedCost: 0, 
                cardInvoice: invoiceTotal, // Valor da fatura aberta
                discretionaryRatio: 0, 
                breakEvenDay: 0,
                pareto: { topCats: paretoCats, totalPareto: paretoSum, totalExp: invoiceTotal },
                heatmap: []
            },
            trends: { income: 0, expense: 0 },
            categories: Object.entries(invoiceCategories).map(([k, v]) => ({ k, v, c: AppParams.colors.categories[k] || 'bg-gray-400' })).sort((a, b) => b.v - a.v),
            recent: this.getConsolidatedTransactions().slice(0, 5)
        };
    },
    
    getGoalsStats() {
        let b1 = (this.bradescoTransactions && this.bradescoTransactions.length > 0) ? this.bradescoTransactions[0].balance : 0;
        let b2 = (this.santanderAccountTransactions && this.santanderAccountTransactions.length > 0) ? this.santanderAccountTransactions[0].balance : 0;
        return { currentBalance: b1 + b2, avgExp: 0, runway: 0 };
    }
};
window.DataService = DataService;
