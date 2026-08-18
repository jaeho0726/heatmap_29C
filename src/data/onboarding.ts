import type { AgeGroupOption, ProvinceValue } from "../types";

export const AGE_GROUPS: AgeGroupOption[] = [
  { value: 0, label: "0대", sub: "0~9세" },
  { value: 10, label: "10대", sub: "10~19세" },
  { value: 20, label: "20대", sub: "20~29세" },
  { value: 30, label: "30대", sub: "30~39세" },
  { value: 40, label: "40대", sub: "40~49세" },
  { value: 50, label: "50대", sub: "50~59세" },
  { value: 60, label: "60대", sub: "60~69세" },
  { value: 70, label: "70대", sub: "70~79세" },
  { value: 80, label: "80대+", sub: "80세 이상" },
];

export const LOCATIONS = ["종로구", "중구", "용산구", "성동구", "광진구", "동대문구", "마포구", "강남구", "서초구", "송파구"] as const;

export const PROVINCES = [
  { value: "서울특별시", label: "서울특별시" },
] as const;

export const DISTRICTS_BY_PROVINCE: Record<ProvinceValue, typeof LOCATIONS> = {
  서울특별시: LOCATIONS,
};
