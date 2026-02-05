const ChartManager = {
    resizeTimeout: null, // Optimization 3.1: Debounce timer

    getColors() {
        return {
            grid: AppState.isDark ? AppParams.colors.chart.darkGrid : AppParams.colors.chart.lightGrid,
            text: AppState.isDark ? AppParams.colors.chart.darkText : AppParams.colors.chart.lightText
        };
    },

    updateTheme() {
        Object.values(AppState.charts).forEach(c => {
            if(c) {
                c.options.scales.y.grid.color = this.getColors().grid;
                c.update();
            }
        });
    },

    // Optimization 3.1: Debounced Resize
    resize() {
        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            Object.values(AppState.charts).forEach(c => c && c.resize());
        }, 200); // 200ms debounce
    },

    // Factory para plugin reutilizável (linhas verticais de separação de anos)
    createYearSeparatorPlugin(yearsData) {
        return {
            id: 'yearSeparator',
            afterDraw: (chart) => {
                if (!yearsData || yearsData.length === 0) return;
                const { ctx, chartArea: { top, bottom }, scales: { x } } = chart;
                ctx.save(); ctx.beginPath(); ctx.lineWidth = 2;
                ctx.strokeStyle = AppState.isDark ? '#6b7280' : '#94a3b8';
                ctx.setLineDash([5, 5]);
                for (let i = 1; i < yearsData.length; i++) {
                    if (yearsData[i] !== yearsData[i - 1]) {
                        const xPos = (x.getPixelForValue(i - 1) + x.getPixelForValue(i)) / 2;
                        ctx.moveTo(xPos, top); ctx.lineTo(xPos, bottom);
                    }
                }
                ctx.stroke();
                ctx.restore();
            }
        };
    },

    // Helper para gerar labels do eixo X2 (Anos)
    generateYearLabels(years) {
        const labels = new Array(years.length).fill('');
        let start = 0;
        for (let i = 0; i <= years.length; i++) {
            if (i === years.length || years[i] !== years[start]) {
                const mid = Math.floor((start + (i - 1)) / 2);
                labels[mid] = years[start];
                start = i;
            }
        }
        return labels;
    },

    // Renderizadores Específicos (chamados pelos Módulos)
    renderReport(data) {
        const ctx = Utils.DOM.get('financeChart').getContext('2d');
        if (AppState.charts.report) AppState.charts.report.destroy();
        const colors = this.getColors();

        AppState.charts.report = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    { label: 'Saldo', data: data.bal, type: 'line', borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderWidth: 2, tension: 0.4, order: 0 },
                    { label: 'Receita', data: data.inc, backgroundColor: '#10b981', borderRadius: 4, order: 1 },
                    { label: 'Gastos', data: data.exp, backgroundColor: '#f43f5e', borderRadius: 4, order: 2 }
                ]
            },
            plugins: [this.createYearSeparatorPlugin(data.years)],
            options: {
                responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
                plugins: { legend: { position: 'bottom', labels: { color: colors.text } } },
                scales: {
                    y: { grid: { color: colors.grid }, ticks: { color: colors.text, callback: v => v/1000 + 'k' }, beginAtZero: true },
                    x: { grid: { display: false }, ticks: { color: colors.text } },
                    x2: { type: 'category', labels: this.generateYearLabels(data.years), offset: true, position: 'bottom', grid: { display: false }, ticks: { color: colors.text, font: { weight: 'bold' }, autoSkip: false } }
                }
            }
        });
    },

    renderProjection(data) {
        const ctx = Utils.DOM.get('projectionChart').getContext('2d');
        if(AppState.charts.projection) AppState.charts.projection.destroy();
        const colors = this.getColors();

        AppState.charts.projection = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    { label: 'Histórico', data: data.hist, borderColor: '#4b5563', backgroundColor: 'transparent', pointRadius: 3, tension: 0.4 },
                    { label: 'Projeção', data: data.proj, borderColor: '#6366f1', borderDash: [5, 5], pointRadius: 0, tension: 0.4 },
                    { label: 'Lim. Sup.', data: data.up, borderColor: 'transparent', backgroundColor: 'rgba(16, 185, 129, 0.15)', fill: 1, pointRadius: 0, tension: 0.4 },
                    { label: 'Lim. Inf.', data: data.low, borderColor: 'transparent', backgroundColor: 'rgba(244, 63, 94, 0.15)', fill: 1, pointRadius: 0, tension: 0.4 }
                ]
            },
            plugins: [this.createYearSeparatorPlugin(data.years)],
            options: {
                responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { position: 'bottom', labels: { color: colors.text } },
                    tooltip: { usePointStyle: true, callbacks: { label: c => ` ${c.dataset.label}: ${Utils.formatCurrency(c.parsed.y)}`, labelColor: c => ({ borderColor: c.dataset.borderColor, backgroundColor: c.dataset.backgroundColor === 'transparent' ? c.dataset.borderColor : c.dataset.backgroundColor, borderWidth: 2, borderRadius: 2 }) } }
                },
                scales: {
                    y: { grid: { color: c => c.tick.value === 0 ? (AppState.isDark ? '#9ca3af' : '#6b7280') : colors.grid, lineWidth: c => c.tick.value === 0 ? 2 : 1 }, ticks: { color: colors.text, callback: v => (v/1000).toLocaleString('pt-BR') }, title: { display: true, text: 'Estimativa (x1000 R$)', color: colors.text } },
                    x: { grid: { display: false }, ticks: { color: colors.text, autoSkip: false } },
                    x2: { type: 'category', labels: this.generateYearLabels(data.years), offset: true, position: 'bottom', grid: { display: false }, ticks: { color: colors.text, font: { weight: 'bold' }, autoSkip: false } }
                }
            }
        });
    },

    renderCompare(labels, dataA, dataB) {
            const ctx = Utils.DOM.get('compareChart1').getContext('2d');
            if(AppState.charts.comparison) AppState.charts.comparison.destroy();
            const colors = this.getColors();

            AppState.charts.comparison = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Receita', data: [dataA.inc, dataB.inc], backgroundColor: '#10b981', borderRadius: 4, stack: '0', barPercentage: 0.4 },
                    { label: 'Gastos', data: [-dataA.exp, -dataB.exp], backgroundColor: '#f43f5e', borderRadius: 4, stack: '0', barPercentage: 0.4 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    x: { display: true, stacked: true },
                    y: { stacked: true, ticks: { color: colors.text, callback: v => (v/1000).toLocaleString() + 'k' }, grid: { color: c => c.tick.value===0 ? (AppState.isDark?'#9ca3af':'#4b5563') : colors.grid, lineWidth: c => c.tick.value===0?2:1 } }
                },
                plugins: { legend: { position: 'bottom', labels: { color: colors.text } } }
            }
            });
    },

    renderInflation(year, breakdown) {
        const ctx = Utils.DOM.get('inflationChart').getContext('2d');
        if (AppState.charts.inflation) AppState.charts.inflation.destroy();
        const colors = this.getColors();

        const tailwindMap = {
            // Slate Scale
            'bg-slate-900': '#0f172a',
            'bg-slate-700': '#334155',
            'bg-slate-600': '#475569',
            'bg-slate-500': '#64748b',

            // Blue Scale
            'bg-blue-800': '#1e40af',
            'bg-blue-700': '#1d4ed8',
            'bg-blue-600': '#2563eb',
            'bg-blue-500': '#3b82f6',

            // Emerald Scale
            'bg-emerald-700': '#047857',
            'bg-emerald-600': '#059669',
            'bg-emerald-500': '#10b981',
            'bg-emerald-400': '#34d399',

            // Amber Scale
            'bg-amber-600': '#d97706',
            'bg-amber-500': '#f59e0b',
            'bg-amber-400': '#fbbf24',
            'bg-amber-300': '#fcd34d',

            // Indigo Scale
            'bg-indigo-600': '#4f46e5',
            'bg-indigo-500': '#6366f1',
            'bg-indigo-400': '#818cf8',
            'bg-indigo-300': '#a5b4fc',

            // Gray Scale & Fallbacks
            'bg-gray-400': '#9ca3af',
            'bg-gray-300': '#d1d5db',
            'default': '#cbd5e1'
        };

        const datasets = breakdown.categories.map(cat => {
            const data = breakdown.data.map(monthData => monthData[cat] || 0);
            const tailwindClass = UI.getCategoryColor(cat);
            // Fallback melhorado
            const hexColor = tailwindMap[tailwindClass] || '#cbd5e1';

            return { label: cat, data: data, backgroundColor: hexColor, borderRadius: 2 };
        });

        AppState.charts.inflation = new Chart(ctx, {
            type: 'bar',
            data: { labels: breakdown.months, datasets: datasets },
            options: {
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    x: { stacked: true, grid: { display: false }, ticks: { color: colors.text } },
                    y: { stacked: true, grid: { color: colors.grid }, ticks: { color: colors.text, callback: v => (v/1000).toLocaleString() + 'k' } }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        itemSort: (a, b) => b.parsed.y - a.parsed.y,
                        filter: (item) => item.parsed.y > 0,
                        callbacks: {
                            label: c => ` ${c.dataset.label}: ${Utils.formatCurrency(c.parsed.y)}`,
                            footer: (items) => {
                                const total = items.reduce((a, b) => a + b.parsed.y, 0);
                                return 'Total: ' + Utils.formatCurrency(total);
                            }
                        }
                    }
                }
            }
        });
    }
};
window.ChartManager = ChartManager;
