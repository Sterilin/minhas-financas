// Parser Worker to offload heavy lifting from the main thread

self.onmessage = function(e) {
    const { type, payload } = e.data;

    if (type === 'PARSE_STATEMENT') {
        const { text, sourceLabel, ignorePatterns } = payload;
        const result = parseBankStatement(text, sourceLabel, ignorePatterns);
        self.postMessage({ type: 'PARSE_COMPLETE', payload: { sourceLabel, data: result } });
    }
    else if (type === 'PARSE_CARD') {
        const { text, ignorePatterns } = payload;
        const result = parseSantanderCardTSV(text, ignorePatterns);
        self.postMessage({ type: 'PARSE_COMPLETE', payload: { sourceLabel: 'santander_card', data: result } });
    }
    else if (type === 'PARSE_GOALS') {
        const { text, months } = payload;
        const result = parseGoalsTSV(text, months);
        self.postMessage({ type: 'PARSE_COMPLETE', payload: { sourceLabel: 'goals', data: result } });
    }
};

// --- Helper Functions (copied from original DataService but adapted for worker context) ---

function parseMoney(str) {
    if (!str) return 0;
    let s = str.replace(/["R$\s\xa0]/g, '');
    if (s.indexOf(',') > -1) {
        s = s.replace(/\./g, '').replace(',', '.');
    }
    return parseFloat(s) || 0;
}

function parseBankStatement(text, sourceLabel, ignorePatterns = []) {
    if (!text || typeof text !== 'string') return [];
    const rows = text.split('\n').map(r => r.trim()).filter(r => r);
    if (rows.length < 2) return []; // Validation: Needs header + at least one row

    const headers = rows[0].toLowerCase().split('\t');
    // Strict Validation: Ensure essential columns exist
    const idx = {
        date: headers.findIndex(h => h.includes('data')),
        val: headers.findIndex(h => h.includes('valor')),
        bal: headers.findIndex(h => h.includes('saldo')),
        desc: headers.findIndex(h => h.includes('desc') || h.includes('hist') || h.includes('lanc'))
    };

    if (idx.date === -1 || idx.val === -1) {
        console.error(`Invalid format for ${sourceLabel}: Missing Date or Value columns.`);
        return [];
    }

    return rows.slice(1).map(row => {
        const cols = row.split('\t');
        if(cols.length < 3) return null;

        let date = new Date(); // Default to now if parse fails, but we try to parse
        const dStr = cols[idx.date];
        if(dStr && dStr.match(/^\d{2}\/\d{2}\/\d{2,4}/)) {
            const [d, m, y] = dStr.split('/');
            date = new Date(y.length===2 ? '20'+y : y, m-1, d);
        }

        const val = idx.val > -1 ? parseMoney(cols[idx.val]) : 0;
        const bal = idx.bal > -1 ? parseMoney(cols[idx.bal]) : 0;
        const desc = (idx.desc > -1 ? cols[idx.desc] : '').replace(/"/g, '');
        const descLower = desc.toLowerCase();

        let cat = 'Outros';
        if(val > 0) cat = 'Receita';
        else if(descLower.includes('pix')) cat = 'Pix';

        const isIgnored = ignorePatterns.some(p => descLower.includes(p));

        return {
            dateStr: date.toISOString(), // Send as string, rehydrate on main thread
            description: desc,
            value: val,
            balance: bal,
            category: cat,
            source: sourceLabel,
            type: val >= 0 ? 'income' : 'expense',
            isIgnored
        };
    }).filter(t => t).sort((a,b) => new Date(b.dateStr) - new Date(a.dateStr));
}

function parseSantanderCardTSV(text, ignorePatterns = []) {
    if (!text || typeof text !== 'string') return [];
    const rows = text.split('\n').map(r => r.trim()).filter(r => r);
    if (rows.length < 2) return [];

    const headers = rows[0].toLowerCase().split('\t');
    const idx = {
        date: headers.findIndex(h => h.includes('data')),
        val: headers.findIndex(h => h.includes('valor')),
        cat: headers.findIndex(h => h.includes('categ') || h.includes('ramo')),
        desc: headers.findIndex(h => h.includes('desc'))
    };

    if (idx.date === -1 || idx.val === -1) return [];

    return rows.slice(1).map(row => {
        const cols = row.split('\t');
        let date = new Date();
         if (idx.date > -1 && cols[idx.date]) {
            const dStr = cols[idx.date];
            if(dStr.match(/^\d{2}\/\d{2}\/\d{4}/)) {
                const [d, m, y] = dStr.split('/');
                date = new Date(y, m-1, d);
            }
        }
        const val = idx.val > -1 ? parseMoney(cols[idx.val]) : 0;
        const desc = idx.desc > -1 ? cols[idx.desc].replace(/"/g, '') : 'Santander';
        const isIgnored = ignorePatterns.some(p => desc.toLowerCase().includes(p));

        return {
            dateStr: date.toISOString(),
            description: desc,
            value: val,
            category: idx.cat > -1 ? cols[idx.cat] : 'Cartão',
            source: 'santander_card',
            type: val > 0 ? 'expense' : 'income',
            isIgnored
        };
    }).filter(t => t && t.value !== 0).sort((a,b) => new Date(b.dateStr) - new Date(a.dateStr));
}

function parseGoalsTSV(text, monthsShort) {
    if (!text || typeof text !== 'string') return [];
    const rows = text.split('\n').map(r => r.trim()).filter(r => r);
    if (rows.length < 2) return [];

    const headers = rows[0].toLowerCase().split('\t');
    const idx = {
        title: headers.findIndex(h => h.includes('título') || h.includes('titulo') || h.includes('nome')),
        total: headers.findIndex(h => h.includes('total') || h.includes('alvo')),
        current: headers.findIndex(h => h.includes('atual') || h.includes('acumulado')),
        param: headers.findIndex(h => h.includes('aporte') || h.includes('mensal') || h.includes('meta')),
        image: headers.findIndex(h => h.includes('imagem') || h.includes('img'))
    };

    return rows.slice(1).map(row => {
        const cols = row.split('\t');
        const getVal = (i) => (i > -1 && cols[i]) ? cols[i] : '';
        const total = parseMoney(getVal(idx.total));
        const current = parseMoney(getVal(idx.current));
        const paramStr = getVal(idx.param);
        let monthlyContribution = 0; let monthsLeft = 0;
        const remainingValue = Math.max(0, total - current);
        const dateMatch = paramStr.match(/(\d{1,2})[\/\-](\d{2,4})/) || paramStr.match(/([a-zA-Z]{3})[\/\-](\d{2,4})/);

        if (dateMatch) {
            const now = new Date(); let m = 0, y = 0;
            if(paramStr.includes('/')) {
                const parts = paramStr.split('/');
                if(parts.length === 2) { y = parseInt(parts[1]); y = y < 100 ? 2000 + y : y; const mStr = parts[0].toLowerCase(); m = monthsShort.findIndex(x => x.toLowerCase() === mStr); if(m === -1 && !isNaN(parts[0])) m = parseInt(parts[0]) - 1; }
                else if (parts.length === 3) { y = parseInt(parts[2]); m = parseInt(parts[1]) - 1; }
            }
            if (y > 0) {
                const targetDate = new Date(y, m, 1);
                monthsLeft = (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth());
                monthsLeft = Math.max(1, monthsLeft);
                monthlyContribution = remainingValue / monthsLeft;
            }
        } else {
            monthlyContribution = parseMoney(paramStr);
            if (monthlyContribution > 0) monthsLeft = Math.ceil(remainingValue / monthlyContribution);
        }
        return {
            title: idx.title > -1 ? getVal(idx.title) : 'Meta',
            total,
            current,
            monthly: monthlyContribution,
            monthsLeft,
            image: idx.image > -1 ? getVal(idx.image) : '',
            percent: total > 0 ? (current / total) * 100 : 0
        };
    }).filter(g => g.total > 0);
}
