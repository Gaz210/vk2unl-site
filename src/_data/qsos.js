const fs = require("fs");
const path = require("path");

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

  let lng = lonField * 20 - 180 + lonSquare * 2 + 1; // +1 centres within the square
  let lat = latField * 10 - 90 + latSquare * 1 + 0.5;

  if (grid.length >= 6) {
    const lonSubsquare = grid.charCodeAt(4) - A; // 0-23
    const latSubsquare = grid.charCodeAt(5) - A;
    lng = lonField * 20 - 180 + lonSquare * 2 + lonSubsquare * (2 / 24) + 1 / 24;
    lat = latField * 10 - 90 + latSquare * 1 + latSubsquare * (1 / 24) + 0.5 / 24;
  }

  return { lat, lng };
}

function formatDate(qsoDate) {
  if (!qsoDate || qsoDate.length !== 8) return qsoDate || "";
  return `${qsoDate.slice(0, 4)}-${qsoDate.slice(4, 6)}-${qsoDate.slice(6, 8)}`;
}

function formatTime(timeOn) {
  if (!timeOn) return "";
  return timeOn.slice(0, 4);
}

// Parses ADIF's native tag format: <FIELDNAME:LENGTH>value ... <EOR>
function parseAdif(text) {
  const eohIdx = text.search(/<eoh>/i);
  const body = eohIdx >= 0 ? text.slice(eohIdx + 5) : text;
  const recordChunks = body.split(/<eor>/i).map((s) => s.trim()).filter(Boolean);

  return recordChunks.map((chunk) => {
    const fields = {};
    const tagRegex = /<([^:>]+):(\d+)(?::[^>]*)?>/g;
    let match;
    while ((match = tagRegex.exec(chunk)) !== null) {
      const name = match[1].toUpperCase();
      const len = parseInt(match[2], 10);
      const start = tagRegex.lastIndex;
      fields[name] = chunk.slice(start, start + len);
      tagRegex.lastIndex = start + len;
    }
    return fields;
  });
}

// Parses ADX's XML variant, in case you ever export that instead.
function parseAdx(text) {
  const { XMLParser } = require("fast-xml-parser");
  const parser = new XMLParser({ parseTagValue: false });
  const parsed = parser.parse(text);
  let records = parsed?.ADX?.RECORDS?.RECORD || [];
  if (!Array.isArray(records)) records = [records];
  return records;
}

function toQso(r) {
  const coords = gridToLatLng(r.GRIDSQUARE);
  return {
    date: formatDate(String(r.QSO_DATE ?? "")),
    utc: formatTime(String(r.TIME_ON ?? "")),
    callsign: r.CALL || "",
    band: (r.BAND || "").toLowerCase(),
    mode: r.MODE || "",
    rst_sent: r.RST_SENT != null ? String(r.RST_SENT) : "",
    rst_recv: r.RST_RCVD != null ? String(r.RST_RCVD) : "",
    location: r.QTH || r.STATE || r.COUNTRY || "",
    lat: coords ? coords.lat : null,
    lng: coords ? coords.lng : null,
    notes: r.NAME ? r.NAME.trim() : "",
    _key: `${r.CALL}|${r.QSO_DATE}|${r.TIME_ON}|${r.BAND}|${r.MODE}`,
  };
}

module.exports = () => {
  const logsDir = path.join(__dirname, "qso-logs");
  if (!fs.existsSync(logsDir)) return [];

  const files = fs
    .readdirSync(logsDir)
    .filter((f) => f.toLowerCase().endsWith(".adi") || f.toLowerCase().endsWith(".adx"));

  let allRecords = [];
  for (const file of files) {
    const filePath = path.join(logsDir, file);
    const text = fs.readFileSync(filePath, "utf-8");
    const records = file.toLowerCase().endsWith(".adx") ? parseAdx(text) : parseAdif(text);
    allRecords = allRecords.concat(records);
  }

  const qsos = allRecords.map(toQso);

  // Dedupe: the same contact can appear in more than one export.
  const seen = new Set();
  const deduped = qsos.filter((q) => {
    if (seen.has(q._key)) return false;
    seen.add(q._key);
    return true;
  });

  deduped.forEach((q) => delete q._key);
  deduped.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.utc < b.utc ? 1 : -1;
  });

  return deduped;
};
