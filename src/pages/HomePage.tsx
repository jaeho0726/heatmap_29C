import { useState } from "react";
import { BarChart2, ChevronRight, Droplets, MapPin, RefreshCw, Shield, Wind } from "lucide-react";
import RiskGauge from "../components/RiskGauge";
import RiskLegend from "../components/RiskLegend";
import SeoulMap from "../components/SeoulMap";
import { HOME_SCORE, RISK_FACTORS } from "../data/risk";
import { SEOUL_PATHS } from "../data/seoulDistricts";
import type { NavigateHandler } from "../types";
import { RISK_BG, RISK_COLOR, RISK_LABEL } from "../utils/risk";

export default function HomePage({ onNav }: { onNav: NavigateHandler }) {
  const score = HOME_SCORE;
  const [selectedDistrict, setSelectedDistrict] = useState("종로구");

  return (
    <div className="flex flex-col bg-gray-50 pb-4">
      {/* Header */}
      <div className="px-5 pt-12 pb-5" style={{ background: RISK_COLOR(score) }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <MapPin size={14} color="white" />
            <span className="text-sm font-semibold text-white" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>서울시 종로구</span>
          </div>
          <div className="flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.85)", fontFamily: "'Noto Sans KR', sans-serif" }}>
            <RefreshCw size={11} />
            <span>방금 전 업데이트</span>
          </div>
        </div>
        <div className="flex items-end justify-between mt-4">
          <div>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-black text-white" style={{ fontFamily: "Inter, sans-serif", lineHeight: 1 }}>38°C</span>
              <span className="text-base mb-1 text-white font-medium" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>체감 39°C</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <Droplets size={13} color="white" />
                <span className="text-sm font-medium text-white" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>습도 72%</span>
              </div>
              <div className="flex items-center gap-1">
                <Wind size={13} color="white" />
                <span className="text-sm font-medium text-white" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>풍속 1.2m/s</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-white" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>폭염특보 발효 중</div>
            <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.85)", fontFamily: "'Noto Sans KR', sans-serif" }}>2026.08.12 화요일</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Risk Score Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border" style={{ borderColor: "#F3F4F6" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>AI 위험도</h2>
            <span className="px-3 py-1 rounded-full text-sm font-bold" style={{ background: RISK_BG(score), color: RISK_COLOR(score), fontFamily: "'Noto Sans KR', sans-serif" }}>
              {RISK_LABEL(score)}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <RiskGauge score={score} />
          </div>
          <button
            onClick={() => onNav("analysis")}
            className="w-full mt-3 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-colors"
            style={{ background: "#EFF4FB", color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}
          >
            <BarChart2 size={15} />
            상세 위험 분석 보기
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Risk Factors */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border" style={{ borderColor: "#F3F4F6" }}>
          <h2 className="text-base font-bold mb-3" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>주요 위험 요인</h2>
          <div className="space-y-2.5">
            {RISK_FACTORS.map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: f.color + "18" }}>
                  <f.icon size={15} color={f.color} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium" style={{ color: "#374151", fontFamily: "'Noto Sans KR', sans-serif" }}>{f.label}</span>
                    <span className="text-sm font-bold" style={{ color: f.color, fontFamily: "Inter, sans-serif" }}>{f.detail}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(f.value * 2.5, 100)}%`, background: f.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Seoul Heatmap */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border" style={{ borderColor: "#F3F4F6" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>서울 폭염 현황 지도</h2>
          </div>
          <SeoulMap selected={selectedDistrict} onSelect={(name) => setSelectedDistrict(name)} />
          <div className="mt-3">
            <RiskLegend />
          </div>
          {selectedDistrict && (
            <div className="mt-3 flex items-center justify-between p-3 rounded-xl" style={{ background: "#F5F7FA" }}>
              <div className="flex items-center gap-2">
                <MapPin size={14} color="#183153" />
                <span className="text-sm font-bold" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>{selectedDistrict}</span>
              </div>
              <span className="text-sm font-bold px-2.5 py-0.5 rounded-full" style={{
                background: RISK_BG(SEOUL_PATHS.find(d => d.name === selectedDistrict)?.risk ?? 50),
                color: RISK_COLOR(SEOUL_PATHS.find(d => d.name === selectedDistrict)?.risk ?? 50),
                fontFamily: "'Noto Sans KR', sans-serif"
              }}>
                {SEOUL_PATHS.find(d => d.name === selectedDistrict)?.risk ?? 0}점 · {RISK_LABEL(SEOUL_PATHS.find(d => d.name === selectedDistrict)?.risk ?? 50)}
              </span>
            </div>
          )}
        </div>

        {/* Quick action */}
        <button
          onClick={() => onNav("shelter")}
          className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-sm"
          style={{ background: "#183153", color: "white", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "16px" }}
        >
          <Shield size={18} />
          가까운 무더위쉼터 찾기
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

