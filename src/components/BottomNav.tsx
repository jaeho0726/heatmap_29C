import { BarChart2, BookOpen, Compass, Home, Map } from "lucide-react";
import type { NavigateHandler, Screen } from "../types";

export default function BottomNav({
  current,
  onNav,
}: {
  current: Screen;
  onNav: NavigateHandler;
}) {
  const tabs: { id: Screen; icon: typeof Home; label: string }[] = [
  { id: "home", icon: Home, label: "홈" },
  { id: "analysis", icon: BarChart2, label: "분석" },
  { id: "shelter", icon: Map, label: "쉼터" },
  { id: "nav", icon: Compass, label: "길찾기" },
  { id: "guide", icon: BookOpen, label: "AI 가이드" },
];
  return (
    <nav className="flex items-center justify-around border-t border-gray-100 bg-white px-2 pt-2 pb-safe">
      {tabs.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onNav(id)}
          className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-colors"
          style={{ color: current === id ? "#183153" : "#9CA3AF" }}
        >
          <Icon size={22} strokeWidth={current === id ? 2.5 : 1.8} />
          <span className="text-xs font-semibold" style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "10px" }}>{label}</span>
        </button>
      ))}
    </nav>
  );
}
