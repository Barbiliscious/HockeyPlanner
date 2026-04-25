import { Star, Circle, Triangle, X } from "lucide-react";

export const PREF_LEVELS = [
  { value: 3, Icon: Star, short: "Experienced", label: "Experienced", color: "#FFFFFF", bg: "#166534", border: "#166534" },
  { value: 2, Icon: Circle, short: "Capable", label: "Capable", color: "#FFFFFF", bg: "#1E40AF", border: "#1E40AF" },
  { value: 1, Icon: Triangle, short: "Limited", label: "Limited", color: "#FFFFFF", bg: "#B45309", border: "#B45309" },
  { value: 0, Icon: X, short: "Uncomfortable", label: "Uncomfortable", color: "#FFFFFF", bg: "#9F1239", border: "#9F1239" },
];

export const scoreWeight = { 3: 100, 2: 55, 1: 8, 0: -1000 };

export function prefMeta(value) {
  return PREF_LEVELS.find((f) => f.value === value) || PREF_LEVELS.find(f => f.value === 1);
}
