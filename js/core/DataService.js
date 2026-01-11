const DataService = {
    bradescoTransactions: [], 
    santanderAccountTransactions: [], 
    santanderCardTransactions: [],
    monthlyDataCache: {},
    
    listeners: [],
    subscribe(fn) { this.listeners.push(fn); },
    notify() { this.listeners.forEach(fn => fn(this)); },

    async init() {
        // ... (Init mantido igual) ...
        console.log("🚀 DataService: Iniciando...");
        Utils.DOM.updateText('current-month-badge', 'Sincronizando Bancos...');

        if (!AppParams || !AppParams.urls || !AppParams.urls.bradesco) return false;

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
            console.log("✅ DataService: Pronto.");
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
            try {
                const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
                const resP = await fetch(proxy);
                if (!resP.ok) throw new Error(resP.status);
                return await resP.text();
            } catch (finalError) { return ""; }
        }
    },

    // --- PARSERS (Mantidos) ---
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

    buildCache() {
        this.monthlyDataCache = {};
        AppParams.years.forEach(y => {
            this.monthlyDataCache[y] = { 
                income: new Array(12).fill(0), expenses: new Array(12).fill(0), 
                balances: new Array(12).fill(0), balancesSantander: new Array(12).fill(0),
                acc: { income: new Array(12).fill(0), expenses: new Array(12).fill(0) },
                card: { income: new Array(12).fill(0), expenses: new Array(12).fill(0) }
            };
        });

        const isIgnored = (desc) => AppParams.ignorePatterns.some(p => desc.toLowerCase().includes(p));
        const getFiscalPeriod = (date) => {
            let m = date.getMonth();
            let y = date.getFullYear();
            if (date.getDate() >= 16) { m++; if (m > 11) { m = 0; y++; } }
            return { m, y };
        };

        const balances = { bradesco: {}, santander: {} };

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

        let lastBrad = 0, lastSant = 0;
        if(this.bradescoTransactions && this.bradescoTransactions.length) lastBrad = this.bradescoTransactions[this.bradescoTransactions.length-1].balance;
        if(this.santanderAccountTransactions && this.santanderAccountTransactions.length) lastSant = this.santanderAccountTransactions[this.santanderAccountTransactions.length-1].balance;

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
    getLatestPeriod() { const now = new Date(); return { year: now.getFullYear(), month: now.getMonth() }; },

    getAggregated(year, isMonthly, indices, sourceFilter = 'all') {
        const d = this.getMonthly(year);
        if (!d) return { income: [], expenses: [], balances: [], balancesSantander: [], labels: [] };
        
        let srcInc = d.income; let srcExp = d.expenses;
        if (sourceFilter === 'account') { srcInc = d.acc.income; srcExp = d.acc.expenses; }
        else if (sourceFilter === 'card') { srcInc = d.card.income; srcExp = d.card.expenses; }

        let income=[], expenses=[], balances=[], balancesSantander=[], labels=[];
        const sum = (arr) => arr.reduce((a, b) => a + b, 0);

        if (isMonthly) {
            indices.forEach(i => {
                income.push(srcInc[i]); expenses.push(srcExp[i]); 
                balances.push(d.balances[i]); balancesSantander.push(d.balancesSantander[i]); 
                labels.push(AppParams.months.short[i]);
            });
        } else {
            indices.forEach(q => {
                const start = q * 3;
                if (start < 12) {
                    income.push(sum(srcInc.slice(start, start + 3))); expenses.push(sum(srcExp.slice(start, start + 3)));
                    balances.push(d.balances[Math.min(start + 2, 11)]); balancesSantander.push(d.balancesSantander[Math.min(start + 2, 11)]);
                    labels.push(AppParams.quarters.short[q]);
                }
            });
        }
        return { income, expenses, balances, balancesSantander, labels };
    },

    getConsolidatedTransactions() {
        const brad = (this.bradescoTransactions || []).map(t => ({...t, sourceLabel: 'Bradesco'}));
        const santAcc = (this.santanderAccountTransactions || []).map(t => ({...t, sourceLabel: 'Santander Conta'}));
        const santCard = (this.santanderCardTransactions || []).map(t => ({...t, value: t.type === 'expense' ? -Math.abs(t.value) : Math.abs(t.value), sourceLabel: 'Santander Cartão'}));
        return [...brad, ...santAcc, ...santCard].sort((a,b) => b.date - a.date);
    },
    
    // --- LÓGICA DO DASHBOARD ---
    getDashboardStats(year, month) {
        // 1. Saldos Individuais
        let balBrad = 0, balSant = 0;
        if (this.bradescoTransactions.length > 0) balBrad = this.bradescoTransactions[0].balance;
        if (this.santanderAccountTransactions.length > 0) balSant = this.santanderAccountTransactions[0].balance;
        
        // --- JANELA ATUAL (Para Cards de Fatura) ---
        // 16/M-1 a 15/M
        let startM = month - 1; let startY = year;
        if (startM < 0) { startM = 11; startY--; }
        const currentStartDate = new Date(startY, startM, 16);
        const endDate = new Date(year, month, 15, 23, 59, 59);

        // --- JANELA DE PADRÕES (3 Meses) ---
        // 16/M-3 a 15/M
        let patternStartM = month - 3; let patternStartY = year;
        // Ajuste de ano (JS handle negative months in date constructor automatically, but being explicit is safer)
        const patternStartDate = new Date(year, month - 3, 16); 

        // 2. Acumulação
        let invoiceTotal = 0; // Apenas mês atual
        let paretoTotal = 0;  // 3 meses
        let paretoCategories = {}; // 3 meses
        const dailyExpenses = new Array(31).fill(0); // 3 meses (acumula por dia do mês 1-31)

        if (this.santanderCardTransactions) {
            this.santanderCardTransactions.forEach(t => {
                if (t.type !== 'expense' || AppParams.ignorePatterns.some(p => t.description.toLowerCase().includes(p))) return;
                const val = Math.abs(t.value);

                // Lógica: Fatura Aberta (Mês Atual Estrito)
                if (t.date >= currentStartDate && t.date <= endDate) {
                    invoiceTotal += val;
                }

                // Lógica: Padrões (3 Meses)
                if (t.date >= patternStartDate && t.date <= endDate) {
                    paretoTotal += val;
                    const cat = t.category || 'Outros';
                    paretoCategories[cat] = (paretoCategories[cat] || 0) + val;
                    
                    // Heatmap (Dia 1 a 31)
                    const d = t.date.getDate();
                    if(d <= 31) dailyExpenses[d-1] += val;
                }
            });
        }

        // 3. Cálculos de Média (Últimas 3 Janelas para Cards)
        let sumIncome = 0;
        let sumFixed = 0;
        let sumProjBalance = 0;
        const fixedCats = ['aluguel', 'luz', 'internet', 'streaming', 'sem parar', 'transporte'];
        
        for (let i = 1; i <= 3; i++) {
            let y = year, m = month - i;
            if (m < 0) { m += 12; y--; }
            
            const d = this.getMonthly(y);
            if (d) {
                const inc = d.income[m];
                sumIncome += inc;
                
                const exp = d.expenses[m];
                sumProjBalance += (inc - exp);

                // Custo Fixo (Varredura)
                let mFixed = 0;
                const checkFixed = (list) => {
                    list.forEach(t => {
                        const fp = (t.date.getDate() >= 16) ? (t.date.getMonth() + 1) % 12 : t.date.getMonth();
                        const fy = (t.date.getDate() >= 16 && t.date.getMonth() === 11) ? t.date.getFullYear() + 1 : t.date.getFullYear();
                        
                        if (fp === m && fy === y && t.type === 'expense') {
                            if (fixedCats.includes(t.category.toLowerCase())) {
                                mFixed += Math.abs(t.value);
                            }
                        }
                    });
                };
                if(this.bradescoTransactions) checkFixed(this.bradescoTransactions);
                if(this.santanderAccountTransactions) checkFixed(this.santanderAccountTransactions);
                if(this.santanderCardTransactions) checkFixed(this.santanderCardTransactions);
                sumFixed += mFixed;
            }
        }

        const avgIncome = sumIncome / 3;
        const avgFixed = sumFixed / 3;
        const avgProjBal = sumProjBalance / 3; 
        
        let disposableRate = 0;
        if (avgProjBal !== 0) disposableRate = ((avgProjBal - avgFixed) / avgProjBal) * 100;

        // Pareto Formatting (Baseado nos dados de 3 meses)
        const sortedCats = Object.entries(paretoCategories).sort((a,b) => b[1] - a[1]);
        let paretoSum = 0;
        const paretoCats = [];
        for(const [cat, val] of sortedCats) {
            paretoCats.push({cat, val});
            paretoSum += val;
            // Mostra 80% do volume de 3 meses ou top 5
            if(paretoTotal > 0 && (paretoSum / paretoTotal) >= 0.8) break; 
        }

        return {
            metrics: { 
                realBalance: balBrad + balSant, 
                openInvoice: invoiceTotal,      
                predictedIncome: avgIncome,     
                fixedCost: avgFixed,            
                
                balBrad: balBrad,
                balSant: balSant,
                disposableRate: disposableRate, 
                
                pareto: { topCats: paretoCats, totalPareto: paretoSum, totalExp: paretoTotal }, // Dados de 3 meses
                heatmap: dailyExpenses // Dados de 3 meses
            },
            categories: Object.entries(paretoCategories).map(([k, v]) => ({ k, v, c: AppParams.colors.categories[k] || 'bg-gray-400' })).sort((a, b) => b.v - a.v)
        };
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
    getGoalsStats() { return { currentBalance: 0, avgExp: 0, runway: 0 }; }
};
window.DataService = DataService;
