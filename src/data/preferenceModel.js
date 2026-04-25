import { Star, Circle, Triangle, X } from "lucide-react";

export const PREF_LEVELS = [
  { value: 3, Icon: Star, short: "Experienced", label: "Experienced", color: "#15803d", bg: "#dcfce7", border: "#86efac" },
  { value: 2, Icon: Circle, short: "Capable", label: "Capable", color: "#3f8f52", bg: "#ecfdf5", border: "#bbf7d0" },
  { value: 1, Icon: Triangle, short: "Limited", label: "Limited", color: "#b45309", bg: "#ffedd5", border: "#fdba74" },
  { value: 0, Icon: X, short: "Uncomfortable", label: "Uncomfortable", color: "#b91c1c", bg: "#fee2e2", border: "#fca5a5" },
];

export const scoreWeight = { 3: 100, 2: 55, 1: 8, 0: -1000 };

export function prefMeta(value) {
  return PREF_LEVELS.find((f) => f.value === value) || PREF_LEVELS.find(f => f.value === 1);
}
