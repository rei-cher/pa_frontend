const API = {
    select: `${API_BASE}/api/select/`,
    update: `${API_BASE}/api/update/`,
    delete: `${API_BASE}/api/delete/`,
    csv: `${API_BASE}/api/csv/`,
};

let currentFilters = {};

async function fetchPAs(filters = {}) {
    const res = await fetch(API.select, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
    });
    return res.json();
}

function renderStats(pas) {
    const counts = pas.reduce((acc, p) => (acc[p.pa_status] = (acc[p.pa_status] || 0) + 1, acc), {});
    const html = Object.entries(counts)
        .map(([s, c]) => `<span class="me-3">${s}: <strong>${c}</strong></span>`)
        .join('');
    document.getElementById('stats').innerHTML = `<h5>Stats:</h5>${html}`;
}

function renderTable(pas) {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';
    pas.forEach(pa => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${pa.pa_id}</td>
      <td>${pa.patient_first_name} ${pa.patient_last_name}</td>
      <td>${pa.patient_dob}</td>
      <td>${pa.drug_name}</td>
      <td>
        <select class="form-select form-select-sm status-select" data-id="${pa.pa_id}">
          ${['Pending', 'Approved', 'Denied', 'Other']
                .map(s => `<option${s === pa.pa_status ? ' selected' : ''}>${s}</option>`)
                .join('')}
        </select>
      </td>
      <td>
        <button class="btn btn-sm btn-danger delete-btn" data-id="${pa.pa_id}">
          Delete
        </button>
      </td>
    `;
        tbody.appendChild(tr);
    });

    document.querySelectorAll('.status-select').forEach(sel => {
        sel.addEventListener('change', async e => {
            await fetch(API.update, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pa_id: e.target.dataset.id, status: e.target.value })
            });
            loadAndRender();
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async e => {
            await fetch(API.delete, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pa_id: e.target.dataset.id })
            });
            loadAndRender();
        });
    });
}

async function loadAndRender() {
    const pas = await fetchPAs(currentFilters);
    renderStats(pas);
    renderTable(pas);
}

document.getElementById('btn-apply').addEventListener('click', () => {
    currentFilters = {
        status: document.getElementById('filter-status').value || undefined,
        drug: document.getElementById('filter-drug').value || undefined,
    };
    loadAndRender();
});

document.getElementById('btn-csv').addEventListener('click', () => {
    fetch(API.csv, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentFilters)
    })
        .then(r => r.blob())
        .then(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'filtered_pas.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        });
});

loadAndRender();
