import { SLOT_META } from '../data/positionModel';

export function getLineupSummary(lineup, players, prefScore) {
  let experienced = 0;
  let capable = 0;
  let limited = 0;
  let uncomfortable = 0;
  const warnings = [];

  SLOT_META.forEach((slot) => {
    const pid = lineup[slot.code];
    if (!pid) return;
    const sc = prefScore(pid, slot.code);
    if (sc === 3) experienced += 1;
    else if (sc === 2) capable += 1;
    else if (sc === 1) limited += 1;
    else uncomfortable += 1;
  });

  if (limited > 0) warnings.push(`${limited} player${limited > 1 ? "s" : ""} in Limited roles.`);
  if (uncomfortable > 0) warnings.push(`${uncomfortable} player${uncomfortable > 1 ? "s" : ""} in Uncomfortable roles.`);

  SLOT_META.forEach((slot) => {
    const isCapable = players.filter((p) => prefScore(p.id, slot.code) >= 2).length;
    if (isCapable === 0) warnings.push(`No Experienced or Capable option for ${slot.name}.`);
  });

  return { experienced, capable, limited, uncomfortable, warnings: [...new Set(warnings)].slice(0, 4) };
}
