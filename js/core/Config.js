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
            'Moradia': 'bg-[#0b0f08]',
            'Alimentação': 'bg-[#acbd5e]',
            'Transporte': 'bg-[#283f23]',
            'Lazer': 'bg-[#b78449]',
            'Outros': 'bg-[#6b7280]',
            'Salário': 'bg-[#397234]',
            'Freelance': 'bg-[#397234]',
            'Investimento': 'bg-[#2a190f]',
            'Mercado': 'bg-[#acbd5e]',
            'Restaurante': 'bg-[#b78449]',
            'Festa': 'bg-[#d4a365]',
            'Bar': 'bg-[#d4a365]',
            'Airbnb': 'bg-[#966835]',
            'Lojas': 'bg-[#3f2617]',
            'Streaming': 'bg-[#5c3a26]',
            'Sem Parar': 'bg-[#283f23]',
            'Farmácia': 'bg-[#8a9d4b]',
            'Ingresso': 'bg-[#d4a365]',
            'Serviços': 'bg-[#397234]',
            'Academia': 'bg-[#8a9d4b]'
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
