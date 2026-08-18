import type { LucideIcon } from "lucide-react";

export type Screen = "welcome" | "onboarding" | "home" | "analysis" | "shelter" | "nav" | "guide";
export type NavigateHandler = (screen: Screen) => void;

export interface Coordinates {
  lat: number;
  lng: number;
}

export type AgeGroup = 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80;

export type ProvinceValue = "서울특별시";

export interface UserSettings {
  ageGroup: AgeGroup;
  province: ProvinceValue;
  district: string;
}

export type AgeGroupOption = {
  value: AgeGroup;
  label: string;
  sub: string;
};

export type SeoulDistrict = {
  name: string;
  risk: number;
  cx: number;
  cy: number;
  d: string;
  small?: boolean;
};

export type Shelter = {
  id: number;
  name: string;
  dist: string;
  time: string;
  type: string;
  open: string;
  lat: number;
  lng: number;
};

export type RiskFactor = {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  detail: string;
};

export type RiskContribution = {
  label: string;
  pct: number;
  icon: LucideIcon;
  color: string;
  detail: string;
};

export type NavigationStep = {
  dir: string;
  icon: string;
  detail: string;
};

export type GuideAction = {
  icon: string;
  title: string;
  sub: string;
  priority: "high" | "medium";
  color: string;
};
