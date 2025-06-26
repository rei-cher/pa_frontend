const API = {
	select: `${API_BASE}/api/pa_info/select/`,
	update: `${API_BASE}/api/pa_info/update/`,
	delete: `${API_BASE}/api/pa_info/delete/`,
	csv: `${API_BASE}/api/pa_info/csv/`,
};

let currentFilters = {};

function formatDate(isoDate) {
	const d = new Date(isoDate);
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	const yyyy = d.getFullYear();
	return `${mm}/${dd}/${yyyy}`;
}

function isValidDate(val) {
	const d = new Date(val);
	return val && !isNaN(d);
}

function toISO(val) {
	return new Date(val).toISOString().slice(0, 10);
}

async function fetchPAs(filters = {}) {
	const res = await fetch(API.select, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(filters),
	});
	return res.json();
}

function renderStats(pas) {
	const counts = pas.reduce(
		(acc, p) => ((acc[p.pa_status] = (acc[p.pa_status] || 0) + 1), acc),
		{}
	);

	const html = Object.entries(counts).map(([status, count]) => {
		let colorClass;
		switch (status.toLowerCase()) {
			case "approved":
				colorClass = "text-green-400";
				break;
			case "denied":
				colorClass = "text-red-400";
				break;
			default:
				colorClass = "text-white";
		}
		return `
			<span class="mr-6 font-medium ${colorClass}">
				${status}: <span class="font-bold">${count}</span>
			</span>
		`;
	}).join("");

	document.getElementById("status-counts").innerHTML = html;
}


function renderTodayCount(allPAs) {
	const today = new Date().toISOString().slice(0, 10);
	const todayCount = allPAs.filter(pa => pa.submitted_at.slice(0, 10) === today).length;

	document.getElementById("today-count-text").textContent = "Submitted Today: "
	document.getElementById("today-count-number").textContent = todayCount;
}

function renderAllPACount(allPAs){
	document.getElementById("total-count").textContent = `Overall submitted: ${allPAs.length}`;
}


function renderTable(pas) {
	const tbody = document.getElementById("table-body");
	tbody.innerHTML = "";

	pas.forEach((pa) => {
		const tr = document.createElement("tr");

		// Color rows based on status
		if (pa.pa_status.toLowerCase() === "denied") {
			tr.classList.add("bg-red-500");
		} else if (pa.pa_status.toLowerCase() === "approved") {
			tr.classList.add("bg-green-500");
		}

		tr.innerHTML = `
      <td class="px-4 md:px-2 py-2">
	  	<a href="https://dashboard.covermymeds.com/v2/requests/${pa.pa_id
			}" target="_blank">
        	${pa.pa_id}
		</a>
      </td>
      <td class="px-4 md:px-2 py-2">
	  	${pa.patient_first_name} ${pa.patient_last_name}
	  </td>
      <td class="px-4 md:px-2 py-2">${formatDate(pa.patient_dob)}</td>
      <td class="px-4 md:px-2 py-2">${pa.drug_name}</td>
      <td class="px-4 md:px-2 py-2">${formatDate(pa.submitted_at)}</td>
      <td class="px-4 md:px-2 py-2">
	  	<a href="https://khasak.ema.md/ema/web/practice/staff#/practice/staff/patient/${pa.ema_id
			}/chart/overview" target="_blank">
	  		${pa.ema_id}
		</a>
	  </td>
	  <td class="px-4 md:px-2 py-2">${pa.insurance}</td>
      <td class="px-4 md:px-2 py-2">
        <select class="status-select border px-2 py-1 rounded" data-id="${pa.pa_id
			}">
          ${["Pending", "Approved", "Denied", "Other"]
				.map(
					(s) => `
              <option${s === pa.pa_status ? " selected" : ""}>
                ${s}
              </option>
            `
				)
				.join("")}
        </select>
      </td>
	  <td class="flex flex-col px-4 md:px-2 py-2 space-y-2">
		<button
			class="info-btn bg-yellow-500 text-white px-2 py-1 rounded"
			data-id="${pa.pa_id}"
			data-extra="${pa.extra_info || ""}">
			Info
		</button>
		<button
			class="delete-btn bg-red-800 text-white px-2 py-1 rounded"
			data-id="${pa.pa_id}">
			Delete
		</button>
	  </td>
    `;
		// Add textarea for denied PAs
		if (pa.pa_status.toLowerCase() === "denied") {
			const extraInfoTd = document.createElement("td");
			extraInfoTd.className = "px-4 md:px-2 py-2 bg-red-500";
			extraInfoTd.colSpan = 9; // Span across all columns
			extraInfoTd.innerHTML = `
					<textarea
						class="extra-info-select border px-2 py-1 rounded w-full"
						data-id="${pa.pa_id}"
						placeholder="Additional comments for denied PA"
					>${pa.extra_info || ""}</textarea>
				`;
			const extraInfoTr = document.createElement("tr");
			extraInfoTr.appendChild(extraInfoTd);
			tbody.appendChild(tr);
			tbody.appendChild(extraInfoTr);
		} else {
			tbody.appendChild(tr);
		}
	});

	// Attach event listeners
	document.querySelectorAll(".status-select").forEach((sel) => {
		sel.addEventListener("change", async (e) => {
			await fetch(API.update, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					pa_id: e.target.dataset.id,
					status: e.target.value,
				}),
			});
			loadAndRender();
		});
	});

	// Attach event listeners for textarea updates
	document.querySelectorAll(".extra-info-select").forEach((textarea) => {
		textarea.addEventListener("change", async (e) => {
			const pa_id = e.target.dataset.id;
			const extra_info = e.target.value;
			await fetch(API.update, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ pa_id, extra_info }),
			});
			loadAndRender();
		});
	});

	document.querySelectorAll(".delete-btn").forEach((btn) => {
		btn.addEventListener("click", async (e) => {
			await fetch(API.delete, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ pa_id: e.target.dataset.id }),
			});
			loadAndRender();
		});
	});
}

async function loadAndRender() {
	const [filteredPAs, allPAs] = await Promise.all([
		fetchPAs(currentFilters),
		fetchPAs() // unfiltered
	]);

	renderAllPACount(allPAs);
	renderStats(allPAs);
	renderTable(filteredPAs);
	renderTodayCount(allPAs);
}

function applyFilters() {
	const searchVal = document.getElementById("filter-search").value.trim();
	console.log(document.getElementById("filter-search"));
	const filters = {};

	if (searchVal) {
		if (isValidDate(searchVal)) {
			filters.patient_dob = toISO(searchVal);
		} else {
			filters.name_search = searchVal;
		}
	}

	filters.status = document.getElementById("filter-status").value || undefined;
	filters.drug = document.getElementById("filter-drug").value || undefined;

	currentFilters = filters;
	loadAndRender();
}

// wire up the “Apply” button
document.getElementById("btn-apply").addEventListener("click", applyFilters);

// Button-driven filters
document.getElementById("btn-apply").addEventListener("click", applyFilters);

document.getElementById("filter-search").addEventListener("input", () => {
	const val = document.getElementById("filter-search").value.trim();
	if (isValidDate(val)) {
		currentFilters.patient_dob = toISO(val);
		delete currentFilters.name_search;
	} else if (/^B[A-Z0-9]{7}$/.test(val)) {
		currentFilters.pa_id = val || undefined;
	} else {
		currentFilters.name_search = val || undefined;
		delete currentFilters.patient_dob;
	}
	loadAndRender();
});

document.getElementById("filter-drug").addEventListener("input", () => {
	currentFilters.drug =
		document.getElementById("filter-drug").value || undefined;
	loadAndRender();
});

document.getElementById("filter-status").addEventListener("input", () => {
	currentFilters.status =
		document.getElementById("filter-status").value || undefined;
	loadAndRender();
});

// clear filters
document.getElementById("btn-clear-filter").addEventListener("click", () => {
	document.getElementById("filter-search").value = "";
	document.getElementById("filter-drug").value = "";
	document.getElementById("filter-status").value = "";
	currentFilters = {};
	loadAndRender();
});

// CSV download
document.getElementById("btn-csv").addEventListener("click", () => {
	// calculate today 
	const today = new Date();
	today.setDate(today.getDate());
	const submittedAt = today.toISOString().split("T")[0]; // "YYYY-MM-DD"

	fetch(API.csv, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(currentFilters),
	})
		.then((response) => {
			const disposition = response.headers.get("Content-Disposition");
			let filename = `filtered_pas_${JSON.stringify(currentFilters)}_${submittedAt}.csv`; // default fallback

			if (disposition && disposition.includes("filename=")) {
				const match = disposition.match(/filename="?([^"]+)"?/);
				if (match && match[1]) {
					filename = match[1];
				}
			}

			return response.blob().then((blob) => ({ blob, filename }));
		})
		.then(({ blob, filename }) => {
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
		})
		.catch((error) => {
			console.error("CSV download failed:", error);
		});
});

// download scv of pendings
document.getElementById("btn-csv-pending").addEventListener("click", () => {
	// Calculate the date 3 days ago in ISO format (e.g., "2025-06-22")
	const threeDaysAgo = new Date();
	threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
	const submittedAt = threeDaysAgo.toISOString().split("T")[0]; // "YYYY-MM-DD"

	fetch(API.csv, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(
			{
				status: "Pending",
				submitted_at_lth: submittedAt
			}
		),
	})
		.then((response) => {
			const disposition = response.headers.get("Content-Disposition");
			let filename = `pendings_up_to_${submittedAt}.csv`; // default fallback

			if (disposition && disposition.includes("filename=")) {
				const match = disposition.match(/filename="?([^"]+)"?/);
				if (match && match[1]) {
					filename = match[1];
				}
			}

			return response.blob().then((blob) => ({ blob, filename }));
		})
		.then(({ blob, filename }) => {
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
		})
		.catch((error) => {
			console.error("CSV download failed:", error);
		});
});

// helper to show/hide modal
const modal = document.getElementById("info-modal");
function showModal(pa_id, extra) {
	document.getElementById("modal-pa-id").textContent = pa_id;
	document.getElementById("modal-extra-info").value = extra;
	modal.classList.remove("hidden");
}
function hideModal() {
	modal.classList.add("hidden");
}

// “Info” buttons: open modal
document.body.addEventListener("click", (e) => {
	if (e.target.matches(".info-btn")) {
		const btn = e.target;
		const pa_id = btn.dataset.id;
		const extra = btn.dataset.extra;
		showModal(pa_id, extra);
	}
});

// Cancel button
document.getElementById("modal-cancel").addEventListener("click", hideModal);

// Save button: call update endpoint with extra_info
document.getElementById("modal-save").addEventListener("click", async () => {
	const pa_id = document.getElementById("modal-pa-id").textContent;
	const extra = document.getElementById("modal-extra-info").value;
	await fetch(API.update, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ pa_id, extra_info: extra }),
	});
	hideModal();
	loadAndRender();
});

// Initial load
loadAndRender();

// Fetch PAs every 60 seconds
setInterval(loadAndRender, 60 * 1000);
