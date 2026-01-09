const DataService = {
    transactions: [],
    santanderTransactions: [], 
    santanderHeaders: [], 
    santanderIndices: {},
    monthlyDataCache: {},
    
    listeners: [],
    subscribe(fn) { this.listeners.push(fn); },
    notify() { this.listeners.forEach(fn => fn(this)); },

    async init() {
        console.log("🚀 DataService: Iniciando busca de dados...");
        Utils.DOM.updateText('current-month-badge', 'Buscando dados...');

        try {
            const ts = `&t=${Date.now()}`;
            const results = await Promise.allSettled([
                this.fetchData(AppParams.urls.transactions + ts, 'CSV (Transações)'),
                this.fetchData(AppParams.urls.santander + ts, 'TSV (Santander)')
            ]);

            if (results[0].status === 'fulfilled') {
                this.parseCSV(results[0].value);
            } else {
                console.error("❌ Erro Transações:", results[0].reason);
            }

            if (results[1].status === 'fulfilled') {
                this.parseSantanderTSV(results[1].value);
            } else {
                console.error("❌ Erro Santander:", results[1].reason);
            }

            this.buildCache();
            console.log("✅ DataService: Dados processados. Notificando módulos.");
            this.notify(); 
            return true;

        } catch (error) {
            console.error("☠️ Falha Crítica no DataService:", error);
            alert("Erro ao carregar dados. Abra o Console (F12) para ver detalhes.");
            Utils.DOM.updateText('current-month-badge', 'Erro de Conexão');
            return false;
        }
    },

    async fetchData(url, label) {
        console.log(`📡 Buscando ${label}...`);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.text();
    },

    getConsolidatedTransactions() {
        let accData = this.transactions.map(t => ({
            ...t, sourceType: 'account', sourceLabel: 'Conta'
        }));
        let cardData = this.santanderTransactions.map(t => ({
            date: t.date, description: t.description, category: t.category || 'Cartão',
            value: Math.abs(t.value) * -1, type: 'expense', sourceType: 'card', sourceLabel: 'Cartão Santander'
        }));
        const invoiceKeywords = ['fatura', 'pagamento cartão', 'deb aut fatura', 'santander master'];
        accData = accData.filter(t => {
            if (t.type === 'expense') {
                const desc = t.description.toLowerCase();
                if (invoiceKeywords.some(k => desc.includes(k))) return false;
            }
            return true;
        });
        return [...accData, ...cardData].sort((a,b) => b.date - a.date);
    },

    parseSantanderTSV(text) {
        const rows = text.split('\n').map(r => r.trim()).filter(r => r);
        if (rows.length < 2) return;
        const rawHeaders = rows[0].split('\t').map(h => h.replace(/"/g, '').trim());
        this.santanderHeaders = rawHeaders;
        const lowerHeaders = rawHeaders.map(h => h.toLowerCase());
        const idx = {
            date: lowerHeaders.findIndex(h => h.includes('data') || h.includes('date')),
            val: lowerHeaders.findIndex(h => h.includes('valor') || h.includes('amount') || h.includes('total') || h.includes('preço')),
            cat: lowerHeaders.findIndex(h => h.includes('categ') || h.includes('classe') || h.includes('ramo')),
            desc: lowerHeaders.findIndex(h => h.includes('desc') || h.includes('histórico') || h.includes('estabelecimento')),
            parcela: lowerHeaders.findIndex(h => h.includes('parcela'))
        };
        this.santanderIndices = idx;
        
        this.santanderTransactions = rows.slice(1).map(row => {
            const cols = row.split('\t').map(c => c.replace(/"/g, '').trim());
            while(cols.length < rawHeaders.length) cols.push('');
            let dateObj = new Date(0);
            if (idx.date > -1 && cols[idx.date]) {
                const dStr = cols[idx.date];
                if(dStr.match(/^\d{2}\/\d{2}\/\d{4}/)) {
                    const [d, m, y] = dStr.split('/');
                    dateObj = new Date(y, m-1, d);
                } else {
                    const tryD = new Date(dStr);
                    if(!isNaN(tryD)) dateObj = tryD;
                }
            }
            let currentInst = 1;
            if (idx.parcela > -1 && cols[idx.parcela]) {
                const pMatch = cols[idx.parcela].match(/(\d+)\/(\d+)/);
                if (pMatch) currentInst = parseInt(pMatch[1]);
            } else if (idx.desc > -1 && cols[idx.desc]) {
                const dMatch = cols[idx.desc].match(/(\d{1,2})\/(\d{1,2})/);
                if (dMatch) currentInst = parseInt(dMatch[1]);
            }
            if (currentInst > 1) dateObj.setMonth(dateObj.getMonth() + (currentInst - 1));

            let valNum = 0;
            if (idx.val > -1) { valNum = Utils.parseMoney(cols[idx.val]); }
            
            return {
                date: dateObj, _sortDate: dateObj, value: valNum,
                category: idx.cat > -1 ? cols[idx.cat] : 'Outros',
                description: idx.desc > -1 ? cols[idx.desc] : '',
                data: cols
            };
        }).filter(t => t.data.some(c => c));
        this.santanderTransactions.sort((a,b) => b._sortDate - a._sortDate);
    },

    parseCSV(text) {
        const rows = text.split('\n').map(r => r.trim()).filter(r => r);
        if (rows.length < 2) return;
        const splitCSV = (str) => {
            const result = [];
            let current = '';
            let inQuote = false;
            for (let i = 0; i < str.length; i++) {
                const char = str[i];
                if (char === '"') inQuote = !inQuote;
                else if (char === ',' && !inQuote) { result.push(current); current = ''; }
                else current += char;
            }
            result.push(current);
            return result;
        };
        const headers = splitCSV(rows[0].toLowerCase());
        const findI = (keys) => headers.findIndex(h => keys.some(k => h.includes(k)));
        const idx = {
            date: Math.max(0, findI(['data', 'date'])),
            type: Math.max(1, findI(['tipo', 'type'])),
            cat: Math.max(2, findI(['cat'])),
            desc: Math.max(3, findI(['desc'])),
            val: Math.max(4, findI(['valor', 'value'])),
            bal: findI(['saldo', 'balance'])
        };
        
        this.transactions = rows.slice(1).map(row => {
            const cols = splitCSV(row);
            if(cols.length < 5) return null;
            let dateStr = cols[idx.date].replace(/"/g, '');
            let date;
            if(dateStr.match(/^\d{2}\/\d{2}\/\d{4}/)) {
                const [d, m, y] = dateStr.split('/');
                date = new Date(y, m-1, d);
            } else { date = new Date(dateStr); }
            if (isNaN(date.getTime())) return null;
            const typeStr = cols[idx.type].toLowerCase();
            const isIncome = typeStr.includes('receita') || typeStr.includes('income');
            return {
                date: date, type: isIncome ? 'income' : 'expense',
                category: cols[idx.cat].replace(/"/g, ''),
                description: cols[idx.desc].replace(/"/g, ''),
                value: Math.abs(Utils.parseMoney(cols[idx.val])),
                balance: idx.bal > -1 ? Utils.parseMoney(cols[idx.bal]) : 0
            };
        }).filter(t => t);
        this.transactions.sort((a,b) => b.date - a.date);
        const years = new Set(this.transactions.map(t => t.date.getFullYear()));
        if(years.size > 0) {
            AppParams.years = Array.from(years).sort();
            const lastYear = AppParams.years[AppParams.years.length-1];
            if(!AppState.selectedYears.includes(lastYear)) AppState.selectedYears = [lastYear];
            AppParams.years.forEach(y => {
                if(!AppState.reportSelections[y]) AppState.reportSelections[y] = Array.from({length:12},(_,i)=>i);
            });
        }
    },

    buildCache() {
        // Inicializa o cache para cada ano
        this.monthlyDataCache = {};
        AppParams.years.forEach(y => {
            this.monthlyDataCache[y] = { 
                income: new Array(12).fill(0), 
                expenses: new Array(12).fill(0), 
                balances: new Array(12).fill(0) 
            };
        });

        // 1. Processamento de Saldo (Mantém Mês Civil para fidelidade com extrato bancário)
        const eomBalances = {};
        // Ordena transações (descendente, conforme parseCSV)
        // O loop original pegava o primeiro encontrado (o mais recente do mês), o que é correto para End of Month Balance
        for (const t of this.transactions) {
            const key = `${t.date.getFullYear()}-${t.date.getMonth()}`;
            if (eomBalances[key] === undefined) eomBalances[key] = t.balance;
        }

        // 2. Processamento de Fluxo (Receita/Despesa) com Regra de Data de Corte (16/M-1 a 15/M)
        const flowData = this.getConsolidatedTransactions();
        
        flowData.forEach(t => {
            const d = t.date.getDate();
            let m = t.date.getMonth();
            let y = t.date.getFullYear();

            // Regra: Dia >= 16 conta para o próximo mês
            if (d >= 16) {
                m++;
                if (m > 11) {
                    m = 0;
                    y++;
                }
            }

            // Se o ano calculado (fiscal) existe no cache, acumula
            if (this.monthlyDataCache[y]) {
                const val = Math.abs(t.value);
                if (t.type === 'income') this.monthlyDataCache[y].income[m] += val;
                else this.monthlyDataCache[y].expenses[m] += val;
            }
        });

        // 3. Preenchimento final dos Saldos nos Arrays
        // Define saldo inicial como o da transação mais antiga disponível
        let runningBalance = this.transactions.length > 0 ? this.transactions[this.transactions.length - 1].balance : 0;
        
        AppParams.years.forEach(y => {
            for (let m = 0; m < 12; m++) {
                const key = `${y}-${m}`;
                if (eomBalances[key] !== undefined) runningBalance = eomBalances[key];
                this.monthlyDataCache[y].balances[m] = runningBalance;
            }
        });
    },

    getMonthly(year) { return this.monthlyDataCache[year]; },
    
    getLatestPeriod() {
        if (this.transactions.length === 0) {
            const now = new Date();
            return { year: now.getFullYear(), month: now.getMonth() };
        }
        const d = this.transactions[0].date;
        return { year: d.getFullYear(), month: d.getMonth() };
    },

    getDashboardStats(year, month) {
        // Cálculo Dashboard (Mantém visão Mês Civil para bater com extrato ou altera?)
        // Para consistência, o Dashboard (Visão Geral) geralmente foca no mês civil atual.
        // Vou manter a lógica original aqui para não confundir o usuário que olha o app do banco.
        
        const accIncome = this.transactions.filter(t => t.type === 'income' && t.date.getMonth() === month && t.date.getFullYear() === year).reduce((a, b) => a + b.value, 0);
        const accExpense = this.transactions.filter(t => t.type === 'expense' && t.date.getMonth() === month && t.date.getFullYear() === year).reduce((a, b) => a + b.value, 0);
        const accBalance = accIncome - accExpense;

        let prevYear = year, prevMonth = month - 1;
        if (prevMonth < 0) { prevMonth = 11; prevYear--; }
        const prevIncome = this.transactions.filter(t => t.type === 'income' && t.date.getMonth() === prevMonth && t.date.getFullYear() === prevYear).reduce((a, b) => a + b.value, 0);
        const prevExpense = this.transactions.filter(t => t.type === 'expense' && t.date.getMonth() === prevMonth && t.date.getFullYear() === prevYear).reduce((a, b) => a + b.value, 0);
        const calcTrend = (now, bef) => bef === 0 ? (now === 0 ? 0 : 100) : ((now - bef) / bef) * 100;

        const catTotals = {};
        const startDate = new Date(year, month - 1, 16); 
        const endDate = new Date(year, month, 15, 23, 59, 59);
        const sourceData = this.santanderTransactions.length > 0 ? this.santanderTransactions : [];
        let cardInvoiceTotal = 0;
        sourceData.forEach(t => {
            if (t.date >= startDate && t.date <= endDate) {
                let val = t.value;
                cardInvoiceTotal += val;
                if (Math.abs(val) > 0) {
                    const cat = t.category || 'Sem Categoria';
                    catTotals[cat] = (catTotals[cat] || 0) + Math.abs(val);
                }
            }
        });

        const targetFixedCats = ['Tarifa conta de banco', 'Sem Parar', 'Streaming', 'Aluguel', 'Internet', 'Luz', 'Serviços'];
        let fixedCostSum = 0;
        for (let i = 0; i < 3; i++) {
            let y = year, m = month - i;
            if (m < 0) { m += 12; y--; }
            this.transactions.forEach(t => {
                if (t.type === 'expense' && t.date.getMonth() === m && t.date.getFullYear() === y) {
                    if (targetFixedCats.includes(t.category)) fixedCostSum += t.value;
                }
            });
            const start = new Date(y, m - 1, 16);
            const end = new Date(y, m, 15, 23, 59, 59);
            this.santanderTransactions.forEach(t => {
                if (t.date >= start && t.date <= end) {
                    if (targetFixedCats.includes(t.category)) fixedCostSum += Math.abs(t.value);
                }
            });
        }
        const fixedCost = fixedCostSum / 3;
        
        let discretionaryRatio = 0;
        if (accIncome > 0) discretionaryRatio = ((accIncome - fixedCost) / accIncome) * 100;

        let breakEvenDay = null;
        const dailyIncomes = this.transactions
            .filter(t => t.type === 'income' && t.date.getMonth() === month && t.date.getFullYear() === year)
            .sort((a,b) => a.date - b.date);
        let currentAccIncome = 0;
        for (const t of dailyIncomes) {
            currentAccIncome += t.value;
            if (currentAccIncome >= accExpense) { breakEvenDay = t.date.getDate(); break; }
        }
        
        const sortedCats = Object.entries(catTotals).sort((a,b) => b[1] - a[1]);
        let paretoSum = 0;
        const paretoCats = [];
        for(const [cat, val] of sortedCats) {
            paretoCats.push({cat, val});
            paretoSum += val;
            if(cardInvoiceTotal > 0 && (paretoSum / cardInvoiceTotal) >= 0.8) break;
        }

        const dailyExpenses = new Array(31).fill(0);
        this.transactions.filter(t => t.type === 'expense' && t.date.getMonth() === month && t.date.getFullYear() === year).forEach(t => {
            const d = t.date.getDate();
            if(d >= 1 && d <= 31) dailyExpenses[d-1] += t.value;
        });

        const curCache = this.getMonthly(year);
        const currentAccountBalance = (curCache && curCache.balances[month] !== undefined) ? curCache.balances[month] : 0;
        return {
            metrics: { 
                income: accIncome, expense: accExpense, balance: accBalance, 
                fixedCost: fixedCost, accountBalance: currentAccountBalance, cardInvoice: cardInvoiceTotal,
                discretionaryRatio: discretionaryRatio, breakEvenDay: breakEvenDay,
                pareto: { topCats: paretoCats, totalPareto: paretoSum, totalExp: cardInvoiceTotal },
                heatmap: dailyExpenses
            },
            trends: { income: calcTrend(accIncome, prevIncome), expense: calcTrend(accExpense, prevExpense) },
            categories: Object.entries(catTotals).map(([k, v]) => ({ k, v, c: AppParams.colors.categories[k] || 'bg-gray-400' })).sort((a, b) => b.v - a.v),
            recent: this.transactions.slice(0, 5)
        };
    },

    getAggregated(year, isMonthly, indices) {
        const d = this.getMonthly(year);
        if (!d) return { income: [], expenses: [], balances: [], labels: [] };
        let income = [], expenses = [], balances = [], labels = [];
        const sum = (arr) => arr.reduce((a, b) => a + b, 0);
        if (isMonthly) {
            indices.forEach(i => {
                if (d.income[i] !== undefined) {
                    income.push(d.income[i]); expenses.push(d.expenses[i]); balances.push(d.balances[i]); labels.push(AppParams.months.short[i]);
                }
            });
        } else {
            indices.forEach(q => {
                const start = q * 3;
                if (start < d.income.length) {
                    income.push(sum(d.income.slice(start, start + 3)));
                    expenses.push(sum(d.expenses.slice(start, start + 3)));
                    balances.push(d.balances[Math.min(start + 2, 11)]); 
                    labels.push(AppParams.quarters.short[q]);
                }
            });
        }
        return { income, expenses, balances, labels };
    },

    getCategoryHistory(category) {
        const history = [];
        const { year, month } = this.getLatestPeriod();
        for (let i = 11; i >= 0; i--) {
            let y = year, m = month - i;
            if (m < 0) { m += 12; y--; }
            const total = this.santanderTransactions.filter(t => t.category === category && t.date.getMonth() === m && t.date.getFullYear() === y).reduce((a, b) => a + Math.abs(b.value), 0);
            history.push({ label: `${AppParams.months.short[m]}/${y.toString().substr(2)}`, value: total });
        }
        return history;
    },
    
    getYearlyCategoryBreakdown(year) {
        const monthlyData = Array.from({length: 12}, () => ({}));
        const allCategories = new Set();
        this.santanderTransactions.forEach(t => {
                if (t.date.getFullYear() === year) {
                    const m = t.date.getMonth();
                    const cat = t.category || 'Outros';
                    allCategories.add(cat);
                    monthlyData[m][cat] = (monthlyData[m][cat] || 0) + Math.abs(t.value);
                }
        });
        return { months: AppParams.months.short, categories: Array.from(allCategories).sort(), data: monthlyData };
    },

    getAllCategories() {
        const cats = new Set();
        this.santanderTransactions.forEach(t => { if(t.category) cats.add(t.category); });
        return Array.from(cats).sort();
    },

    getGoalsStats() {
        const { year, month } = this.getLatestPeriod();
        const curData = this.getMonthly(year);
        let currentBalance = 0;
        if (curData && curData.balances[month] !== undefined) currentBalance = curData.balances[month];

        let totalExp = 0, count = 0;
        for(let i=0; i<6; i++) {
            let y = year, m = month - i;
            if(m < 0) { m += 12; y--; }
            const d = this.getMonthly(y);
            if(d && d.expenses[m] > 0) { totalExp += d.expenses[m]; count++; }
        }
        const avgExp = count > 0 ? totalExp / count : 0;
        const runway = avgExp > 0 ? (currentBalance / avgExp) : 0;
        return { currentBalance, avgExp, runway };
    }
};
window.DataService = DataService;
