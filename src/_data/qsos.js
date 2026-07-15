const fs = require("fs");
const path = require("path");
const { XMLParser } = require("fast-xml-parser");

// Converts a Maidenhead grid square (4 or 6 char) to approximate lat/lng.
// Standard algorithm: https://en.wikipedia.org/wiki/Maidenhead_Locator_System
function gridToLatLng(grid) {
  if (!grid || grid.length < 4) return null;
  grid = grid.toUpperCase();

  const A = "A".charCodeAt(0);

  const lonField = grid.charCodeAt(0) - A; // 0-17
  const latField = grid.charCodeAt(1) - A;
  const lonSquare = parseInt(grid[2], 10); // 0-9
  const latSquare = parseInt(grid[3], 10);

  let lng = lonField * 20 - 180 + lonSquare * 2;
  let lat = latField * 10 - 90 + latSquare * 1;

  // Centre within the square by default (add half a square).
  lng += 1;
  lat += 0.5;

  if (grid.length >= 6) {
    const lonSubsquare = grid.charCodeAt(4) - A; // 0-23
    const latSubsquare = grid.charCodeAt(5) - A;
    // Back out the default centring, then add subsquare-level precision.
    lng = lonField * 20 - 180 + lonSquare * 2 + (lonSubsquare * (2 / 24)) + (1 / 24);
    lat = latField * 10 - 90 + latSquare * 1 + (latSubsquare * (1 / 24)) + (0.5 / 24);
  }

  return { lat, lng };
}

function formatDate(qsoDate) {
  // ADIF QSO_DATE is YYYYMMDD
  if (!qsoDate || qsoDate.length !== 8) return qsoDate || "";
  return `${qsoDate.slice(0, 4)}-${qsoDate.slice(4, 6)}-${qsoDate.slice(6, 8)}`;
}

function formatTime(timeOn) {
  // ADIF TIME_ON can be HHMM or HHMMSS
  if (!timeOn) return "";
  return timeOn.slice(0, 4);
}

module.exports = () => {
  const adxPath = path.join(__dirname, "qsos.adx");

  if (!fs.existsSync(adxPath)) return [];

  const xml = fs.readFileSync(adxPath, "utf-8");
  const parser = new XMLParser({ parseTagValue: false });
  const parsed = parser.parse(xml);

  let records = parsed?.ADX?.RECORDS?.RECORD || [];
  if (!Array.isArray(records)) records = [records]; // single-record files parse as an object

  const qsos = records.map((r) => {
    const coords = gridToLatLng(r.GRIDSQUARE);
    return {
      date: formatDate(String(r.QSO_DATE ?? "")),
      utc: formatTime(String(r.TIME_ON ?? "")),
      callsign: r.CALL || "",
      band: (r.BAND || "").toLowerCase(),
      mode: r.MODE || "",
      rst_sent: r.RST_SENT != null ? String(r.RST_SENT) : "",
      rst_recv: r.RST_RCVD != null ? String(r.RST_RCVD) : "",
      location: r.QTH || r.COUNTRY || "",
      lat: coords ? coords.lat : null,
      lng: coords ? coords.lng : null,
      notes: r.NOTES || "",
    };
  });

  // Sort newest first.
  qsos.sort((a, b) => (a.date < b.date ? 1 : -1));

  return qsos;
};
