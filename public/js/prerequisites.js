const API = {
	select: `${API_BASE}/api/select/`,
	update: `${API_BASE}/api/update/`,
	delete: `${API_BASE}/api/delete/`,
	csv: `${API_BASE}/api/csv/`,
};

let currentFilters = {status: "approved", insurance: "Horizon"};

async function fetchPAs(filters = {}) {
	const res = await fetch(API.select, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(filters),
	});
	return res.json();
}

async function loadAndRender() {
    const approvedPA = await Promise.all([
        fetchPAs(currentFilters)
    ])
    console.log("Number of filtered result: ", JSON.stringify(approvedPA).length);
    renderResult(approvedPA);
}

function renderResult(PAs) {
    document.getElementById("result-approved-horizon").innerHTML = PAs.map(pa => JSON.stringify(pa)).join('<br>');
}

document.getElementById("filter-drug").addEventListener("keydown", () => {
	currentFilters.drug =
		document.getElementById("filter-drug").value || undefined;
	loadAndRender();
});

// Initial load
loadAndRender();

// Fetch PAs every 30 seconds
setInterval(loadAndRender, 30 * 1000);