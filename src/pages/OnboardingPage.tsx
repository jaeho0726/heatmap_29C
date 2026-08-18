import { useState } from "react";
import { ChevronRight, Flame, Info, MapPin } from "lucide-react";
import { AGE_GROUPS, LOCATIONS } from "../data/onboarding";
import type { AgeGroup } from "../types";

export default function OnboardingPage({ onComplete }: { onComplete: () => void }) {
  const [age, setAge] = useState<AgeGroup | null>(null);
  const [location, setLocation] = useState("");
  const [locOpen, setLocOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Hero */}
      <div className="flex flex-col items-center pt-14 pb-8 px-6" style={{ background: "#183153" }}>
        {/* Logo */}
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: "rgba(255,255,255,0.12)" }}>
            <MapPin size={28} color="white" strokeWidth={2} />
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#E53935" }}>
              <Flame size={13} color="white" strokeWidth={2.5} />
            </div>
          </div>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight mb-2" style={{ fontFamily: "Inter, sans-serif" }}>HeatMap</h1>
        <p className="text-center text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)", fontFamily: "'Noto Sans KR', sans-serif", maxWidth: 260 }}>
          AI 기반 폭염 위험 예측 및<br />맞춤형 대응 서비스
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 px-5 py-6 space-y-6 overflow-y-auto">
        {/* Age group */}
        <div>
          <label className="block text-sm font-bold mb-3" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>
            연령대 선택
          </label>
          <div className="flex flex-col gap-2">
            {AGE_GROUPS.map((g) => (
              <button
                key={g.id}
                onClick={() => setAge(g.id)}
                className="flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all"
                style={{
                  borderColor: age === g.id ? g.accent : "#E5E7EB",
                  background: age === g.id ? g.pastel : "#F5F7FA",
                }}
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: g.accent }} />
                <div className="text-left">
                  <span className="text-sm font-bold" style={{ color: "#111827", fontFamily: "'Noto Sans KR', sans-serif" }}>{g.label}</span>
                  <span className="text-xs ml-2" style={{ color: "#6B7280", fontFamily: "'Noto Sans KR', sans-serif" }}>{g.sub}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-bold mb-3" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>
            현재 거주 지역
          </label>
          <div className="relative">
            <button
              className="w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all"
              style={{
                borderColor: locOpen ? "#183153" : "#E5E7EB",
                background: "#F5F7FA",
              }}
              onClick={() => setLocOpen(!locOpen)}
            >
              <div className="flex items-center gap-2">
                <MapPin size={16} color="#183153" />
                <span style={{ color: location ? "#111827" : "#9CA3AF", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "15px" }}>
                  {location || "서울시 자치구 선택"}
                </span>
              </div>
              <ChevronRight size={16} color="#9CA3AF" style={{ transform: locOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
            </button>
            {locOpen && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
                {LOCATIONS.map((loc) => (
                  <button
                    key={loc}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                    style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", color: "#111827" }}
                    onClick={() => { setLocation(loc); setLocOpen(false); }}
                  >
                    서울시 {loc}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex gap-2.5 p-3.5 rounded-2xl" style={{ background: "#FFF3E0" }}>
          <Info size={15} color="#FB8C00" className="flex-shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed" style={{ color: "#78350F", fontFamily: "'Noto Sans KR', sans-serif" }}>
            본 서비스는 의료 진단이 아닌 참고용 AI 위험도 예측 서비스입니다.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-8 pt-2">
        <button
          onClick={() => { if (age && location) onComplete(); }}
          disabled={!age || !location}
          className="w-full py-4 rounded-2xl font-bold text-base transition-all"
          style={{
            background: age && location ? "#183153" : "#E5E7EB",
            color: age && location ? "white" : "#9CA3AF",
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: "17px",
          }}
        >
          폭염 위험 확인하기
        </button>
      </div>
    </div>
  );
}

