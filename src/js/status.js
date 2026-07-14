// Polls SITE_STATUS_URL for {"online": true/false, "detail": "..."}.
// Point this at a raw GitHub Gist URL (or any CORS-friendly JSON endpoint)
// updated by a small cron script on your TrueNAS box. See README.md.
(function () {
  const el = document.getElementById("online-status");
  const textEl = document.getElementById("online-status-text");
  const url = window.SITE_STATUS_URL;

  if (!url) {
    textEl.textContent = "status not configured";
    return;
  }

  fetch(url, { cache: "no-store" })
    .then((r) => r.json())
    .then((data) => {
      if (data.online) {
        el.dataset.state = "online";
        textEl.textContent = data.detail || "on the air";
      } else {
        el.dataset.state = "offline";
        textEl.textContent = data.detail || "off the air";
      }
    })
    .catch(() => {
      textEl.textContent = "status unavailable";
    });
})();
