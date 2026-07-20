// ============================================================
// charts.js – الرسوم البيانية والإحصائيات
// ============================================================

let positionChartInstance = null;
let categoryChartInstance = null;

export function initCharts() {
    // سيتم تهيئتها عند أول تحديث للبيانات
}

export function updateCharts(data) {
    // توزيع اللاعبين حسب المركز
    const positions = {};
    data.players.forEach(p => {
        const pos = p.position || 'غير محدد';
        positions[pos] = (positions[pos] || 0) + 1;
    });
    const posLabels = Object.keys(positions);
    const posData = Object.values(positions);
    const ctx1 = document.getElementById('positionChart');
    if (ctx1) {
        const context = ctx1.getContext('2d');
        if (positionChartInstance) positionChartInstance.destroy();
        positionChartInstance = new Chart(context, {
            type: 'doughnut',
            data: {
                labels: posLabels.length ? posLabels : ['لا يوجد لاعبين'],
                datasets: [{
                    data: posLabels.length ? posData : [1],
                    backgroundColor: ['#6C63FF', '#FF6B6B', '#FFD93D', '#2ecc71', '#a29bfe'],
                    borderColor: 'var(--dark)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { labels: { color: 'var(--light)' } }
                }
            }
        });
    }

    // توزيع الأسئلة حسب الفئة
    const categories = {};
    data.questions.forEach(q => {
        const cat = q.category || 'عام';
        categories[cat] = (categories[cat] || 0) + 1;
    });
    const catLabels = Object.keys(categories);
    const catData = Object.values(categories);
    const ctx2 = document.getElementById('categoryChart');
    if (ctx2) {
        const context = ctx2.getContext('2d');
        if (categoryChartInstance) categoryChartInstance.destroy();
        categoryChartInstance = new Chart(context, {
            type: 'bar',
            data: {
                labels: catLabels.length ? catLabels : ['لا يوجد أسئلة'],
                datasets: [{
                    label: 'عدد الأسئلة',
                    data: catLabels.length ? catData : [0],
                    backgroundColor: '#6C63FF',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { color: 'var(--gray)' } },
                    x: { ticks: { color: 'var(--gray)' } }
                }
            }
        });
    }
}