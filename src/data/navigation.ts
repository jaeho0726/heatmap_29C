import type { NavigationStep } from "../types";

export const NAVIGATION_STEPS: NavigationStep[] = [
  { dir: "직진", icon: "↑", detail: "50m — 창신길 따라 직진" },
  { dir: "우회전", icon: "→", detail: "80m — 종로 방면 우회전" },
  { dir: "좌회전", icon: "←", detail: "150m — 창신동 주민센터 방향" },
  { dir: "도착", icon: "📍", detail: "종로구 무더위쉼터 (창신동 주민센터)" },
];
