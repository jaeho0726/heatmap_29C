import { Flame, Moon, Thermometer, TreePine } from "lucide-react";
import type { RiskFactor } from "../types";

export const HOME_SCORE = 91;

export const RISK_FACTORS: RiskFactor[] = [
  { label: "체감온도", value: 35, icon: Thermometer, color: "#E53935", detail: "38.4°C" },
  { label: "연속 폭염일수", value: 22, icon: Flame, color: "#FB8C00", detail: "12일 연속" },
  { label: "야간 최저기온", value: 18, icon: Moon, color: "#FBC02D", detail: "27.8°C" },
  { label: "녹지율", value: 15, icon: TreePine, color: "#4CAF50", detail: "8.2% (낮음)" },
];
