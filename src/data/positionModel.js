export const SLOT_META = [
  { code: "GK", displayCode: "GK", name: "Goalkeeper", group: "Defence" },
  { code: "FBL", displayCode: "FB-L", name: "Full Back Left", group: "Defence" },
  { code: "FBR", displayCode: "FB-R", name: "Full Back Right", group: "Defence" },
  { code: "HBL", displayCode: "HB-L", name: "Half Back Left", group: "Midfield" },
  { code: "HBC", displayCode: "HB-C", name: "Half Back Centre", group: "Midfield" },
  { code: "HBR", displayCode: "HB-R", name: "Half Back Right", group: "Midfield" },
  { code: "INL", displayCode: "IN-L", name: "Inner Left", group: "Attack" },
  { code: "INR", displayCode: "IN-R", name: "Inner Right", group: "Attack" },
  { code: "FWDL", displayCode: "FWD-L", name: "Forward Left", group: "Attack" },
  { code: "FWDC", displayCode: "FWD-C", name: "Forward Centre", group: "Attack" },
  { code: "FWDR", displayCode: "FWD-R", name: "Forward Right", group: "Attack" },
];

export const FORMATIONS = {
  "2-3-2-3 (Default)": [
    { displayCode: "GK", displayName: "Goalkeeper", internalCode: "GK", x: 50, y: 150 },
    { displayCode: "RB", displayName: "Right Back", internalCode: "FBR", x: 62.5, y: 122 },
    { displayCode: "LB", displayName: "Left Back", internalCode: "FBL", x: 37.5, y: 122 },
    { displayCode: "RH", displayName: "Right Half", internalCode: "HBR", x: 78, y: 102 },
    { displayCode: "CH", displayName: "Centre Half", internalCode: "HBC", x: 50, y: 102 },
    { displayCode: "LH", displayName: "Left Half", internalCode: "HBL", x: 22, y: 102 },
    { displayCode: "RI", displayName: "Right Inner", internalCode: "INR", x: 62.5, y: 74 },
    { displayCode: "LI", displayName: "Left Inner", internalCode: "INL", x: 37.5, y: 74 },
    { displayCode: "RW", displayName: "Right Wing", internalCode: "FWDR", x: 82, y: 50 },
    { displayCode: "CF", displayName: "Centre Forward", internalCode: "FWDC", x: 50, y: 50 },
    { displayCode: "LW", displayName: "Left Wing", internalCode: "FWDL", x: 18, y: 50 },
  ],
  "4-3-3 (Attack)": [
    { displayCode: "GK", displayName: "Goalkeeper", internalCode: "GK", x: 50, y: 145 },
    { displayCode: "RB", displayName: "Right Back", internalCode: "FBR", x: 73, y: 120 },
    { displayCode: "CB-L", displayName: "Centre Back Left", internalCode: "FBL", x: 42, y: 118 },
    { displayCode: "CB-R", displayName: "Centre Back Right", internalCode: "HBR", x: 58, y: 118 },
    { displayCode: "LB", displayName: "Left Back", internalCode: "HBL", x: 27, y: 120 },
    { displayCode: "RM", displayName: "Right Midfield", internalCode: "FWDR", x: 71, y: 85 },
    { displayCode: "CM", displayName: "Centre Midfield", internalCode: "HBC", x: 50, y: 82 },
    { displayCode: "LM", displayName: "Left Midfield", internalCode: "FWDL", x: 29, y: 85 },
    { displayCode: "RW", displayName: "Right Wing", internalCode: "INR", x: 76, y: 32 },
    { displayCode: "CF", displayName: "Centre Forward", internalCode: "FWDC", x: 50, y: 28 },
    { displayCode: "LW", displayName: "Left Wing", internalCode: "INL", x: 24, y: 32 },
  ],
  "4-4-2 (Classic)": [
    { displayCode: "GK", displayName: "Goalkeeper", internalCode: "GK", x: 50, y: 145 },
    { displayCode: "RB", displayName: "Right Back", internalCode: "FBR", x: 73, y: 120 },
    { displayCode: "CB-L", displayName: "Centre Back Left", internalCode: "FBL", x: 42, y: 118 },
    { displayCode: "CB-R", displayName: "Centre Back Right", internalCode: "HBC", x: 58, y: 118 },
    { displayCode: "LB", displayName: "Left Back", internalCode: "HBL", x: 27, y: 120 },
    { displayCode: "RM", displayName: "Right Midfield", internalCode: "HBR", x: 75, y: 82 },
    { displayCode: "CM-R", displayName: "Centre Midfield Right", internalCode: "INR", x: 58, y: 82 },
    { displayCode: "CM-L", displayName: "Centre Midfield Left", internalCode: "INL", x: 42, y: 82 },
    { displayCode: "LM", displayName: "Left Midfield", internalCode: "FWDL", x: 25, y: 82 },
    { displayCode: "ST-R", displayName: "Striker Right", internalCode: "FWDR", x: 60, y: 34 },
    { displayCode: "ST-L", displayName: "Striker Left", internalCode: "FWDC", x: 40, y: 34 },
  ],
  "3-4-3 (Wide)": [
    { displayCode: "GK", displayName: "Goalkeeper", internalCode: "GK", x: 50, y: 145 },
    { displayCode: "CB-R", displayName: "Centre Back Right", internalCode: "FBR", x: 66, y: 118 },
    { displayCode: "CB-C", displayName: "Centre Back Centre", internalCode: "HBC", x: 50, y: 122 },
    { displayCode: "CB-L", displayName: "Centre Back Left", internalCode: "FBL", x: 34, y: 118 },
    { displayCode: "RM", displayName: "Right Midfield", internalCode: "HBR", x: 76, y: 82 },
    { displayCode: "CM-R", displayName: "Centre Midfield Right", internalCode: "INR", x: 58, y: 82 },
    { displayCode: "CM-L", displayName: "Centre Midfield Left", internalCode: "INL", x: 42, y: 82 },
    { displayCode: "LM", displayName: "Left Midfield", internalCode: "HBL", x: 24, y: 82 },
    { displayCode: "RW", displayName: "Right Wing", internalCode: "FWDR", x: 76, y: 30 },
    { displayCode: "CF", displayName: "Centre Forward", internalCode: "FWDC", x: 50, y: 28 },
    { displayCode: "LW", displayName: "Left Wing", internalCode: "FWDL", x: 24, y: 30 },
  ],
};

export const FORMATION_NAMES = Object.keys(FORMATIONS);

export function defaultPitch(formation) {
  const positions = {};
  FORMATIONS[formation].forEach((s) => {
    positions[s.internalCode] = { x: s.x, y: s.y };
  });
  return positions;
}

export function defaultLayouts() {
  return Object.fromEntries(FORMATION_NAMES.map((name) => [name, defaultPitch(name)]));
}
