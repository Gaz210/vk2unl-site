// Station globe — plots QSO contacts as arcs from home QTH, spinnable by the user.
(function () {
  const container = document.getElementById("globe-container");
  if (!container || typeof Globe === "undefined") return;

  const home = window.SITE_HOME || { lat: -33.7667, lng: 151.1414 };
  const qsos = (window.SITE_QSOS || []).filter((q) => q.lat != null && q.lng != null);

  const arcsData = qsos.map((q) => ({
    startLat: home.lat,
    startLng: home.lng,
    endLat: q.lat,
    endLng: q.lng,
    color: "#8b7cf6",
    label: `${q.callsign} · ${q.band} ${q.mode}`,
  }));

  const pointsData = qsos.map((q) => ({
    lat: q.lat,
    lng: q.lng,
    size: 0.6,
    color: "#e9e9ee",
    label: `${q.callsign} — ${q.location}`,
  }));

  pointsData.push({ lat: home.lat, lng: home.lng, size: 0.9, color: "#8b7cf6", label: "VK2UNL — home QTH" });

  const globe = Globe()(container)
    .backgroundColor("rgba(0,0,0,0)")
    .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-dark.jpg")
    .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png")
    .showAtmosphere(true)
    .atmosphereColor("#8b7cf6")
    .atmosphereAltitude(0.18)
    .arcsData(arcsData)
    .arcColor("color")
    .arcDashLength(0.4)
    .arcDashGap(2)
    .arcDashAnimateTime(2500)
    .arcStroke(0.5)
    .pointsData(pointsData)
    .pointColor("color")
    .pointAltitude(0.01)
    .pointRadius("size")
    .pointLabel("label")
    .width(container.clientWidth)
    .height(container.clientHeight);

  // Gentle auto-rotate; stops responding to input while user drags, resumes after.
  const controls = globe.controls();
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.6;
  controls.enableZoom = false;

  let resumeTimer;
  controls.addEventListener("start", () => {
    controls.autoRotate = false;
    clearTimeout(resumeTimer);
  });
  controls.addEventListener("end", () => {
    resumeTimer = setTimeout(() => (controls.autoRotate = true), 4000);
  });

  window.addEventListener("resize", () => {
    globe.width(container.clientWidth).height(container.clientHeight);
  });
})();
