const API = {
	select: `${API_BASE}/api/med_info/select/`,
	update: `${API_BASE}/api/med_info/update/`,
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

			<td class="px-4 md:px-2 py-2 text-center" data-field="prerequisites">
				<div class="flex justify-between text-left w-full">
					<div class="w-full text-center" data-content>
						${formatPrerequisites(med.prerequisites)}
					</div>
					<div class="ml-2 flex items-center">
						<button class="edit-icon ml-2" data-field="prerequisites" data-index="${index}">✏️</button>
					</div>
				</div>
			</td>

			<td class="px-4 md:px-2 py-2 text-center" data-field="icd_code">
				<div class="flex justify-between text-left w-full">
					<div class="w-full text-center" data-content>
						${med.icd_code ? med.icd_code.split('/').join("<br>") : ""}
					</div>
					<div class="ml-2 flex items-center">
						<button class="edit-icon ml-2" data-field="icd_code" data-index="${index}">✏️</button>
					</div>
				</div>
			</td>

			<td class="px-4 md:px-2 py-2 text-center" data-field="med_type">
				<div class="flex justify-between text-left w-full">
					<div class="w-full text-center" data-content>
						${med.med_type}
					</div>
					<div class="ml-2 flex items-center">
						<button class="edit-icon ml-2" data-field="med_type" data-index="${index}">✏️</button>
					</div>
				</div>
			</td>
		`;

		tbody.appendChild(tr);
	});

	const buttons = document.querySelectorAll('.edit-icon');
	buttons.forEach(button => {
		button.addEventListener('click', (e) => {
			const field = e.target.dataset.field;
			const index = parseInt(e.target.dataset.index);
			const med = meds[index];

			const td = e.target.closest('td');
			const contentDiv = td.querySelector('[data-content]');
			const originalValue = med[field] || "";

			// Clear content
			contentDiv.innerHTML = "";

			// Create input field
			let inputEl;
			if (field === "med_type") {
				inputEl = document.createElement("select");
				inputEl.className = "w-full px-2 py-1 rounded border text-black";
				["Biologic", "Non-biologic"].forEach(opt => {
					const optEl = document.createElement("option");
					optEl.value = opt;
					optEl.textContent = opt;
					if (opt === originalValue) optEl.selected = true;
					inputEl.appendChild(optEl);
				});
			} else {
				inputEl = document.createElement("textarea");
				inputEl.className = "w-full h-24 px-2 py-1 rounded border text-black";
				inputEl.value = originalValue;
			}
			contentDiv.appendChild(inputEl);

			// Add action buttons
			const actions = document.createElement("div");
			actions.className = "flex justify-end space-x-2 mt-2";

			const saveBtn = document.createElement("button");
			saveBtn.textContent = "Save";
			saveBtn.className = "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700";

			const cancelBtn = document.createElement("button");
			cancelBtn.textContent = "Cancel";
			cancelBtn.className = "px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500";

			actions.appendChild(cancelBtn);
			actions.appendChild(saveBtn);
			contentDiv.appendChild(actions);

			cancelBtn.addEventListener("click", () => {
				renderPrerequisitesTable(meds);
			});

			saveBtn.addEventListener("click", async () => {
				const newValue = inputEl.value.trim();
				if (newValue === originalValue) {
					renderPrerequisitesTable(meds);
					return;
				}

				try {
					const response = await fetch(API.update, {
						method: 'PUT',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							medication_name: med.medication_name,
							[field]: newValue
						})
					});

					if (response.ok) {
						alert(`${field} updated successfully.`);
						meds[index][field] = newValue;
						renderPrerequisitesTable(meds);
					} else {
						alert(`Failed to update ${field}.`);
					}
				} catch (err) {
					console.error("Error updating field:", err);
					alert("An error occurred while updating.");
				}
			});
		});
	});
}

function formatPrerequisites(text) {
	if (!text) return "";
	return text.split(/;|\. /).join("<br>").split('---').join("<br><br>");
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