const AppParams = {
    months: {
        full: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
        short: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    },
    quarters: {
        full: ['1º Trimestre', '2º Trimestre', '3º Trimestre', '4º Trimestre'],
        short: ['Q1', 'Q2', 'Q3', 'Q4']
    },
    colors: {
        categories: { 
            'Moradia': 'bg-orange-400', 
            'Alimentação': 'bg-rose-500', 
            'Transporte': 'bg-blue-500', 
            'Lazer': 'bg-emerald-500', 
            'Outros': 'bg-gray-400', 
            'Salário': 'bg-emerald-600', 
            'Freelance': 'bg-blue-400',
            'Investimento': 'bg-purple-500'
        },
        chart: { lightGrid: '#f3f4f6', darkGrid: '#374151', lightText: '#6b7280', darkText: '#9ca3af' }
    },
    // Termos que identificam transferências internas ou pagamentos de fatura
    // Estes itens afetarão o SALDO, mas serão ignorados nos relatórios de Receita/Despesa para não duplicar.
    ignorePatterns: [
        'pagamento fatura', 
        'pagto fatura',
        'transf conta', 
        'transf. para',
        'aplicacao', 
        'resgate', 
        'pix bradesco', 
        'pix santander',
        'transf tit'
    ],
    years: [2024, 2025, 2026],
    urls: {
        // CSV genérico mantido por compatibilidade, mas o foco agora é Bradesco TSV
        transactions: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3... (Seu Link Antigo Opcional)', 
        
        // Nova Fonte Bradesco TSV
        bradesco: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTfJcPWRMKT9iyUjGUs7EnCdAaqO7Z1TpHqWMT0nLSrl6TUbH43h5pKwnLHfieisnWUaHgdkYx3MAKs/pub?gid=1529188760&single=true&output=tsv',
        
        // Fonte Santander TSV (Cartão/Conta)
        santander: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ... (Seu Link Santander Atual)' 
    }
};
window.AppParams = AppParams;
