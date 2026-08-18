import { useState } from "react";
import { CheckCircle, Heart, LoaderCircle, MapPin, Phone, RefreshCw } from "lucide-react";
import { NAVIGATION_STEPS } from "../data/navigation";
import type { Coordinates, NavigateHandler } from "../types";

interface NavigationPageProps {
  onNav: NavigateHandler;
  userLocation: Coordinates | null;
  locationLoading: boolean;
  locationError: string | null;
  onRequestLocation: () => void;
}

export default function NavigationPage({
  onNav,
  userLocation,
  locationLoading,
  locationError,
  onRequestLocation,
}: NavigationPageProps) {
  const [step, setStep] = useState(0);

  return (
    <div className="flex flex-col bg-gray-50 pb-4">
      <div className="px-5 pt-12 pb-5" style={{ background: "#183153" }}>
        <h1 className="text-xl font-black text-white mb-1" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>길찾기</h1>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex-1 rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.12)" }}>
            <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.55)", fontFamily: "'Noto Sans KR', sans-serif" }}>출발지 · 현재 위치</div>
            <div className="text-xs mb-0.5" style={{ color: "rgba(255,255,255,0.55)", fontFamily: "'Noto Sans KR', sans-serif" }}>목적지</div>
            <div className="text-sm font-bold text-white" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>창신동 주민센터 쉼터</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-white" style={{ fontFamily: "Inter, sans-serif" }}>280</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'Noto Sans KR', sans-serif" }}>m</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-white" style={{ fontFamily: "Inter, sans-serif" }}>4</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'Noto Sans KR', sans-serif" }}>분</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {!userLocation && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border text-center" style={{ borderColor: "#F3F4F6" }}>
            {locationLoading ? (
              <div className="flex items-center justify-center gap-2 py-3">
                <LoaderCircle size={18} color="#183153" className="animate-spin" />
                <span className="text-sm font-bold" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>현재 위치 확인 중...</span>
              </div>
            ) : (
              <>
                <MapPin size={24} color={locationError ? "#E53935" : "#183153"} className="mx-auto mb-2" />
                <p className="text-sm font-bold" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>길찾기를 사용하려면 현재 위치 권한이 필요합니다.</p>
                {locationError && (
                  <p className="text-xs mt-1" style={{ color: "#6B7280", fontFamily: "'Noto Sans KR', sans-serif" }}>{locationError}</p>
                )}
                <button
                  onClick={onRequestLocation}
                  className="mt-4 px-5 py-2.5 rounded-xl font-bold text-sm"
                  style={{ background: "#183153", color: "white", fontFamily: "'Noto Sans KR', sans-serif" }}
                >
                  {locationError ? "다시 시도" : "현재 위치 확인"}
                </button>
              </>
            )}
          </div>
        )}

        {userLocation && (
          <>
        {/* Route map */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border" style={{ borderColor: "#F3F4F6" }}>
          <div className="relative" style={{ height: 220, background: "#EBF0F7" }}>
            <svg width="100%" height="100%" viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg">
              {/* Grid streets */}
              <line x1="0" y1="80" x2="320" y2="80" stroke="#D1D5DB" strokeWidth="5" />
              <line x1="0" y1="150" x2="320" y2="150" stroke="#D1D5DB" strokeWidth="5" />
              <line x1="100" y1="0" x2="100" y2="220" stroke="#D1D5DB" strokeWidth="5" />
              <line x1="220" y1="0" x2="220" y2="220" stroke="#D1D5DB" strokeWidth="5" />
              <line x1="0" y1="40" x2="320" y2="40" stroke="#E5E7EB" strokeWidth="2" />
              <line x1="0" y1="120" x2="320" y2="120" stroke="#E5E7EB" strokeWidth="2" />
              <line x1="0" y1="190" x2="320" y2="190" stroke="#E5E7EB" strokeWidth="2" />
              <line x1="50" y1="0" x2="50" y2="220" stroke="#E5E7EB" strokeWidth="2" />
              <line x1="160" y1="0" x2="160" y2="220" stroke="#E5E7EB" strokeWidth="2" />
              <line x1="280" y1="0" x2="280" y2="220" stroke="#E5E7EB" strokeWidth="2" />
              {/* Route path */}
              <polyline
                points="220,190 220,150 100,150 100,80"
                fill="none"
                stroke="#183153"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="8,4"
              />
              {/* Start */}
              <circle cx="220" cy="190" r="10" fill="#183153" />
              <circle cx="220" cy="190" r="5" fill="white" />
              {/* End (shelter) */}
              <circle cx="100" cy="80" r="14" fill="#4CAF50" />
              <text x="100" y="84" textAnchor="middle" fontSize="12" fill="white" fontWeight="700">S</text>
              {/* Direction indicator */}
              <circle cx={step < 2 ? 220 : step < 3 ? 100 : 100} cy={step === 0 ? 165 : step === 1 ? 150 : step === 2 ? 110 : 80} r="7" fill="#FBC02D" stroke="white" strokeWidth="2" />
            </svg>
            {/* Current step overlay */}
            <div className="absolute top-3 left-3 right-3">
              <div className="bg-white rounded-xl px-3 py-2.5 shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: "#EFF4FB" }}>
                  {NAVIGATION_STEPS[step].icon}
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>{NAVIGATION_STEPS[step].dir}</div>
                  <div className="text-xs" style={{ color: "#6B7280", fontFamily: "'Noto Sans KR', sans-serif" }}>{NAVIGATION_STEPS[step].detail}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step-by-step */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border" style={{ borderColor: "#F3F4F6" }}>
          <h2 className="text-sm font-bold mb-3" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>경로 안내</h2>
          <div className="space-y-2">
            {NAVIGATION_STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors text-left"
                style={{ background: step === i ? "#EFF4FB" : "transparent" }}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ background: step === i ? "#183153" : "#F5F7FA" }}>
                  <span style={{ filter: "none" }}>{s.icon}</span>
                </div>
                <span className="text-sm" style={{ color: "#374151", fontFamily: "'Noto Sans KR', sans-serif" }}>{s.detail}</span>
                {i < step && <CheckCircle size={15} color="#4CAF50" className="ml-auto flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
          </>
        )}

        {/* Emergency button */}
        <button
          onClick={() => onNav("shelter")}
          className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 border-2"
          style={{ borderColor: "#E53935", color: "#E53935", background: "#FFEBEE", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "15px" }}
        >
          <RefreshCw size={17} />
          가장 가까운 쉼터 재검색
        </button>

        {/* Emergency call */}
        <div className="flex gap-3">
          <button className="flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-1.5" style={{ background: "#183153", color: "white", fontFamily: "'Noto Sans KR', sans-serif" }}>
            <Phone size={15} />
            119 응급 신고
          </button>
          <button className="flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-1.5" style={{ background: "#F5F7FA", color: "#374151", fontFamily: "'Noto Sans KR', sans-serif" }}>
            <Heart size={15} color="#E53935" />
            건강 정보 확인
          </button>
        </div>
      </div>
    </div>
  );
}
