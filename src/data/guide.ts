import type { GuideAction } from "../types";

export const GUIDE_ACTIONS: GuideAction[] = [
  { icon: "💧", title: "물 자주 마시기", sub: "30분마다 200ml 이상 섭취하세요", priority: "high", color: "#1E88E5" },
  { icon: "🏠", title: "야외활동 자제", sub: "오후 12시–16시 외출을 피하세요", priority: "high", color: "#E53935" },
  { icon: "❄️", title: "무더위쉼터 이용", sub: "인근 쉼터를 적극 활용하세요", priority: "high", color: "#4CAF50" },
  { icon: "⏰", title: "오후 외출 자제", sub: "외출 시 아침 10시 이전을 권장합니다", priority: "medium", color: "#FB8C00" },
  { icon: "👕", title: "얇고 밝은 옷 착용", sub: "통풍이 잘 되는 면 소재를 입으세요", priority: "medium", color: "#9C27B0" },
  { icon: "📱", title: "가족·이웃 안부 확인", sub: "홀로 계신 어르신에게 연락하세요", priority: "medium", color: "#183153" },
];

export const HEALTH_WARNING_SIGNS = ["어지럼증 또는 두통", "과도한 발한 또는 무한증", "근육 경련 발생", "의식 혼탁 또는 구역감"];
