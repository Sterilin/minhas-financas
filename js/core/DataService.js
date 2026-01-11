const DataService = {
    bradescoTransactions: [], // Nova lista específica
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
            // Agora buscamos Bradesco explicitamente
            const results = await Promise.allSettled([
                this.fetchData(AppParams.urls.bradesco + ts, 'Bradesco (TSV)'),
                this.fetchData(AppParams.urls.santander + ts, 'Santander (TSV)')
            ]);

            if (results[0].status === 'fulfilled') {
                this.parseBradescoTSV(results[0].value);
            } else {
                console.error("❌ Erro Bradesco:", results[0].reason);
            }

            if (results[1].status === 'fulfilled') {
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

    async fetchData(url, label) {
        if(!url || url.includes('...')) return ""; // Ignora URLs placeholder
        console.log(`📡 Buscando ${label}...`);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.text();
    },

    // --- PARSERS ---

    parseBradescoTSV(text) {
        const rows = text.split('\n').map(r => r.trim()).filter(r => r);
        if (rows.length < 2) return;
        
        // Detectar colunas dinamicamente
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

            // Tratamento de Data
            let date = new Date();
            const dStr = cols[idx.date];
            if(dStr && dStr.match(/^\d{2}\/\d{2}\/\d{2,4}/)) {
                const [d, m, y] = dStr.split('/');
                date = new Date(y.length===2 ? '20'+y : y, m-1, d);
            }

            // Tratamento de Valor (Bradesco usa pontuação BR: 1.000,00)
            const valRaw = idx.val > -1 ? cols[idx.val] : '0';
            const val = Utils.parseMoney(valRaw);
            
            // Tratamento de Saldo
            const balRaw = idx.bal > -1 ? cols[idx.bal] : '0';
            const bal = Utils.parseMoney(balRaw);

            // Determina Categoria baseada na descrição (básico)
            const desc = (idx.desc > -1 ? cols[idx.desc] : '').replace(/"/g, '');
            let cat = 'Outros';
            if(val > 0) cat = 'Receita';
            else if(desc.toLowerCase().includes('pix')) cat = 'Pix';
            
            return {
                date: date,
                description: desc,
                value: val, // Positivo = Entrada, Negativo = Saída
                balance: bal,
                category: cat,
                source: 'bradesco',
                type: val >= 0 ? 'income' : 'expense'
            };
        }).filter(t => t);
        
        // Ordena por data (mais recente primeiro)
        this.bradescoTransactions.sort((a,b) => b.date - a.date);
        this.updateYearsFromData(this.bradescoTransactions);
    },

    parseSantanderTSV(text) {
        // Lógica mantida, mas ajustada para garantir consistência
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
            // ... (Lógica de data mantida do seu arquivo anterior) ...
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
                date: date,
                description: desc,
                value: val, // No Santander (Cartão), valor positivo geralmente é gasto, negativo é pagto. Inverteremos na consolidação se necessário.
                category: idx.cat > -1 ? cols[idx.cat] : 'Cartão',
                source: 'santander',
                // No extrato de cartão: Valores positivos são gastos. Valores negativos são pagamentos/estornos.
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
            // Inicializa seleções padrão se não existirem
            AppParams.years.forEach(y => {
                if(!AppState.reportSelections[y]) AppState.reportSelections[y] = Array.from({length:12},(_,i)=>i);
            });
        }
    },

    // --- CONSOLIDAÇÃO INTELIGENTE ---

    buildCache() {
        this.monthlyDataCache = {};
        AppParams.years.forEach(y => {
            this.monthlyDataCache[y] = { 
                income: new Array(12).fill(0), expenses: new Array(12).fill(0), balances: new Array(12).fill(0),
                acc: { income: new Array(12).fill(0), expenses: new Array(12).fill(0) },
                card: { income: new Array(12).fill(0), expenses: new Array(12).fill(0) }
            };
        });

        // Helper para verificar se é transferência/pagamento de fatura
        const isIgnored = (desc) => {
            const d = desc.toLowerCase();
            return AppParams.ignorePatterns.some(pattern => d.includes(pattern));
        };

        // Helper para calcular o Mês Fiscal (16 a 15)
        const getFiscalPeriod = (date) => {
            let m = date.getMonth();
            let y = date.getFullYear();
            if (date.getDate() >= 16) {
                m++;
                if (m > 11) { m = 0; y++; }
            }
            return { m, y };
        };

        // 1. Processar Bradesco (HUB)
        // Precisamos rastrear o saldo mês a mês para o gráfico de evolução
        const bradescoBalances = {}; 
        
        this.bradescoTransactions.forEach(t => {
            // Salva saldo por data (para depois pegar o último do mês)
            const key = `${t.date.getFullYear()}-${t.date.getMonth()}`;
            if (bradescoBalances[key] === undefined) bradescoBalances[key] = t.balance; // Pega o primeiro (que é o mais recente pois está ordenado desc)

            const { m, y } = getFiscalPeriod(t.date);
            
            if (this.monthlyDataCache[y]) {
                // Se for transferência, NÃO soma em Receita/Despesa, mas o saldo já foi capturado acima
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

        // 2. Processar Santander (Satélite + Cartão)
        // Assumindo que o TSV do Santander é primariamente Fatura de Cartão
        // Se houver saldo em conta, precisaríamos de uma lógica similar à do Bradesco para saldo.
        // Por hora, vamos tratar como Cartão (Gastos).
        
        this.santanderTransactions.forEach(t => {
            const { m, y } = getFiscalPeriod(t.date);
            
            if (this.monthlyDataCache[y]) {
                // No cartão, ignoramos pagamentos recebidos (pois saíram do Bradesco ou são estornos que abatem a despesa)
                if (t.type === 'expense') { // Gasto no cartão
                    const val = Math.abs(t.value);
                     // Se for um pagamento de fatura que apareceu no extrato do cartão como crédito, ignoramos
                    if (!isIgnored(t.description)) {
                        this.monthlyDataCache[y].expenses[m] += val;
                        this.monthlyDataCache[y].card.expenses[m] += val;
                    }
                }
            }
        });

        // 3. Preenchimento Final dos Saldos (Bradesco + Santander estimado)
        // Como o Santander TSV de cartão não tem "Saldo em Conta Corrente", 
        // usaremos apenas o saldo do Bradesco como referência de liquidez, 
        // ou você precisará fornecer um valor fixo/manual para o Santander se quiser somar.
        // Lógica atual: Saldo Líquido Disponível = Saldo Bradesco.
        
        let lastKnownBalance = 0;
        // Tenta encontrar o saldo mais recente disponível
        if(this.bradescoTransactions.length > 0) lastKnownBalance = this.bradescoTransactions[0].balance;

        AppParams.years.forEach(y => {
            for (let m = 0; m < 12; m++) {
                // Tenta achar o saldo do final do mês civil (snapshot)
                const key = `${y}-${m}`;
                if (bradescoBalances[key] !== undefined) {
                    lastKnownBalance = bradescoBalances[key];
                }
                // O saldo do gráfico será o saldo acumulado do Bradesco
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
        // ... (Mantém a lógica visual do gráfico) ...
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

    // Retorna lista unificada para a tabela "Consolidado"
    getConsolidatedTransactions() {
        const bradesco = this.bradescoTransactions.map(t => ({...t, sourceLabel: 'Bradesco'}));
        const santander = this.santanderTransactions.map(t => ({
            ...t, 
            value: t.type === 'expense' ? -Math.abs(t.value) : Math.abs(t.value),
            sourceLabel: 'Santander'
        }));
        return [...bradesco, ...santander].sort((a,b) => b.date - a.date);
    },
    
    // Métodos auxiliares mantidos para não quebrar outros módulos
    getAllCategories() {
        const cats = new Set();
        this.bradescoTransactions.forEach(t => cats.add(t.category));
        this.santanderTransactions.forEach(t => cats.add(t.category));
        return Array.from(cats).sort();
    },
    
    getYearlyCategoryBreakdown(year) {
        const data = Array.from({length: 12}, () => ({}));
        // Foca no cartão para inflação pessoal
        this.santanderTransactions.forEach(t => {
            if (t.date.getFullYear() === year && t.type === 'expense') {
                const m = t.date.getMonth();
                const cat = t.category || 'Outros';
                data[m][cat] = (data[m][cat] || 0) + Math.abs(t.value);
            }
        });
        return { months: AppParams.months.short, categories: [], data: data }; // Categories preenchido dinamicamente no chart
    },

    getDashboardStats(year, month) {
        // Dashboard simplificado usando o cache já calculado (que tem a regra 16/15 aplicada)
        const d = this.getMonthly(year);
        const m = month;
        
        // Recupera dados já processados
        const income = d ? d.income[m] : 0;
        const expense = d ? d.expenses[m] : 0;
        const balance = income - expense;
        const accBal = d ? d.balances[m] : 0;
        
        // Cálculo de tendências e detalhes
        // ... (Pode ser refinado depois, focando no básico agora)
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
        // Usa saldo atual do Bradesco
        const curBal = this.bradescoTransactions.length > 0 ? this.bradescoTransactions[0].balance : 0;
        return { currentBalance: curBal, avgExp: 0, runway: 0 };
    }
};
window.DataService = DataService;
