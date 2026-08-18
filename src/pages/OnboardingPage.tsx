import { useState } from "react";
import { ArrowLeft, ChevronRight, Flame, Info, MapPin } from "lucide-react";
import { AGE_GROUPS, DISTRICTS_BY_PROVINCE, PROVINCES } from "../data/onboarding";
import type { AgeGroup, ProvinceValue, UserSettings } from "../types";

type OnboardingStep = "age" | "location";

interface OnboardingPageProps {
  initialSettings: UserSettings;
  onComplete: (settings: UserSettings) => void;
}

export default function OnboardingPage({ initialSettings, onComplete }: OnboardingPageProps) {
  const [step, setStep] = useState<OnboardingStep>("age");
  const [age, setAge] = useState<AgeGroup>(initialSettings.ageGroup);
  const [province] = useState<ProvinceValue>(initialSettings.province);
  const [district, setDistrict] = useState(initialSettings.district);
  const [locOpen, setLocOpen] = useState(false);
  const selectedAgeIndex = AGE_GROUPS.findIndex((group) => group.value === age);
  const selectedAge = AGE_GROUPS[selectedAgeIndex];
  const selectedProvince = PROVINCES.find((item) => item.value === province) ?? PROVINCES[0];
  const districts = DISTRICTS_BY_PROVINCE[province];

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Hero */}
      <div className="flex flex-col items-center pt-8 pb-5 px-6" style={{ background: "#183153" }}>
        {/* Logo */}
        <div className="relative mb-2.5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: "rgba(255,255,255,0.12)" }}>
            <MapPin size={24} color="white" strokeWidth={2} />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#E53935" }}>
              <Flame size={11} color="white" strokeWidth={2.5} />
            </div>
          </div>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight mb-1" style={{ fontFamily: "Inter, sans-serif" }}>HeatMap</h1>
        <p className="text-center text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.75)", fontFamily: "'Noto Sans KR', sans-serif", maxWidth: 260 }}>
          AI 기반 폭염 위험 예측 및 맞춤형 대응 서비스
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 px-5 py-5 overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          {step === "location" ? (
            <button
              onClick={() => { setStep("age"); setLocOpen(false); }}
              className="flex items-center gap-1 text-sm font-bold"
              style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}
            >
              <ArrowLeft size={16} />
              이전
            </button>
          ) : (
            <span />
          )}
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "#EFF4FB", color: "#183153", fontFamily: "Inter, sans-serif" }}>
            {step === "age" ? "1 / 2" : "2 / 2"}
          </span>
        </div>

        {step === "age" ? (
          <div>
            <label className="block text-base font-bold mb-1" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>
              연령대를 선택해주세요
            </label>
            <p className="text-xs" style={{ color: "#6B7280", fontFamily: "'Noto Sans KR', sans-serif" }}>정확한 나이가 아닌 연령대 기준으로 안내합니다.</p>

            <div className="mt-8 rounded-2xl p-5" style={{ background: "#F5F7FA" }}>
              <div className="text-center mb-5">
                <div className="text-3xl font-black" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>{selectedAge.label}</div>
                <div className="text-xs mt-1" style={{ color: "#6B7280", fontFamily: "'Noto Sans KR', sans-serif" }}>{selectedAge.sub}</div>
              </div>
              <input
                type="range"
                min={0}
                max={AGE_GROUPS.length - 1}
                step={1}
                value={selectedAgeIndex}
                onChange={(event) => setAge(AGE_GROUPS[Number(event.target.value)].value)}
                aria-label="연령대 선택"
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#183153]"
                style={{ background: "#D1D5DB", touchAction: "pan-x" }}
              />
              <div className="grid grid-cols-9 mt-3">
                {AGE_GROUPS.map((group) => (
                  <span
                    key={group.value}
                    className="text-center"
                    style={{
                      color: age === group.value ? "#183153" : "#9CA3AF",
                      fontFamily: "'Noto Sans KR', sans-serif",
                      fontSize: "8px",
                      fontWeight: age === group.value ? 800 : 500,
                    }}
                  >
                    {group.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Location */}
            <div>
              <label className="block text-base font-bold mb-1" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>
                위험도 확인 지역
              </label>
              <p className="text-xs mb-4" style={{ color: "#6B7280", fontFamily: "'Noto Sans KR', sans-serif" }}>홈과 AI 위험 분석의 기준 지역입니다.</p>
              <div className="space-y-3">
                <div>
                  <span className="block text-xs font-semibold mb-1.5" style={{ color: "#6B7280", fontFamily: "'Noto Sans KR', sans-serif" }}>시·도</span>
                  <button
                    disabled
                    className="w-full flex items-center justify-between p-4 rounded-2xl border-2 cursor-not-allowed"
                    style={{ borderColor: "#E5E7EB", background: "#F5F7FA" }}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin size={16} color="#183153" />
                      <span style={{ color: "#111827", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "15px" }}>
                        {selectedProvince.label}
                      </span>
                    </div>
                  </button>
                </div>

                <div>
                  <span className="block text-xs font-semibold mb-1.5" style={{ color: "#6B7280", fontFamily: "'Noto Sans KR', sans-serif" }}>시·군·구</span>
                  <div className="relative">
                    <button
                      className="w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all"
                      style={{ borderColor: locOpen ? "#183153" : "#E5E7EB", background: "#F5F7FA" }}
                      onClick={() => setLocOpen(!locOpen)}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin size={16} color="#183153" />
                        <span style={{ color: district ? "#111827" : "#9CA3AF", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "15px" }}>
                          {district || "자치구 선택"}
                        </span>
                      </div>
                      <ChevronRight size={16} color="#9CA3AF" style={{ transform: locOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
                    </button>
                    {locOpen && (
                      <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
                        {districts.map((item) => (
                          <button
                            key={item}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                            style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", color: "#111827" }}
                            onClick={() => { setDistrict(item); setLocOpen(false); }}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
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
        )}
      </div>

      {/* CTA */}
      <div className="px-5 pb-8 pt-2">
        {step === "age" ? (
          <button
            onClick={() => setStep("location")}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all"
            style={{ background: "#183153", color: "white", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "17px" }}
          >
            다음
          </button>
        ) : (
          <button
            onClick={() => { if (district) onComplete({ ageGroup: age, province, district }); }}
            disabled={!district}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all"
            style={{
              background: district ? "#183153" : "#E5E7EB",
              color: district ? "white" : "#9CA3AF",
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: "17px",
            }}
          >
            HeatMap 시작하기
          </button>
        )}
      </div>
    </div>
  );
}
