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
            'Moradia': 'bg-slate-800',
            'Alimentação': 'bg-emerald-500',
            'Transporte': 'bg-blue-600',
            'Lazer': 'bg-amber-500',
            'Outros': 'bg-slate-300',
            'Salário': 'bg-blue-600',
            'Freelance': 'bg-blue-600',
            'Investimento': 'bg-indigo-400',
            'Mercado': 'bg-emerald-500',
            'Restaurante': 'bg-amber-500',
            'Festa': 'bg-amber-500',
            'Bar': 'bg-amber-500',
            'Airbnb': 'bg-amber-500',
            'Lojas': 'bg-indigo-400',
            'Streaming': 'bg-indigo-400',
            'Sem Parar': 'bg-blue-600',
            'Farmácia': 'bg-emerald-500',
            'Ingresso': 'bg-amber-500',
            'Serviços': 'bg-blue-600',
            'Academia': 'bg-emerald-500'
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
        'apl.invest fac',
        'transfe pix des', // Mantido o original
        'resgate inv fac',
        'pix recebido pedro gioia martins',
        'apl.invest',
        'invest fac',
        'invest.fac',
        'transfe pix',   // Pega "Transfe Pix" mesmo se o final mudar
        'pix des',       // Pega "Pix Des" mesmo se o começo mudar
        'transfe.pix'    // Caso haja ponto no lugar de espaço
    ],
    years: [2024, 2025, 2026],
    urls: {
        bradesco: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTfJcPWRMKT9iyUjGUs7EnCdAaqO7Z1TpHqWMT0nLSrl6TUbH43h5pKwnLHfieisnWUaHgdkYx3MAKs/pub?gid=1529188760&single=true&output=tsv',
        santanderAccount: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTfJcPWRMKT9iyUjGUs7EnCdAaqO7Z1TpHqWMT0nLSrl6TUbH43h5pKwnLHfieisnWUaHgdkYx3MAKs/pub?gid=0&single=true&output=tsv',
        santanderCard: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTfJcPWRMKT9iyUjGUs7EnCdAaqO7Z1TpHqWMT0nLSrl6TUbH43h5pKwnLHfieisnWUaHgdkYx3MAKs/pub?gid=894667076&single=true&output=tsv',

        // Link TSV da aba Metas
        goals: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTfJcPWRMKT9iyUjGUs7EnCdAaqO7Z1TpHqWMT0nLSrl6TUbH43h5pKwnLHfieisnWUaHgdkYx3MAKs/pub?gid=202344055&single=true&output=tsv',

        // Link de Edição da Planilha
        goalsEdit: 'https://docs.google.com/spreadsheets/d/1zlEPm91ldWR1RbY87TWctJIaARV6a9UpMLCNTBxQC_g/edit?usp=sharing'
    }
};
window.AppParams = AppParams;
