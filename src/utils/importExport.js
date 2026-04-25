import { SLOT_META } from '../data/positionModel';

export function clampName(n) {
  return n.trim().replace(/\s+/g, " ");
}

export function nl(v) {
  return String(v || "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\-]+/g, " ")
    .trim();
}

export function pk(playerId, slotCode) {
  return `${playerId}__${slotCode}`;
}

export function parseImportText(text, players) {
  const raw = text.trim();
  if (!raw) return { playersToAdd: [], prefUpdates: [] };

  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const playersToAdd = [];
  const prefUpdates = [];

  const slotMap = {};
  SLOT_META.forEach((s) => {
    slotMap[nl(s.code)] = s.code;
    slotMap[nl(s.displayCode)] = s.code;
    slotMap[nl(s.name)] = s.code;
  });

  const addPlayerIfMissing = (name) => {
    const clean = clampName(name);
    if (!clean) return null;
    if (!playersToAdd.some((p) => nl(p.name) === nl(clean)) && !players.some(p => nl(p.name) === nl(clean))) {
      playersToAdd.push({ name: clean });
    }
    return clean;
  };

  const parsePositionsList = (value) =>
    String(value || "")
      .split(/[|;/]+/)
      .map((x) => slotMap[nl(x)])
      .filter(Boolean);

  const first = lines[0];
  if (first.includes(",") && /name|player/i.test(first)) {
    if (/experienced|capable/i.test(first)) {
      const headers = first.split(",").map((h) => nl(h));
      const idx = {
        name: headers.findIndex((h) => h === "name" || h === "player"),
        experienced: headers.findIndex((h) => h === "experienced"),
        capable: headers.findIndex((h) => h === "capable"),
        limited: headers.findIndex((h) => h === "limited"),
        uncomfortable: headers.findIndex((h) => h === "uncomfortable"),
      };

      lines.slice(1).forEach((line) => {
        const cells = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        const name = addPlayerIfMissing(cells[idx.name] || "");
        if (!name) return;
        [
          { level: 3, key: idx.experienced },
          { level: 2, key: idx.capable },
          { level: 1, key: idx.limited },
          { level: 0, key: idx.uncomfortable },
        ].forEach(({ level, key }) => {
          if (key === -1) return;
          parsePositionsList(cells[key]).forEach((slotCode) => {
            prefUpdates.push({ name, slotCode, value: level });
          });
        });
      });
    } else {
      const headers = first.split(",").map((h) => nl(h));
      const idx = {
        name: headers.findIndex((h) => h === "name" || h === "player"),
      };
      
      const colMap = {};
      headers.forEach((h, i) => {
         if (slotMap[h]) colMap[i] = slotMap[h];
      });

      lines.slice(1).forEach((line) => {
        const cells = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        const name = addPlayerIfMissing(cells[idx.name] || "");
        if (!name) return;
        
        cells.forEach((val, i) => {
           if (i === idx.name) return;
           const slotCode = colMap[i];
           if (slotCode) {
              const prefText = nl(val);
              let level = 1;
              if (prefText === "experienced" || prefText === "3") level = 3;
              else if (prefText === "capable" || prefText === "2") level = 2;
              else if (prefText === "limited" || prefText === "1") level = 1;
              else if (prefText === "uncomfortable" || prefText === "0") level = 0;
              
              if (val) prefUpdates.push({ name, slotCode, value: level });
           }
        });
      });
    }

    return { playersToAdd, prefUpdates };
  }

  lines.forEach((line) => {
    if (line.includes(",")) {
      const [namePart, ...rest] = line.split(",");
      const name = addPlayerIfMissing(namePart);
      if (!name) return;
      const roles = rest.map((r) => slotMap[nl(r)]).filter(Boolean);
      roles.forEach((slotCode, idx) => {
        prefUpdates.push({ name, slotCode, value: idx === 0 ? 3 : 2 });
      });
    } else {
      addPlayerIfMissing(line);
    }
  });

  return { playersToAdd, prefUpdates };
}

export function encodeState(state) {
  try {
    const jsonString = JSON.stringify(state);
    const bytes = new TextEncoder().encode(jsonString);
    const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
    return btoa(binString);
  } catch (e) {
    console.error(e);
    return null;
  }
}

export function decodeState(code) {
  try {
    const binString = atob(code.trim());
    const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (e) {
    console.error(e);
    return null;
  }
}

export function exportPreferencesCsv(players, prefScore) {
  const headers = ["Player", ...SLOT_META.map(s => s.displayCode)];
  const rows = [headers.join(",")];
  
  players.forEach((player) => {
    const row = [player.name];
    SLOT_META.forEach((slot) => {
      const score = prefScore(player.id, slot.code);
      let text = "Limited";
      if (score === 3) text = "Experienced";
      else if (score === 2) text = "Capable";
      else if (score === 0) text = "Uncomfortable";
      row.push(text);
    });
    rows.push(row.join(","));
  });
  return rows.join("\n");
}

export function exportMatchdaySummary(fSlots, lineup, byId) {
  return fSlots
    .map((spot) => {
      const pid = lineup[spot.internalCode];
      const player = byId(pid);
      return `${spot.displayCode} - ${spot.displayName}: ${player ? player.name : "Empty"}`;
    })
    .join("\n");
}
