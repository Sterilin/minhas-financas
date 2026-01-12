const DataService = {
    // ... (Propriedades e Init mantidos iguais) ...
    bradescoTransactions: [], 
    santanderAccountTransactions: [], 
    santanderCardTransactions: [],
    goalsList: [],
    monthlyDataCache: {},
    
    listeners: [],
    subscribe(fn) { this.listeners.push(fn); },
    notify() { this.listeners.forEach(fn => fn(this)); },

    async init() {
        console.log("🚀 DataService: Iniciando...");
        Utils.DOM.updateText('current-month-badge', 'Sincronizando...');

        if (!AppParams || !AppParams.urls) return false;

        try {
            const getUrl = (url) => url ? `${url}&t=${Date.now()}` : null;
            
            const results = await Promise.allSettled([
                this.fetchData(getUrl(AppParams.urls.bradesco), 'Bradesco'),
                this.fetchData(getUrl(AppParams.urls.santanderAccount), 'Conta Santander'),
                this.fetchData(getUrl(AppParams.urls.santanderCard), 'Cartão Santander'),
                this.fetchData(getUrl(AppParams.urls.goals), 'Metas')
            ]);

            if (results[0].status === 'fulfilled') this.parseBradescoTSV(results[0].value);
            if (results[1].status === 'fulfilled') this.parseSantanderAccountTSV(results[1].value);
            if (results[2].status === 'fulfilled') this.parseSantanderCardTSV(results[2].value);
            if (results[3].status === 'fulfilled') this.parseGoalsTSV(results[3].value);

            this.buildCache();
            this.notify(); 
            return true;

        } catch (error) {
            console.error("☠️ Falha Crítica:", error);
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

    // ... (Parsers Bancários Mantidos) ...
    parseBankStatement(text, sourceLabel) {
        if (!text || typeof text !== 'string') return [];
        const rows = text.split('\n').map(r => r.trim()).filter(r => r);
        if (rows.length < 2) return [];
        const headers = rows[0].toLowerCase().split('\t');
        const idx = {
            date: headers.findIndex(h => h.includes('data')),
            val: headers.findIndex(h => h.includes('valor')),
            bal: headers.findIndex(h => h.includes('saldo')),
            desc: headers.findIndex(h => h.includes('desc') || h.includes('hist') || h.includes('lanc'))
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
    parseBradescoTSV(text) { this.bradescoTransactions = this.parseBankStatement(text, 'bradesco'); this.updateYearsFromData(this.bradescoTransactions); },
    parseSantanderAccountTSV(text) { this.santanderAccountTransactions = this.parseBankStatement(text, 'santander_acc'); this.updateYearsFromData(this.santanderAccountTransactions); },
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

    // --- PARSER DE METAS ATUALIZADO (LÓGICA HÍBRIDA) ---
    parseGoalsTSV(text) {
        if (!text || typeof text !== 'string') return;
        const rows = text.split('\n').map(r => r.trim()).filter(r => r);
        if (rows.length < 2) return;
        
        const headers = rows[0].toLowerCase().split('\t');
        const idx = {
            title: headers.findIndex(h => h.includes('título') || h.includes('titulo') || h.includes('nome')),
            total: headers.findIndex(h => h.includes('total') || h.includes('alvo')),
            current: headers.findIndex(h => h.includes('atual') || h.includes('acumulado')),
            // Esta coluna agora pode ser "Meta" (data) ou "Aporte" (valor)
            param: headers.findIndex(h => h.includes('aporte') || h.includes('mensal') || h.includes('meta') || h.includes('prazo')),
            image: headers.findIndex(h => h.includes('imagem') || h.includes('img'))
        };

        this.goalsList = rows.slice(1).map(row => {
            const cols = row.split('\t');
            const getVal = (i) => (i > -1 && cols[i]) ? cols[i] : '';
            
            const total = Utils.parseMoney(getVal(idx.total));
            const current = Utils.parseMoney(getVal(idx.current));
            
            // Leitura da coluna de Parâmetro (Data ou Valor)
            const paramStr = getVal(idx.param);
            
            let monthlyContribution = 0;
            let monthsLeft = 0;
            let targetDate = null;
            const remainingValue = Math.max(0, total - current);

            // Tenta detectar se é uma Data (ex: "jan/2030", "01/01/2030")
            const dateMatch = paramStr.match(/(\d{1,2})[\/\-](\d{2,4})/) || paramStr.match(/([a-zA-Z]{3})[\/\-](\d{2,4})/);
            
            if (dateMatch) {
                // LÓGICA 1: É UMA DATA (Calcula o aporte necessário)
                const now = new Date();
                let m = 0, y = 0;
                
                // Parser simples de data
                if(paramStr.includes('/')) {
                    const parts = paramStr.split('/');
                    if(parts.length === 2) { // MM/YYYY ou JAN/YYYY
                        y = parseInt(parts[1]);
                        y = y < 100 ? 2000 + y : y;
                        const mStr = parts[0].toLowerCase();
                        m = AppParams.months.short.findIndex(x => x.toLowerCase() === mStr);
                        if(m === -1 && !isNaN(parts[0])) m = parseInt(parts[0]) - 1;
                    } else if (parts.length === 3) { // DD/MM/YYYY
                        y = parseInt(parts[2]);
                        m = parseInt(parts[1]) - 1;
                    }
                }
                
                if (y > 0) {
                    targetDate = new Date(y, m, 1);
                    // Diferença de meses
                    monthsLeft = (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth());
                    monthsLeft = Math.max(1, monthsLeft);
                    
                    // Cálculo: Aporte = (Total - Já Arrecadado) / Meses
                    monthlyContribution = remainingValue / monthsLeft;
                }
            } else {
                // LÓGICA 2: É UM VALOR (Ou vazio)
                monthlyContribution = Utils.parseMoney(paramStr);
                
                // Cálculo: Meses = (Total - Já Arrecadado) / Aporte
                if (monthlyContribution > 0) {
                    monthsLeft = Math.ceil(remainingValue / monthlyContribution);
                } else {
                    monthsLeft = 0; // Sem previsão
                }
            }

            return {
                title: idx.title > -1 ? getVal(idx.title) : 'Meta',
                total: total,
                current: current,
                monthly: monthlyContribution, // Valor calculado ou lido
                monthsLeft: monthsLeft,       // Valor calculado
                image: idx.image > -1 ? getVal(idx.image) : '',
                percent: total > 0 ? (current / total) * 100 : 0,
                isDateBased: !!targetDate
            };
        }).filter(g => g.total > 0);
    },

    // ... (Resto do DataService mantido igual: buildCache, getters, etc) ...
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
        if(this.bradescoTransactions.length) lastBrad = this.bradescoTransactions[this.bradescoTransactions.length-1].balance;
        if(this.santanderAccountTransactions.length) lastSant = this.santanderAccountTransactions[this.santanderAccountTransactions.length-1].balance;
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
    getAllCategories() {
        const cats = new Set();
        if(this.bradescoTransactions) this.bradescoTransactions.forEach(t => cats.add(t.category));
        if(this.santanderCardTransactions) this.santanderCardTransactions.forEach(t => cats.add(t.category));
        return Array.from(cats).sort();
    },
    getDashboardStats(year, month) {
        let balBrad=0, balSant=0;
        if(this.bradescoTransactions.length) balBrad = this.bradescoTransactions[0].balance;
        if(this.santanderAccountTransactions.length) balSant = this.santanderAccountTransactions[0].balance;
        
        let startM = month - 1; let startY = year; if(startM < 0){ startM=11; startY--; }
        const currentStartDate = new Date(startY, startM, 16);
        const endDate = new Date(year, month, 15, 23, 59, 59);
        const patternStartDate = new Date(year, month - 3, 16); 

        let invoiceTotal=0, paretoTotal=0; 
        let paretoCategories={}; 
        const dailyExpenses=new Array(31).fill(0); 
        const weeklyStats=[0,0,0,0];

        const processStats = (list) => {
            if(!list) return;
            list.forEach(t => {
                if(t.type !== 'expense' || AppParams.ignorePatterns.some(p => t.description.toLowerCase().includes(p))) return;
                const val = Math.abs(t.value);
                if(t.date >= currentStartDate && t.date <= endDate && t.source === 'santander_card') invoiceTotal += val;
                if(t.date >= patternStartDate && t.date <= endDate && t.source === 'santander_card') {
                    paretoTotal += val;
                    const cat = t.category || 'Outros';
                    paretoCategories[cat] = (paretoCategories[cat] || 0) + val;
                    if(t.date.getDate() <= 31) dailyExpenses[t.date.getDate()-1] += val;
                }
                if(t.date.getMonth() === month && t.date.getFullYear() === year) {
                    const d = t.date.getDate();
                    if(d <= 7) weeklyStats[0]+=val; else if(d<=14) weeklyStats[1]+=val; else if(d<=21) weeklyStats[2]+=val; else weeklyStats[3]+=val;
                }
            });
        };
        processStats(this.santanderCardTransactions);
        processStats(this.bradescoTransactions);
        processStats(this.santanderAccountTransactions);

        let sumIncome=0, sumFixed=0, sumProjBalance=0;
        const fixedCats = ['aluguel', 'luz', 'internet', 'streaming', 'sem parar', 'transporte'];
        for (let i = 1; i <= 3; i++) {
            let y = year, m = month - i; if(m < 0){ m+=12; y--; }
            const d = this.getMonthly(y);
            if(d) {
                const inc = d.income[m]; sumIncome += inc;
                const exp = d.expenses[m]; sumProjBalance += (inc - exp);
                let mFixed = 0;
                const checkFixed = (list) => {
                    list.forEach(t => {
                        const fp = (t.date.getDate() >= 16) ? (t.date.getMonth() + 1) % 12 : t.date.getMonth();
                        const fy = (t.date.getDate() >= 16 && t.date.getMonth() === 11) ? t.date.getFullYear() + 1 : t.date.getFullYear();
                        if(fp===m && fy===y && t.type==='expense' && fixedCats.includes(t.category.toLowerCase())) mFixed += Math.abs(t.value);
                    });
                };
                if(this.bradescoTransactions) checkFixed(this.bradescoTransactions);
                if(this.santanderAccountTransactions) checkFixed(this.santanderAccountTransactions);
                if(this.santanderCardTransactions) checkFixed(this.santanderCardTransactions);
                sumFixed += mFixed;
            }
        }
        const avgIncome = sumIncome/3; const avgFixed = sumFixed/3; const avgProjBal = sumProjBalance/3;
        const disposableRate = avgProjBal !== 0 ? ((avgProjBal - avgFixed)/avgProjBal)*100 : 0;
        const sortedCats = Object.entries(paretoCategories).sort((a,b) => b[1]-a[1]);
        let paretoSum=0; const paretoCats=[];
        for(const [cat, val] of sortedCats) { paretoCats.push({cat, val}); paretoSum += val; if(paretoTotal>0 && (paretoSum/paretoTotal)>=0.8) break; }

        return {
            metrics: { realBalance: balBrad+balSant, openInvoice: invoiceTotal, predictedIncome: avgIncome, fixedCost: avgFixed, balBrad, balSant, disposableRate, pareto: { topCats: paretoCats, totalPareto: paretoSum, totalExp: paretoTotal }, heatmap: dailyExpenses, weeklyPace: weeklyStats },
            categories: Object.entries(paretoCategories).map(([k, v]) => ({ k, v, c: AppParams.colors.categories[k] || 'bg-gray-400' })).sort((a, b) => b.v - a.v)
        };
    },
    getLast12ClosedInvoicesBreakdown() {
        const { year, month } = this.getLatestPeriod();
        let currentM = month - 1; let currentY = year; if(currentM < 0){ currentM=11; currentY--; }
        const labels = []; const data = []; const allCategories = new Set();
        const targetMonths = [];
        for (let i = 11; i >= 0; i--) {
            let m = currentM - i; let y = currentY;
            const offset = Math.floor(m / 12); m = ((m % 12) + 12) % 12; y += offset;
            targetMonths.push({ m, y });
        }
        targetMonths.forEach(target => {
            const { m, y } = target;
            labels.push(`${AppParams.months.short[m]}/${y.toString().substr(2)}`);
            let startM = m - 1; let startY = y; if(startM < 0){ startM=11; startY--; }
            const startD = new Date(startY, startM, 16); const endD = new Date(y, m, 15, 23, 59, 59);
            const monthData = {};
            if(this.santanderCardTransactions) {
                this.santanderCardTransactions.forEach(t => {
                    if(t.type === 'expense' && !AppParams.ignorePatterns.some(p => t.description.toLowerCase().includes(p))) {
                        if(t.date >= startD && t.date <= endD) {
                            const cat = t.category || 'Outros';
                            monthData[cat] = (monthData[cat] || 0) + Math.abs(t.value);
                            allCategories.add(cat);
                        }
                    }
                });
            }
            data.push(monthData);
        });
        return { months: labels, categories: Array.from(allCategories).sort(), data: data };
    },
    getYearlyCategoryBreakdown(year) { return this.getLast12ClosedInvoicesBreakdown(); },
    getGoalsStats() {
        let totalBalance = 0;
        if(this.bradescoTransactions.length) totalBalance += this.bradescoTransactions[0].balance;
        if(this.santanderAccountTransactions.length) totalBalance += this.santanderAccountTransactions[0].balance;
        const { year, month } = this.getLatestPeriod();
        let totalExp = 0; let count = 0;
        for (let i = 1; i <= 6; i++) {
            let m = month - i; let y = year;
            if(m < 0) { m += 12; y--; }
            const d = this.getMonthly(y);
            if(d && d.expenses[m] > 0) { totalExp += d.expenses[m]; count++; }
        }
        const avgExp = count > 0 ? totalExp / count : 0;
        const runway = avgExp > 0 ? (totalBalance / avgExp).toFixed(1) : 0;
        return { currentBalance: totalBalance, avgExp: avgExp, runway: runway, goals: this.goalsList };
    }
};
window.DataService = DataService;
