import { AlertTriangle, Heart, Info, Phone } from "lucide-react";
import { GUIDE_ACTIONS, HEALTH_WARNING_SIGNS } from "../data/guide";
import { HOME_SCORE } from "../data/risk";
import { RISK_COLOR } from "../utils/risk";

export default function GuidePage() {
  const score = HOME_SCORE;

  return (
    <div className="flex flex-col bg-gray-50 pb-4">
      <div className="px-5 pt-12 pb-5" style={{ background: "#183153" }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm" style={{ background: "rgba(255,255,255,0.15)" }}>
            🤖
          </div>
          <h1 className="text-xl font-black text-white" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>AI 맞춤 가이드</h1>
        </div>
        <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>72세 · 종로구 거주</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.65)", fontFamily: "'Noto Sans KR', sans-serif" }}>현재 위험도</span>
              <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: RISK_COLOR(score), color: "white", fontFamily: "Inter, sans-serif" }}>{score}점 · 매우 위험</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Priority warning */}
        <div className="rounded-2xl p-4 border-2" style={{ background: "#FFEBEE", borderColor: "#FFCDD2" }}>
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle size={16} color="#E53935" />
            <span className="text-sm font-bold" style={{ color: "#C62828", fontFamily: "'Noto Sans KR', sans-serif" }}>즉각 대응 필요</span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "#7F1D1D", fontFamily: "'Noto Sans KR', sans-serif" }}>
            현재 귀하의 연령대(70대 이상)는 폭염에 특히 취약합니다. 아래 권고사항을 즉시 실행하세요.
          </p>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-2 gap-3">
          {GUIDE_ACTIONS.map((a, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 shadow-sm border flex flex-col gap-2"
              style={{ borderColor: i < 3 ? a.color + "30" : "#F3F4F6" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{a.icon}</span>
                {i < 3 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: a.color + "18", color: a.color, fontFamily: "'Noto Sans KR', sans-serif" }}>
                    긴급
                  </span>
                )}
              </div>
              <div>
                <div className="text-sm font-bold leading-tight" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>{a.title}</div>
                <div className="text-xs mt-1 leading-snug" style={{ color: "#6B7280", fontFamily: "'Noto Sans KR', sans-serif" }}>{a.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Health tips */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border" style={{ borderColor: "#F3F4F6" }}>
          <div className="flex items-center gap-2 mb-3">
            <Heart size={15} color="#E53935" />
            <h2 className="text-sm font-bold" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>폭염 증상 즉시 신고 체크리스트</h2>
          </div>
          {HEALTH_WARNING_SIGNS.map((tip, i) => (
            <div key={i} className="flex items-center gap-2.5 py-2 border-b last:border-0" style={{ borderColor: "#F3F4F6" }}>
              <AlertTriangle size={13} color="#FB8C00" className="flex-shrink-0" />
              <span className="text-sm" style={{ color: "#374151", fontFamily: "'Noto Sans KR', sans-serif" }}>{tip}</span>
            </div>
          ))}
          <button className="w-full mt-3 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5" style={{ background: "#183153", color: "white", fontFamily: "'Noto Sans KR', sans-serif" }}>
            <Phone size={14} />
            응급 신고 119
          </button>
        </div>

        {/* Disclaimer */}
        <div className="flex gap-2.5 p-4 rounded-2xl border" style={{ background: "#F5F7FA", borderColor: "#E5E7EB" }}>
          <Info size={14} color="#9CA3AF" className="flex-shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed" style={{ color: "#6B7280", fontFamily: "'Noto Sans KR', sans-serif" }}>
            본 서비스는 의료 진단이 아닌 참고용 AI 위험도 예측 서비스입니다. 건강 이상 시 반드시 의료 전문가와 상담하세요.
          </p>
        </div>
      </div>
    </div>
  );
}

