import type { AgeGroupOption } from "../types";

export const AGE_GROUPS: AgeGroupOption[] = [
  { id: "youth", label: "청소년", sub: "18세 미만", pastel: "#E8F5E9", accent: "#4CAF50" },
  { id: "adult", label: "성인", sub: "18-59세", pastel: "#FFFDE7", accent: "#F9A825" },
  { id: "senior", label: "고령자", sub: "60-74세", pastel: "#FFF3E0", accent: "#FB8C00" },
  { id: "elderly", label: "노인", sub: "75세 이상", pastel: "#FFEBEE", accent: "#E53935" },
];

export const LOCATIONS = ["종로구", "중구", "용산구", "성동구", "광진구", "동대문구", "마포구", "강남구", "서초구", "송파구"];
