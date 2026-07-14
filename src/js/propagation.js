// Live band conditions from HamQSL's free solar-terrestrial XML feed.
// Note: hamqsl.com doesn't send CORS headers, so a direct fetch from a
// GitHub Pages site will likely be blocked by the browser. We try direct
// first, then fall back to a public CORS proxy. If both fail, we degrade
// gracefully and point to the source page directly.
(function () {
  const DIRECT_URL = "https://www.hamqsl.com/solarxml.php";
  const PROXY_URL = "https://corsproxy.io/?url=" + encodeURIComponent(DIRECT_URL);

  const el = (id) => document.getElementById(id);
  const updatedEl = el("prop-updated");

  function setStat(id, value) {
    const target = el(id);
    if (target) target.textContent = value ?? "–";
  }

  function renderBands(xmlDoc) {
    const tbody = document.querySelector("#band-table tbody");
    const bandNodes = Array.from(xmlDoc.querySelectorAll("calculatedconditions band"));
    const byName = {};

    bandNodes.forEach((node) => {
      const name = node.getAttribute("name");
      const time = node.getAttribute("time");
      byName[name] = byName[name] || {};
      byName[name][time] = node.textContent.trim();
    });

    tbody.innerHTML = "";
    Object.keys(byName).forEach((name) => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${name}</td><td>${byName[name].day || "–"}</td><td>${byName[name].night || "–"}</td>`;
      tbody.appendChild(row);
    });

    if (!bandNodes.length) {
      tbody.innerHTML = `<tr><td colspan="3">Band data unavailable right now.</td></tr>`;
    }
  }

  function render(xmlText) {
    const xmlDoc = new DOMParser().parseFromString(xmlText, "text/xml");
    const get = (tag) => xmlDoc.querySelector(tag)?.textContent?.trim();

    setStat("stat-sfi", get("solarflux"));
    setStat("stat-a", get("aindex"));
    setStat("stat-k", get("kindex"));
    setStat("stat-sunspots", get("sunspots"));
    renderBands(xmlDoc);

    const updated = get("updated");
    updatedEl.textContent = updated
      ? `Source data updated ${updated} (HamQSL, refreshed hourly). Fetched live in your browser — no server involved.`
      : "Fetched live in your browser via HamQSL.";
  }

  function fail() {
    updatedEl.innerHTML =
      'Couldn\'t load live data (likely a CORS restriction on GitHub Pages). Check conditions directly at ' +
      '<a href="https://www.hamqsl.com/solar.html" target="_blank" rel="noopener">hamqsl.com</a>.';
  }

  fetch(DIRECT_URL)
    .then((r) => {
      if (!r.ok) throw new Error("direct fetch failed");
      return r.text();
    })
    .then(render)
    .catch(() => {
      fetch(PROXY_URL)
        .then((r) => {
          if (!r.ok) throw new Error("proxy fetch failed");
          return r.text();
        })
        .then(render)
        .catch(fail);
    });
})();
