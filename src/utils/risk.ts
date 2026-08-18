export const RISK_COLOR = (score: number) => {
  if (score <= 25) return "#4CAF50";
  if (score <= 50) return "#FBC02D";
  if (score <= 75) return "#FB8C00";
  return "#E53935";
};

export const RISK_BG = (score: number) => {
  if (score <= 25) return "#E8F5E9";
  if (score <= 50) return "#FFFDE7";
  if (score <= 75) return "#FFF3E0";
  return "#FFEBEE";
};

export const RISK_LABEL = (score: number) => {
  if (score <= 25) return "안전";
  if (score <= 50) return "주의";
  if (score <= 75) return "위험";
  return "매우 위험";
};
