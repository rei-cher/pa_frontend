async function populateDropdowns() {
    const res = await fetch(`${API_BASE}/api/select/`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: '{}'
    });
    const all = await res.json();
    const uniq = (arr, k) => [...new Set(arr.map(x => x[k]))].filter(v => v);
    const fill = (id, items) => {
        const sel = document.getElementById(id);
        items.forEach(v => {
            const o = document.createElement('option');
            o.value = o.text = v;
            sel.appendChild(o);
        });
    };
    fill('filter-drug', uniq(all, 'drug_name'));
    fill('filter-doctor', uniq(all, 'doctor_npi'));
    fill('filter-insurance', uniq(all, 'insurance'));
}

function buildFilters() {
    const f = {};
    const s = document.getElementById('filter-start').value;
    const e = document.getElementById('filter-end').value;
    if (s) f.date_submitted = s;
    if (e) f.date_submitted = e;
    ['drug', 'doctor', 'insurance'].forEach(k => {
        const v = document.getElementById(`filter-${k}`).value;
        if (v) f[k] = v;
    });
    return f;
}

let chart = null;
async function drawChart() {
    const res = await fetch(`${API_BASE}/api/stats/`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildFilters())
    });
    const data = await res.json();
    const labels = Object.keys(data.by_status);
    const pct = labels.map(l => data.by_status[l].pct);
    const ctx = document.getElementById('statusChart').getContext('2d');
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'pie',
        data: { labels, datasets: [{ data: pct }] },
        options: {
            plugins: {
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.label}: ${ctx.parsed}%`
                    }
                }
            }
        }
    });
}

document.getElementById('btn-refresh').addEventListener('click', drawChart);
window.addEventListener('DOMContentLoaded', async () => {
    await populateDropdowns();
    drawChart();
});
