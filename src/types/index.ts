import type { LucideIcon } from "lucide-react";

export type Screen = "onboarding" | "home" | "analysis" | "shelter" | "nav" | "guide";
export type NavigateHandler = (screen: Screen) => void;

export type AgeGroup = "youth" | "adult" | "senior" | "elderly";

export type AgeGroupOption = {
  id: AgeGroup;
  label: string;
  sub: string;
  pastel: string;
  accent: string;
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
