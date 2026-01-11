const DataService = {
    bradescoTransactions: [], 
    santanderAccountTransactions: [], // Nova lista: Conta Corrente
    santanderCardTransactions: [],    // Nova lista: Cartão de Crédito
    monthlyDataCache: {},
    
    listeners: [],
    subscribe(fn) { this.listeners.push(fn); },
    notify() { this.listeners.forEach(fn => fn(this)); },

    async init() {
        console.log("🚀 DataService: Iniciando busca de 3 fontes...");
        Utils.DOM.updateText('current-month-badge', 'Sincronizando Bancos...');

        try {
            const ts = `&t=${Date.now()}`;
            
            const results = await Promise.allSettled([
                this.fetchData(AppParams.urls.bradesco + ts, 'Bradesco'),
                this.fetchData(AppParams.urls.santanderAccount + ts, 'Conta Santander'),
                this.fetchData(AppParams.urls.santanderCard + ts, 'Cartão Santander')
            ]);

            // 1. Bradesco
            if (results[0].status === 'fulfilled') this.parseBradescoTSV(results[0].value);
            
            // 2. Conta Santander
            if (results[1].status === 'fulfilled') this.parseSantanderAccountTSV(results[1].value);

            // 3. Cartão Santander
            if (results[2].status === 'fulfilled') this.parseSantanderCardTSV(results[2].value);

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
            console.warn(`Proxying ${label}...`);
            const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
            const resP = await fetch(proxy);
            if (!resP.ok) throw new Error(resP.status);
            return await resP.text();
        }
    },

    // --- PARSERS ---

    // Parser Genérico para Extratos Bancários (Bradesco/Santander Conta)
    parseBankStatement(text, sourceLabel) {
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
                income: new Array(12).fill(0), expenses: new Array(12).fill(0), balances: new Array(12).fill(0),
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

        // Rastreamento de Saldos por Mês (Snapshot)
        const balances = { bradesco: {}, santander: {} };

        const processAccount = (list, bankKey) => {
            list.forEach(t => {
                // Guarda saldo (como a lista é descrescente, o primeiro registro do mês encontrado é sobrescrito pelo último... 
                // Espera, se está decrescente (mais novo pro mais velho), o primeiro que encontramos de um mês É o saldo final daquele mês.
                // Mas iteramos todos. Precisamos garantir que pegamos o mais recente.
                // Como iteramos, vamos salvar sempre e depois corrigir a lógica de captura.
                // Melhor: salvar num map [mes] -> [saldo], e como está ordenado por data DESC, só salvamos se não existir ainda.
                
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

        // 1. Processa Bradesco e Santander Conta
        processAccount(this.bradescoTransactions, 'bradesco');
        processAccount(this.santanderAccountTransactions, 'santander');

        // 2. Processa Cartão
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

        // 3. Consolidar Saldos (Soma dos dois bancos)
        let lastBrad = 0, lastSant = 0;
        
        // Pega saldo inicial mais recente disponível
        if(this.bradescoTransactions.length) lastBrad = this.bradescoTransactions[this.bradescoTransactions.length-1].balance;
        if(this.santanderAccountTransactions.length) lastSant = this.santanderAccountTransactions[this.santanderAccountTransactions.length-1].balance;

        AppParams.years.forEach(y => {
            for (let m = 0; m < 12; m++) {
                const key = `${y}-${m}`;
                if (balances.bradesco[key] !== undefined) lastBrad = balances.bradesco[key];
                if (balances.santander[key] !== undefined) lastSant = balances.santander[key];
                
                this.monthlyDataCache[y].balances[m] = lastBrad + lastSant;
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
        if (!d) return { income: [], expenses: [], balances: [], labels: [] };
        
        let srcInc = d.income;
        let srcExp = d.expenses;
        
        if (sourceFilter === 'account') { srcInc = d.acc.income; srcExp = d.acc.expenses; }
        else if (sourceFilter === 'card') { srcInc = d.card.income; srcExp = d.card.expenses; }

        let income=[], expenses=[], balances=[], labels=[];
        const sum = (arr) => arr.reduce((a, b) => a + b, 0);

        if (isMonthly) {
            indices.forEach(i => {
                income.push(srcInc[i]); 
                expenses.push(srcExp[i]); 
                balances.push(d.balances[i]); 
                labels.push(AppParams.months.short[i]);
            });
        } else {
            indices.forEach(q => {
                const start = q * 3;
                if (start < 12) {
                    income.push(sum(srcInc.slice(start, start + 3)));
                    expenses.push(sum(srcExp.slice(start, start + 3)));
                    balances.push(d.balances[Math.min(start + 2, 11)]); 
                    labels.push(AppParams.quarters.short[q]);
                }
            });
        }
        return { income, expenses, balances, labels };
    },

    getConsolidatedTransactions() {
        const brad = this.bradescoTransactions.map(t => ({...t, sourceLabel: 'Bradesco'}));
        const santAcc = this.santanderAccountTransactions.map(t => ({...t, sourceLabel: 'Santander Conta'}));
        const santCard = this.santanderCardTransactions.map(t => ({
            ...t, 
            value: t.type === 'expense' ? -Math.abs(t.value) : Math.abs(t.value),
            sourceLabel: 'Santander Cartão'
        }));
        return [...brad, ...santAcc, ...santCard].sort((a,b) => b.date - a.date);
    },
    
    getAllCategories() {
        const cats = new Set();
        this.bradescoTransactions.forEach(t => cats.add(t.category));
        this.santanderCardTransactions.forEach(t => cats.add(t.category));
        return Array.from(cats).sort();
    },
    
    getYearlyCategoryBreakdown(year) {
        const data = Array.from({length: 12}, () => ({}));
        this.santanderCardTransactions.forEach(t => {
            if (t.date.getFullYear() === year && t.type === 'expense') {
                const m = t.date.getMonth();
                const cat = t.category || 'Outros';
                data[m][cat] = (data[m][cat] || 0) + Math.abs(t.value);
            }
        });
        return { months: AppParams.months.short, categories: [], data: data };
    },

    getDashboardStats(year, month) {
        const d = this.getMonthly(year);
        const m = month;
        const income = d ? d.income[m] : 0;
        const expense = d ? d.expenses[m] : 0;
        const balance = income - expense;
        const accBal = d ? d.balances[m] : 0;
        
        return {
            metrics: { 
                income, expense, balance, 
                accountBalance: accBal,
                fixedCost: 0, cardInvoice: d ? d.card.expenses[m] : 0,
                discretionaryRatio: 0, breakEvenDay: 0,
                pareto: { topCats: [], totalPareto: 0, totalExp: expense },
                heatmap: []
            },
            trends: { income: 0, expense: 0 },
            categories: [],
            recent: this.getConsolidatedTransactions().slice(0, 5)
        };
    },
    
    getGoalsStats() {
        // Soma saldo mais recente das duas contas
        let b1 = this.bradescoTransactions.length > 0 ? this.bradescoTransactions[0].balance : 0;
        let b2 = this.santanderAccountTransactions.length > 0 ? this.santanderAccountTransactions[0].balance : 0;
        return { currentBalance: b1 + b2, avgExp: 0, runway: 0 };
    }
};
window.DataService = DataService;
