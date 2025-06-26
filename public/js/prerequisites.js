const API = {
	select: `${API_BASE}/api/med_info/select/`
};

let allMedsData = [];
let currentFilters = {};

async function fetchMeds(filters = {}) {
	const res = await fetch(API.select, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(filters),
	});
	return res.json();
}

function renderPrerequisitesTable(meds) {
	const tbody = document.getElementById("table-body-meds");
	tbody.innerHTML = "";

	meds.forEach((med, index) => { 
		const tr = document.createElement("tr");

		const rowClass = index % 2 === 0 ? 'bg-white text-black' : 'bg-gray-700 text-white';
		tr.className = rowClass;

		tr.innerHTML = `
			<td class="px-4 md:px-2 py-2 text-center">
				${med.medication_name}
			</td>
			<td class="px-4 md:px-2 py-2 text-center">
				${med.prerequisites ? med.prerequisites.split(/;|\. /).join("</br>") : ""}
			</td>
			<td class="px-4 md:px-2 py-2">
				${med.icd_code}
			</td>
			<td class="px-4 md:px-2 py-2">
				${med.med_type}
			</td>
		`;

		tbody.appendChild(tr);
	})
}

function populateFilterDropdowns(meds) {
	const icdSet = new Set();
	const typeSet = new Set();

	meds.forEach(med => {
		if (med.icd_code) {
			med.icd_code.split('/').forEach(code => icdSet.add(code.trim()));
		}
		if (med.med_type) {
			typeSet.add(med.med_type.trim());
		}
	});

	const icdSelect = document.getElementById("filter-icd");
	icdSelect.innerHTML = `<option value="">All ICD Codes</option>`;
	[...icdSet].sort().forEach(code => {
		icdSelect.innerHTML += `<option value="${code}">${code}</option>`;
	});

	const typeSelect = document.getElementById("filter-type");
	typeSelect.innerHTML = `<option value="">All Types</option>`;
	[...typeSet].sort().forEach(type => {
		typeSelect.innerHTML += `<option value="${type}">${type}</option>`;
	});
}

// Apply filters on the cached data
function filterMedsLocally(filters) {
	return allMedsData.filter(med => {
		const nameMatch = !filters.medication_name || med.medication_name?.toLowerCase().includes(filters.medication_name.toLowerCase());
		const icdMatch = !filters.icd_code || med.icd_code?.split('/').map(s => s.trim()).includes(filters.icd_code);
		const typeMatch = !filters.med_type || med.med_type === filters.med_type;

		return nameMatch && icdMatch && typeMatch;
	});
}

function applyFilters() {
	const filtered = filterMedsLocally(currentFilters);
	renderPrerequisitesTable(filtered);
}

async function initialize() {
	// Fetch all data once
	allMedsData = await fetchMeds();

	// Populate dropdowns
	populateFilterDropdowns(allMedsData);

	// Initial render
	renderPrerequisitesTable(allMedsData);
}

// Event listeners
document.getElementById("filter-drug").addEventListener("input", (e) => {
	currentFilters.medication_name = e.target.value || undefined;
	applyFilters();
});

document.getElementById("filter-icd").addEventListener("change", (e) => {
	currentFilters.icd_code = e.target.value || undefined;
	applyFilters();
});

document.getElementById("filter-type").addEventListener("change", (e) => {
	currentFilters.med_type = e.target.value || undefined;
	applyFilters();
});

document.getElementById("btn-clear-filter").addEventListener("click", () => {
	document.getElementById("filter-drug").value = "";
	document.getElementById("filter-icd").value = "";
	document.getElementById("filter-type").value = "";
	currentFilters = {};
	applyFilters();
});

// Initial load
initialize();