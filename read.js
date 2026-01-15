let myChart = null;
const ctx = document.getElementById('measurementsChart').getContext('2d');

// Elementy filtrov
const deviceSelect = document.getElementById('deviceFilter');
const metricSelect = document.getElementById('metricFilter');
const dateFromInput = document.getElementById('dateFrom');
const dateToInput = document.getElementById('dateTo');
const refreshBtn = document.getElementById('refreshBtn');
const noDataMsg = document.getElementById('noDataMessage');
const statusInfo = document.getElementById('statusInfo');

// UI Elementy pre Sidebar
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');
const overlay = document.getElementById('sidebarOverlay');

// Predvolené časy (posledných 24h)
const now = new Date();
const yesterday = new Date();
yesterday.setHours(yesterday.getHours() - 24);
dateFromInput.value = yesterday.toISOString().slice(0, 16);
dateToInput.value = now.toISOString().slice(0, 16);

async function init() {
    setupSidebar();
    await fetchDataAndRender();
    
    refreshBtn.addEventListener('click', fetchDataAndRender);
    deviceSelect.addEventListener('change', fetchDataAndRender);
    metricSelect.addEventListener('change', fetchDataAndRender);
}

/**
 * Logika pre mobilné ovládanie sidebar-u
 */
function setupSidebar() {
    const toggle = () => {
        sidebar.classList.toggle('-translate-x-full');
        overlay.classList.toggle('hidden');
    };

    menuToggle.addEventListener('click', toggle);
    overlay.addEventListener('click', toggle);
}

async function fetchDataAndRender() {
    refreshBtn.disabled = true;
    const originalBtnText = refreshBtn.innerHTML;
    refreshBtn.textContent = 'Načítavam...';
    statusInfo.textContent = 'Komunikujem so serverom...';

    const params = new URLSearchParams({
        device: deviceSelect.value,
        metric: metricSelect.value,
        from: new Date(dateFromInput.value).toISOString(),
        to: new Date(dateToInput.value).toISOString()
    });

    try {
        const response = await fetch(`/.netlify/functions/read?${params}`);
        const result = await response.json();

        if (result.error) throw new Error(result.error);

        updateFiltersUI(result.devices, result.metrics);
        
        const currentMetric = metricSelect.value || result.metrics[0];
        renderChart(result.data, currentMetric);
        
        statusInfo.textContent = `OK - ${result.data ? result.data.length : 0} bodov`;
    } catch (err) {
        console.error('Chyba:', err);
        statusInfo.textContent = 'Chyba pripojenia';
    } finally {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = originalBtnText;
    }
}

function updateFiltersUI(devices, metrics) {
    if (devices) {
        const existingDevices = Array.from(deviceSelect.options).map(opt => opt.value);
        devices.forEach(dev => {
            if (!existingDevices.includes(dev)) {
                deviceSelect.add(new Option(dev, dev));
            }
        });
    }

    if (metrics) {
        const existingMetrics = Array.from(metricSelect.options).map(opt => opt.value);
        metrics.forEach(m => {
            if (!existingMetrics.includes(m)) {
                metricSelect.add(new Option(m, m));
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
                backgroundColor: 'rgba(37, 99, 235, 0.05)',
                borderWidth: 2,
                fill: true,
                tension: 0.1,
                pointRadius: chartPoints.length > 300 ? 0 : 3,
                borderJoinStyle: 'round'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
                x: { 
                    type: 'time', 
                    time: { 
                        displayFormats: { 
                            hour: 'HH:mm',
                            day: 'dd.LL.'
                        }
                    },
                    grid: { display: false }
                },
                y: { 
                    title: { display: true, text: 'Hodnota' },
                    grid: { color: '#f3f4f6' }
                }
            },
            plugins: {
                legend: { display: true, position: 'top', align: 'end' },
                tooltip: { intersect: false, mode: 'index' }
            }
        }
    });
}

window.onload = init;