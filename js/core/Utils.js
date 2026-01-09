const Utils = {
    formatCurrency: (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v),
    parseMoney: (str) => {
        if (!str) return 0;
        let s = str.replace(/["R$\s\xa0]/g, '');
        if (s.indexOf(',') > -1) {
            s = s.replace(/\./g, '').replace(',', '.');
        }
        return parseFloat(s) || 0;
    },
    DOM: {
        el: (id) => document.getElementById(id),
        cache: {},
        get(id) {
            if (!this.cache[id]) this.cache[id] = this.el(id);
            return this.cache[id];
        },
        updateText(id, text) { const el = this.get(id); if(el) el.innerText = text; },
        updateHTML(id, html) { const el = this.get(id); if(el) el.innerHTML = html; },
        getValue(id) { const el = this.get(id); return el ? el.value : null; }
    }
};
// Expor globalmente para manter compatibilidade com módulos
window.Utils = Utils;