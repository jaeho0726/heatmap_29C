import { Building, Flame, Moon, Thermometer, TreePine } from "lucide-react";
import type { RiskContribution } from "../types";

export const RISK_CONTRIBUTIONS: RiskContribution[] = [
  { label: "체감온도", pct: 35, icon: Thermometer, color: "#E53935", detail: "38.4°C — 임계점 초과" },
  { label: "연속 폭염일수", pct: 22, icon: Flame, color: "#FB8C00", detail: "12일 연속 폭염특보" },
  { label: "야간 최저기온", pct: 18, icon: Moon, color: "#FBC02D", detail: "27.8°C — 열대야 지속" },
  { label: "녹지율 부족", pct: 15, icon: TreePine, color: "#4CAF50", detail: "구 평균 8.2% — 시 평균 이하" },
  { label: "인구밀도", pct: 10, icon: Building, color: "#6B7280", detail: "17,532명/㎢ — 고밀도 지역" },
];

export const HOURLY_RISK = [62, 68, 71, 78, 85, 91, 94, 91, 88, 82, 74, 66];
