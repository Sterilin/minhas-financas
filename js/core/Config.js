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
    ignorePatterns: [
        'pagamento fatura', 
        'pagto fatura',
        'transf conta', 
        'transf. para',
        'aplicacao', 
        'resgate', 
        'pix bradesco', 
        'pix santander',
        'transf tit',
        'apl.invest fac' // Novo termo adicionado
    ],
    years: [2024, 2025, 2026],
    urls: {
        // Fonte 1: Conta Bradesco (Hub)
        bradesco: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTfJcPWRMKT9iyUjGUs7EnCdAaqO7Z1TpHqWMT0nLSrl6TUbH43h5pKwnLHfieisnWUaHgdkYx3MAKs/pub?gid=1529188760&single=true&output=tsv',
        
        // Fonte 2: Conta Santander (Movimentação Corrente)
        santanderAccount: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTfJcPWRMKT9iyUjGUs7EnCdAaqO7Z1TpHqWMT0nLSrl6TUbH43h5pKwnLHfieisnWUaHgdkYx3MAKs/pub?gid=0&single=true&output=tsv',
        
        // Fonte 3: Cartão Santander (Fatura)
        santanderCard: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTfJcPWRMKT9iyUjGUs7EnCdAaqO7Z1TpHqWMT0nLSrl6TUbH43h5pKwnLHfieisnWUaHgdkYx3MAKs/pub?gid=894667076&single=true&output=tsv'
    }
};
window.AppParams = AppParams;
