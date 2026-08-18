import { AlertTriangle, BarChart2 } from "lucide-react";
import { HOURLY_RISK, RISK_CONTRIBUTIONS } from "../data/analysis";
import { HOME_SCORE } from "../data/risk";
import { RISK_BG, RISK_COLOR } from "../utils/risk";

export default function AnalysisPage() {
  const score = HOME_SCORE;

  return (
    <div className="flex flex-col bg-gray-50 pb-4">
      <div className="px-5 pt-12 pb-5" style={{ background: "#183153" }}>
        <h1 className="text-xl font-black text-white mb-1" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>AI 위험 분석</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)", fontFamily: "'Noto Sans KR', sans-serif" }}>서울시 종로구 · 2026.08.12</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Overall score */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border" style={{ borderColor: "#F3F4F6" }}>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center flex-shrink-0" style={{ background: RISK_BG(score) }}>
              <span className="text-3xl font-black" style={{ color: RISK_COLOR(score), fontFamily: "Inter, sans-serif", lineHeight: 1 }}>{score}</span>
              <span className="text-xs font-medium mt-0.5" style={{ color: RISK_COLOR(score), fontFamily: "'Noto Sans KR', sans-serif" }}>점</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-black" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>매우 위험</span>
                <AlertTriangle size={16} color="#E53935" />
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#6B7280", fontFamily: "'Noto Sans KR', sans-serif" }}>
                현재 위험도가 매우 높습니다. 실외 활동을 즉시 중단하고 냉방 시설로 이동하세요.
              </p>
            </div>
          </div>
        </div>

        {/* AI Explanation */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border" style={{ borderColor: "#F3F4F6" }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "#EFF4FB" }}>
              <BarChart2 size={14} color="#183153" />
            </div>
            <h2 className="text-base font-bold" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>AI 분석 설명</h2>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "#374151", fontFamily: "'Noto Sans KR', sans-serif" }}>
            현재 종로구는 <strong>12일 연속 폭염특보</strong>가 유지되고 있으며, 야간 최저기온 27.8°C로 인해 신체 회복이 어려운 상태입니다. 구 평균 녹지율 8.2%는 서울 평균(12.4%)을 크게 하회하여 열섬 효과가 심화되고 있습니다.
          </p>
        </div>

        {/* Factor contributions */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border" style={{ borderColor: "#F3F4F6" }}>
          <h2 className="text-base font-bold mb-4" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>위험 요인 기여도</h2>
          <div className="space-y-3.5">
            {RISK_CONTRIBUTIONS.map((c) => (
              <div key={c.label}>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: c.color + "16" }}>
                    <c.icon size={14} color={c.color} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold" style={{ color: "#374151", fontFamily: "'Noto Sans KR', sans-serif" }}>{c.label}</span>
                      <span className="text-sm font-black" style={{ color: c.color, fontFamily: "Inter, sans-serif" }}>+{c.pct}%</span>
                    </div>
                  </div>
                </div>
                <div className="h-2 rounded-full ml-9" style={{ background: "#F3F4F6" }}>
                  <div className="h-full rounded-full" style={{ width: `${c.pct * 2.6}%`, background: c.color }} />
                </div>
                <p className="text-xs mt-1 ml-9" style={{ color: "#9CA3AF", fontFamily: "'Noto Sans KR', sans-serif" }}>{c.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 24h forecast */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border" style={{ borderColor: "#F3F4F6" }}>
          <h2 className="text-base font-bold mb-3" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>시간대별 위험도</h2>
          <div className="flex items-end gap-1 h-16">
            {HOURLY_RISK.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-sm" style={{ height: `${v * 0.58}px`, background: RISK_COLOR(v), minHeight: 4 }} />
                <span className="text-xs" style={{ color: "#9CA3AF", fontFamily: "Inter, sans-serif", fontSize: "8px" }}>
                  {(6 + i * 2) % 24}시
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

