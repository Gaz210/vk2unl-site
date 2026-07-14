(function () {
  const table = document.getElementById("qso-table");
  if (!table) return;

  const tbody = table.querySelector("tbody");
  const rows = Array.from(tbody.querySelectorAll("tr"));
  const bandSelect = document.getElementById("filter-band");
  const modeSelect = document.getElementById("filter-mode");
  const callsignInput = document.getElementById("filter-callsign");

  // Populate band/mode filter options from the actual data.
  const bands = [...new Set(rows.map((r) => r.dataset.band))].sort();
  const modes = [...new Set(rows.map((r) => r.dataset.mode))].sort();
  bands.forEach((b) => bandSelect.insertAdjacentHTML("beforeend", `<option value="${b}">${b}</option>`));
  modes.forEach((m) => modeSelect.insertAdjacentHTML("beforeend", `<option value="${m}">${m}</option>`));

  function applyFilters() {
    const callsignQuery = callsignInput.value.trim().toUpperCase();
    const band = bandSelect.value;
    const mode = modeSelect.value;

    rows.forEach((row) => {
      const matchesCallsign = !callsignQuery || row.dataset.callsign.toUpperCase().includes(callsignQuery);
      const matchesBand = !band || row.dataset.band === band;
      const matchesMode = !mode || row.dataset.mode === mode;
      row.style.display = matchesCallsign && matchesBand && matchesMode ? "" : "none";
    });
  }

  callsignInput.addEventListener("input", applyFilters);
  bandSelect.addEventListener("change", applyFilters);
  modeSelect.addEventListener("change", applyFilters);

  // Click-to-sort on column headers.
  let sortState = { key: null, asc: true };
  table.querySelectorAll("th[data-key]").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.dataset.key;
      const colIndex = Array.from(th.parentElement.children).indexOf(th);
      sortState.asc = sortState.key === key ? !sortState.asc : true;
      sortState.key = key;

      const sorted = rows.slice().sort((a, b) => {
        const av = a.children[colIndex].textContent.trim();
        const bv = b.children[colIndex].textContent.trim();
        return sortState.asc ? av.localeCompare(bv) : bv.localeCompare(av);
      });
      sorted.forEach((row) => tbody.appendChild(row));
    });
  });
})();
