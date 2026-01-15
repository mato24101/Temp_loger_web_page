let myChart = null;
const ctx = document.getElementById('measurementsChart').getContext('2d');

const deviceSelect = document.getElementById('deviceFilter');
const metricSelect = document.getElementById('metricFilter');
const dateFromInput = document.getElementById('dateFrom');
const dateToInput = document.getElementById('dateTo');
const refreshBtn = document.getElementById('refreshBtn');
const noDataMsg = document.getElementById('noDataMessage');

// Predvolené časy
const now = new Date();
const yesterday = new Date();
yesterday.setHours(yesterday.getHours() - 24);
dateFromInput.value = yesterday.toISOString().slice(0, 16);
dateToInput.value = now.toISOString().slice(0, 16);

async function init() {
    // Načítame dáta (funkcia vráti aj zoznamy pre filtre v jednom balíku alebo ich načítame separátne)
    await fetchDataAndRender();
    refreshBtn.addEventListener('click', fetchDataAndRender);
}

async function fetchDataAndRender() {
    const params = new URLSearchParams({
        device: deviceSelect.value,
        metric: metricSelect.value,
        from: new Date(dateFromInput.value).toISOString(),
        to: new Date(dateToInput.value).toISOString()
    });

    try {
        // Volanie Netlify funkcie - cesta smeruje na endpoint definovaný v netlify/functions/read.js
        const response = await fetch(`/.netlify/functions/read?${params}`);
        const result = await response.json();

        if (result.error) throw new Error(result.error);

        // Aktualizácia filtrov, ak prišli nové zariadenia/metriky
        updateFiltersUI(result.devices, result.metrics);
        
        // Ak ešte nie je vybraná žiadna metrika, vyberieme prvú dostupnú zo servera
        const currentMetric = metricSelect.value || result.metrics[0];
        renderChart(result.data, currentMetric);
    } catch (err) {
        console.error('Chyba pri volaní funkcie:', err);
    }
}

function updateFiltersUI(devices, metrics) {
    // Aktualizácia zariadení
    if (devices) {
        const existingDevices = Array.from(deviceSelect.options).map(opt => opt.value);
        devices.forEach(dev => {
            if (!existingDevices.includes(dev)) {
                const opt = new Option(dev, dev);
                deviceSelect.add(opt);
            }
        });
    }

    // Aktualizácia metrík (názvov meraní z JSONB)
    if (metrics) {
        const existingMetrics = Array.from(metricSelect.options).map(opt => opt.value);
        metrics.forEach(m => {
            if (!existingMetrics.includes(m)) {
                const opt = new Option(m, m);
                metricSelect.add(opt);
            }
        });
    }
}

function renderChart(data, metric) {
    if (!data || data.length === 0 || !metric) {
        if (myChart) myChart.destroy();
        noDataMsg.classList.remove('hidden');
        document.getElementById('measurementsChart').classList.add('hidden');
        return;
    }

    noDataMsg.classList.add('hidden');
    document.getElementById('measurementsChart').classList.remove('hidden');

    // Filtrujeme a mapujeme body pre konkrétnu metriku
    const chartPoints = data
        .filter(row => row.data && row.data[metric] !== undefined)
        .map(row => ({
            x: row.casova_znacka,
            y: row.data[metric]
        }));

    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: metric,
                data: chartPoints,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.2,
                pointRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { 
                    type: 'time', 
                    time: { 
                        unit: 'hour',
                        displayFormats: { hour: 'HH:mm' }
                    } 
                },
                y: { title: { display: true, text: 'Hodnota' } }
            }
        }
    });
}

window.onload = init;