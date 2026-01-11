const DataService = {
    bradescoTransactions: [],
    santanderTransactions: [], 
    monthlyDataCache: {},
    
    listeners: [],
    subscribe(fn) { this.listeners.push(fn); },
    notify() { this.listeners.forEach(fn => fn(this)); },

    async init() {
        console.log("🚀 DataService: Iniciando busca Multi-Contas...");
        Utils.DOM.updateText('current-month-badge', 'Sincronizando Bancos...');

        try {
            const ts = `&t=${Date.now()}`;
            
            const results = await Promise.allSettled([
                this.fetchData(AppParams.urls.bradesco + ts, 'Bradesco (TSV)'),
                this.fetchData(AppParams.urls.santander + ts, 'Santander (TSV)')
            ]);

            // Lógica de processamento mantida...
            if (results[0].status === 'fulfilled' && results[0].value) {
                this.parseBradescoTSV(results[0].value);
            } else {
                console.error("❌ Erro Bradesco:", results[0].reason);
            }

            if (results[1].status === 'fulfilled' && results[1].value) {
                this.parseSantanderTSV(results[1].value);
            } else {
                console.error("❌ Erro Santander:", results[1].reason);
            }

            this.buildCache();
            console.log("✅ DataService: Dados Consolidados. Notificando módulos.");
            this.notify(); 
            return true;

        } catch (error) {
            console.error("☠️ Falha Crítica:", error);
            Utils.DOM.updateText('current-month-badge', 'Erro de Conexão');
            return false;
        }
    },

    // --- CORREÇÃO DO BUG DE CORS AQUI ---
    async fetchData(url, label) {
        if(!url || url.includes('...')) return "";
        console.log(`📡 Buscando ${label}...`);
        
        try {
            // TENTATIVA 1: Acesso Direto
            const res = await fetch(url);
            if (res.ok) return await res.text();
            throw new Error(`Status Direto: ${res.status}`);
        } catch (directError) {
            console.warn(`⚠️ Acesso direto falhou para ${label} (${directError.message}). Tentando via Proxy...`);
            
            try {
                // TENTATIVA 2: Via Proxy (Bypass CORS)
                // Usamos 'api.allorigins.win' que repassa a requisição e adiciona os headers corretos
                const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
                const resProxy = await fetch(proxyUrl);
                
                if (!resProxy.ok) throw new Error(`Status Proxy: ${resProxy.status}`);
                return await resProxy.text();
                
            } catch (proxyError) {
                console.error(`☠️ Falha total para ${label}:`, proxyError);
                throw proxyError;
            }
        }
    },

    // --- PARSERS (Mantidos idênticos ao passo anterior) ---

    parseBradescoTSV(text) {
        const rows = text.split('\n').map(r => r.trim()).filter(r => r);
        if (rows.length < 2) return;
        
        const headers = rows[0].toLowerCase().split('\t');
        const idx = {
            date: headers.findIndex(h => h.includes('data')),
            desc: headers.findIndex(h => h.includes('histórico') || h.includes('lançamento')),
            val: headers.findIndex(h => h.includes('valor')),
            bal: headers.findIndex(h => h.includes('saldo')),
            doc: headers.findIndex(h => h.includes('docto'))
        };

        this.bradescoTransactions = rows.slice(1).map(row => {
            const cols = row.split('\t');
            if(cols.length < 3) return null;

            let date = new Date();
            const dStr = cols[idx.date];
            if(dStr && dStr.match(/^\d{2}\/\d{2}\/\d{2,4}/)) {
                const [d, m, y] = dStr.split('/');
                date = new Date(y.length===2 ? '20'+y : y, m-1, d);
            }

            const valRaw = idx.val > -1 ? cols[idx.val] : '0';
            const val = Utils.parseMoney(valRaw);
            const balRaw = idx.bal > -1 ? cols[idx.bal] : '0';
            const bal = Utils.parseMoney(balRaw);
            const desc = (idx.desc > -1 ? cols[idx.desc] : '').replace(/"/g, '');
            
            let cat = 'Outros';
            if(val > 0) cat = 'Receita';
            else if(desc.toLowerCase().includes('pix')) cat = 'Pix';
            
            return {
                date: date, description: desc, value: val, balance: bal,
                category: cat, source: 'bradesco', type: val >= 0 ? 'income' : 'expense'
            };
        }).filter(t => t);
        
        this.bradescoTransactions.sort((a,b) => b.date - a.date);
        this.updateYearsFromData(this.bradescoTransactions);
    },

    parseSantanderTSV(text) {
        const rows = text.split('\n').map(r => r.trim()).filter(r => r);
        if (rows.length < 2) return;
        const headers = rows[0].toLowerCase().split('\t');
        
        const idx = {
            date: headers.findIndex(h => h.includes('data') || h.includes('date')),
            val: headers.findIndex(h => h.includes('valor') || h.includes('amount')),
            cat: headers.findIndex(h => h.includes('categ') || h.includes('ramo')),
            desc: headers.findIndex(h => h.includes('desc') || h.includes('estabelecimento')),
        };
        
        this.santanderTransactions = rows.slice(1).map(row => {
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
                date: date, description: desc, value: val,
                category: idx.cat > -1 ? cols[idx.cat] : 'Cartão', source: 'santander',
                type: val > 0 ? 'expense' : 'income' 
            };
        }).filter(t => t && t.value !== 0);
        
        this.santanderTransactions.sort((a,b) => b.date - a.date);
        this.updateYearsFromData(this.santanderTransactions);
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

    // --- CONSOLIDAÇÃO INTELIGENTE (Mantida igual ao passo anterior) ---

    buildCache() {
        this.monthlyDataCache = {};
        AppParams.years.forEach(y => {
            this.monthlyDataCache[y] = { 
                income: new Array(12).fill(0), expenses: new Array(12).fill(0), balances: new Array(12).fill(0),
                acc: { income: new Array(12).fill(0), expenses: new Array(12).fill(0) },
                card: { income: new Array(12).fill(0), expenses: new Array(12).fill(0) }
            };
        });

        const isIgnored = (desc) => {
            const d = desc.toLowerCase();
            return AppParams.ignorePatterns.some(pattern => d.includes(pattern));
        };

        const getFiscalPeriod = (date) => {
            let m = date.getMonth();
            let y = date.getFullYear();
            if (date.getDate() >= 16) {
                m++;
                if (m > 11) { m = 0; y++; }
            }
            return { m, y };
        };

        const bradescoBalances = {}; 
        
        this.bradescoTransactions.forEach(t => {
            const key = `${t.date.getFullYear()}-${t.date.getMonth()}`;
            if (bradescoBalances[key] === undefined) bradescoBalances[key] = t.balance;

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

        this.santanderTransactions.forEach(t => {
            const { m, y } = getFiscalPeriod(t.date);
            if (this.monthlyDataCache[y]) {
                if (t.type === 'expense') { 
                    const val = Math.abs(t.value);
                    if (!isIgnored(t.description)) {
                        this.monthlyDataCache[y].expenses[m] += val;
                        this.monthlyDataCache[y].card.expenses[m] += val;
                    }
                }
            }
        });

        let lastKnownBalance = 0;
        if(this.bradescoTransactions.length > 0) lastKnownBalance = this.bradescoTransactions[0].balance;

        AppParams.years.forEach(y => {
            for (let m = 0; m < 12; m++) {
                const key = `${y}-${m}`;
                if (bradescoBalances[key] !== undefined) {
                    lastKnownBalance = bradescoBalances[key];
                }
                this.monthlyDataCache[y].balances[m] = lastKnownBalance;
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
        const bradesco = this.bradescoTransactions.map(t => ({...t, sourceLabel: 'Bradesco'}));
        const santander = this.santanderTransactions.map(t => ({
            ...t, 
            value: t.type === 'expense' ? -Math.abs(t.value) : Math.abs(t.value),
            sourceLabel: 'Santander'
        }));
        return [...bradesco, ...santander].sort((a,b) => b.date - a.date);
    },
    
    getAllCategories() {
        const cats = new Set();
        this.bradescoTransactions.forEach(t => cats.add(t.category));
        this.santanderTransactions.forEach(t => cats.add(t.category));
        return Array.from(cats).sort();
    },
    
    getYearlyCategoryBreakdown(year) {
        const data = Array.from({length: 12}, () => ({}));
        this.santanderTransactions.forEach(t => {
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
        const curBal = this.bradescoTransactions.length > 0 ? this.bradescoTransactions[0].balance : 0;
        return { currentBalance: curBal, avgExp: 0, runway: 0 };
    }
};
window.DataService = DataService;
