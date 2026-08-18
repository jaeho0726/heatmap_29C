import { useState, useEffect, useRef } from "react";
import {
  MapPin, Thermometer, Wind, Droplets, AlertTriangle,
  Navigation, ChevronRight, Phone, Heart, Clock,
  ArrowLeft, Search, Star, CheckCircle, Info,
  Home, BarChart2, Map, Compass, BookOpen,
  Users, TreePine, Building, Flame, Moon,
  RefreshCw, Shield
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type Screen = "onboarding" | "home" | "analysis" | "shelter" | "nav" | "guide";
type AgeGroup = "youth" | "adult" | "senior" | "elderly";

// ─── Constants ───────────────────────────────────────────────────────────────

const RISK_COLOR = (score: number) => {
  if (score <= 25) return "#4CAF50";
  if (score <= 50) return "#FBC02D";
  if (score <= 75) return "#FB8C00";
  return "#E53935";
};

const RISK_BG = (score: number) => {
  if (score <= 25) return "#E8F5E9";
  if (score <= 50) return "#FFFDE7";
  if (score <= 75) return "#FFF3E0";
  return "#FFEBEE";
};

const RISK_LABEL = (score: number) => {
  if (score <= 25) return "안전";
  if (score <= 50) return "주의";
  if (score <= 75) return "위험";
  return "매우 위험";
};

// Seoul district SVG paths (approximate geographic boundaries, viewBox 0 0 460 440)
const SEOUL_PATHS = [
  { name: "노원구",   risk: 62, cx: 345, cy: 62,  d: "M308,22 L382,20 L410,52 L395,92 L365,112 L335,112 L306,102 L302,78 Z" },
  { name: "도봉구",   risk: 45, cx: 272, cy: 60,  d: "M245,22 L308,22 L302,78 L306,102 L278,106 L252,88 L242,62 Z" },
  { name: "강북구",   risk: 57, cx: 222, cy: 90,  d: "M182,50 L245,22 L242,62 L252,88 L278,106 L262,128 L232,133 L208,116 L188,92 Z" },
  { name: "은평구",   risk: 38, cx: 138, cy: 115, d: "M102,50 L182,50 L188,92 L190,128 L172,160 L138,165 L105,152 L90,128 L86,92 Z" },
  { name: "성북구",   risk: 49, cx: 255, cy: 140, d: "M208,116 L232,133 L262,128 L278,106 L306,102 L322,120 L320,150 L292,165 L265,170 L238,165 L218,153 L190,140 L190,128 Z" },
  { name: "중랑구",   risk: 71, cx: 362, cy: 155, d: "M320,150 L335,112 L365,112 L395,92 L410,128 L400,168 L374,184 L346,186 L320,180 L312,162 Z" },
  { name: "종로구",   risk: 91, cx: 190, cy: 190, d: "M138,165 L172,160 L190,140 L218,153 L232,170 L228,200 L216,220 L194,225 L172,220 L158,208 L148,185 Z" },
  { name: "서대문구", risk: 54, cx: 118, cy: 192, small: true, d: "M105,152 L138,165 L148,185 L148,220 L130,228 L110,222 L94,208 L94,178 Z" },
  { name: "동대문구", risk: 63, cx: 272, cy: 198, d: "M232,170 L265,170 L292,165 L312,182 L310,210 L288,226 L258,228 L232,218 L228,200 Z" },
  { name: "중구",     risk: 85, cx: 196, cy: 245, small: true, d: "M172,220 L194,225 L216,220 L228,235 L222,258 L202,264 L182,260 L168,248 L168,232 Z" },
  { name: "광진구",   risk: 74, cx: 350, cy: 235, d: "M310,210 L320,180 L346,186 L374,184 L400,205 L405,238 L390,268 L360,282 L330,284 L306,278 L286,268 L286,252 L306,242 L312,222 Z" },
  { name: "성동구",   risk: 66, cx: 268, cy: 256, d: "M232,218 L258,228 L288,226 L306,242 L306,270 L286,286 L258,290 L234,286 L226,272 L226,248 L232,235 Z" },
  { name: "마포구",   risk: 68, cx: 112, cy: 255, d: "M94,208 L110,222 L130,228 L148,238 L148,270 L140,296 L116,306 L90,298 L74,280 L70,256 L76,230 Z" },
  { name: "용산구",   risk: 78, cx: 198, cy: 280, d: "M168,248 L182,260 L202,264 L222,258 L236,272 L232,298 L212,308 L188,308 L168,298 L157,278 L157,258 Z" },
  // 한강 south
  { name: "강서구",   risk: 42, cx: 64,  cy: 308, d: "M52,280 L76,272 L90,280 L96,308 L90,332 L74,348 L50,345 L36,325 L36,298 Z" },
  { name: "양천구",   risk: 48, cx: 104, cy: 316, d: "M90,280 L116,287 L130,302 L128,332 L113,345 L93,342 L74,330 L74,308 L90,292 Z" },
  { name: "영등포구", risk: 72, cx: 154, cy: 330, d: "M140,296 L157,300 L170,308 L184,320 L180,346 L166,358 L146,360 L130,348 L130,325 L140,310 Z" },
  { name: "동작구",   risk: 59, cx: 185, cy: 345, d: "M157,308 L174,312 L188,310 L206,322 L203,352 L188,366 L168,368 L153,355 L147,335 L152,318 L164,310 Z" },
  { name: "구로구",   risk: 55, cx: 107, cy: 362, d: "M93,342 L113,345 L130,335 L147,347 L144,373 L126,383 L103,380 L80,366 L74,350 Z" },
  { name: "금천구",   risk: 47, cx: 138, cy: 400, small: true, d: "M126,380 L144,375 L158,380 L160,403 L146,416 L126,413 L110,403 L112,388 Z" },
  { name: "관악구",   risk: 69, cx: 183, cy: 395, d: "M146,360 L160,363 L172,368 L192,365 L207,376 L204,403 L187,416 L164,419 L143,412 L128,400 L128,382 L146,370 Z" },
  { name: "서초구",   risk: 32, cx: 222, cy: 375, d: "M206,322 L232,315 L258,312 L275,328 L280,358 L275,390 L257,406 L230,413 L206,406 L194,390 L192,368 L203,352 Z" },
  { name: "강남구",   risk: 41, cx: 318, cy: 340, d: "M286,286 L310,292 L338,290 L362,306 L368,340 L360,372 L338,384 L312,386 L290,376 L275,358 L276,328 L284,306 Z" },
  { name: "강동구",   risk: 60, cx: 420, cy: 268, d: "M405,238 L435,234 L456,256 L458,288 L448,314 L420,324 L398,312 L376,296 L380,266 L390,250 Z" },
  { name: "송파구",   risk: 53, cx: 395, cy: 348, d: "M376,296 L398,284 L422,286 L446,306 L450,340 L436,372 L410,388 L384,392 L358,384 L340,368 L340,340 L354,320 L370,308 Z" },
];

const AGE_GROUPS = [
  { id: "youth" as AgeGroup, label: "청소년", sub: "18세 미만", pastel: "#E8F5E9", accent: "#4CAF50" },
  { id: "adult" as AgeGroup, label: "성인", sub: "18-59세", pastel: "#FFFDE7", accent: "#F9A825" },
  { id: "senior" as AgeGroup, label: "고령자", sub: "60-74세", pastel: "#FFF3E0", accent: "#FB8C00" },
  { id: "elderly" as AgeGroup, label: "노인", sub: "75세 이상", pastel: "#FFEBEE", accent: "#E53935" },
];

const LOCATIONS = ["종로구", "중구", "용산구", "성동구", "광진구", "동대문구", "마포구", "강남구", "서초구", "송파구"];

const SHELTERS = [
  { id: 1, name: "종로구 무더위쉼터 (창신동 주민센터)", dist: "280m", time: "4분", type: "주민센터", open: "09:00–21:00", lat: 37.5742, lng: 127.0142 },
  { id: 2, name: "낙원상가 2층 실내쉼터", dist: "430m", time: "6분", type: "공공건물", open: "10:00–22:00", lat: 37.5721, lng: 126.9915 },
  { id: 3, name: "탑골공원 냉방 휴게소", dist: "510m", time: "8분", type: "공원시설", open: "08:00–20:00", lat: 37.5726, lng: 126.9893 },
];

const RISK_FACTORS = [
  { label: "체감온도", value: 35, icon: Thermometer, color: "#E53935", detail: "38.4°C" },
  { label: "연속 폭염일수", value: 22, icon: Flame, color: "#FB8C00", detail: "12일 연속" },
  { label: "야간 최저기온", value: 18, icon: Moon, color: "#FBC02D", detail: "27.8°C" },
  { label: "녹지율", value: 15, icon: TreePine, color: "#4CAF50", detail: "8.2% (낮음)" },
];

// ─── Circular Gauge ──────────────────────────────────────────────────────────

function RiskGauge({ score }: { score: number }) {
  const r = 72;
  const cx = 90;
  const cy = 90;
  const circumference = Math.PI * r;
  const progress = (score / 100) * circumference;
  const color = RISK_COLOR(score);

  return (
    <div className="flex flex-col items-center">
      <svg width={180} height={110} viewBox="0 0 180 110">
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={14}
          strokeLinecap="round"
        />
        {/* Progress */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          style={{ transition: "stroke-dasharray 1.2s ease" }}
        />
        {/* Risk labels */}
        <text x="12" y={cy + 18} fontSize="9" fill="#9CA3AF" fontFamily="'Noto Sans KR', sans-serif">안전</text>
        <text x="152" y={cy + 18} fontSize="9" fill="#9CA3AF" fontFamily="'Noto Sans KR', sans-serif">위험</text>
        {/* Score */}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="36" fontWeight="800" fill={color} fontFamily="Inter, sans-serif">{score}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="11" fill="#6B7280" fontFamily="'Noto Sans KR', sans-serif">/ 100점</text>
      </svg>
    </div>
  );
}

// ─── Seoul District Map ──────────────────────────────────────────────────────

function SeoulMap({
  onSelect,
  selected,
}: {
  onSelect: (name: string, risk: number) => void;
  selected: string;
}) {
  return (
    <div className="relative w-full" style={{ paddingBottom: "96%" }}>
      <svg viewBox="0 0 470 452" className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {/* Han River */}
        <path
          d="M36,310 C90,302 150,296 210,292 C270,288 330,285 390,280 L460,276 L460,296 C390,300 330,304 270,308 C210,312 148,318 90,326 L36,332 Z"
          fill="#BBDEFB"
          opacity="0.7"
        />
        {SEOUL_PATHS.map((d) => (
          <g key={d.name} onClick={() => onSelect(d.name, d.risk)} style={{ cursor: "pointer" }}>
            <path
              d={d.d}
              fill={RISK_COLOR(d.risk)}
              fillOpacity={selected === d.name ? 1 : 0.75}
              stroke="white"
              strokeWidth={selected === d.name ? 1.5 : 0.6}
              style={{ transition: "fill-opacity 0.15s" }}
            />
            {!d.small && (
              <text
                x={d.cx}
                y={d.cy + 4}
                textAnchor="middle"
                fontSize="8.5"
                fill="white"
                fontWeight="700"
                fontFamily="'Noto Sans KR', sans-serif"
                style={{ pointerEvents: "none", textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}
              >
                {d.name.replace("구", "")}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─── Risk Legend ──────────────────────────────────────────────────────────────

function RiskLegend() {
  const items = [
    { label: "안전", color: "#4CAF50" },
    { label: "주의", color: "#FBC02D" },
    { label: "위험", color: "#FB8C00" },
    { label: "매우 위험", color: "#E53935" },
  ];
  return (
    <div className="flex gap-3 flex-wrap">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
          <span className="text-xs text-gray-500">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────

function BottomNav({
  current,
  onNav,
}: {
  current: Screen;
  onNav: (s: Screen) => void;
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

// ─── Screens ──────────────────────────────────────────────────────────────────

function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
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

// ─── Home Dashboard ───────────────────────────────────────────────────────────

function HomeScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const score = 91;
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
                  <div className="h-1.5 rounded-full" style={{ background: "#F3F4F6" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${f.value * 4}%`, background: f.color }} />
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

// ─── Risk Analysis ─────────────────────────────────────────────────────────────

function AnalysisScreen() {
  const score = 91;
  const contributions = [
    { label: "체감온도", pct: 35, icon: Thermometer, color: "#E53935", detail: "38.4°C — 임계점 초과" },
    { label: "연속 폭염일수", pct: 22, icon: Flame, color: "#FB8C00", detail: "12일 연속 폭염특보" },
    { label: "야간 최저기온", pct: 18, icon: Moon, color: "#FBC02D", detail: "27.8°C — 열대야 지속" },
    { label: "녹지율 부족", pct: 15, icon: TreePine, color: "#4CAF50", detail: "구 평균 8.2% — 시 평균 이하" },
    { label: "인구밀도", pct: 10, icon: Building, color: "#6B7280", detail: "17,532명/㎢ — 고밀도 지역" },
  ];

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
            {contributions.map((c) => (
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
            {[62, 68, 71, 78, 85, 91, 94, 91, 88, 82, 74, 66].map((v, i) => (
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

// ─── Shelter Map ───────────────────────────────────────────────────────────────

function ShelterMap() {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden" style={{ height: 200, background: "#E8F0F7" }}>
      {/* Simplified map background */}
      <svg width="100%" height="100%" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
        {/* Roads */}
        <line x1="0" y1="100" x2="320" y2="100" stroke="#D1D5DB" strokeWidth="6" />
        <line x1="160" y1="0" x2="160" y2="200" stroke="#D1D5DB" strokeWidth="6" />
        <line x1="0" y1="60" x2="320" y2="60" stroke="#E5E7EB" strokeWidth="3" />
        <line x1="0" y1="145" x2="320" y2="145" stroke="#E5E7EB" strokeWidth="3" />
        <line x1="80" y1="0" x2="80" y2="200" stroke="#E5E7EB" strokeWidth="3" />
        <line x1="240" y1="0" x2="240" y2="200" stroke="#E5E7EB" strokeWidth="3" />
        {/* Buildings */}
        {[[20,30,30,20],[110,30,40,25],[210,30,30,20],[260,70,35,25],
          [20,115,40,20],[100,115,30,25],[220,115,35,20],[270,120,25,20],
          [20,160,35,25],[120,160,40,20],[200,165,30,20]].map(([x,y,w,h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} rx={2} fill={i % 3 === 0 ? "#CBD5E1" : "#D1D9E6"} />
        ))}
        {/* User location */}
        <circle cx="160" cy="100" r="12" fill="#183153" fillOpacity="0.15" />
        <circle cx="160" cy="100" r="6" fill="#183153" />
        <circle cx="160" cy="100" r="3" fill="white" />
        {/* Shelter markers */}
        {[[90, 72], [200, 55], [245, 105]].map(([sx, sy], i) => (
          <g key={i}>
            <circle cx={sx} cy={sy} r="10" fill={i === 0 ? "#4CAF50" : "#E8F5E9"} stroke="#4CAF50" strokeWidth="2" />
            <text x={sx} y={sy + 4} textAnchor="middle" fontSize="10" fill={i === 0 ? "white" : "#4CAF50"} fontWeight="700">S</text>
          </g>
        ))}
        {/* Distance lines */}
        <line x1="160" y1="100" x2="90" y2="72" stroke="#4CAF50" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.6" />
      </svg>
      {/* Overlay labels */}
      <div className="absolute bottom-2 left-2">
        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full shadow-sm">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#183153" }} />
          <span className="text-xs font-semibold" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>내 위치</span>
        </div>
      </div>
      <div className="absolute bottom-2 right-2">
        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full shadow-sm">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#4CAF50" }} />
          <span className="text-xs font-semibold" style={{ color: "#374151", fontFamily: "'Noto Sans KR', sans-serif" }}>쉼터</span>
        </div>
      </div>
    </div>
  );
}

function ShelterScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const [selected, setSelected] = useState(0);

  return (
    <div className="flex flex-col bg-gray-50 pb-4">
      <div className="px-5 pt-12 pb-5" style={{ background: "#183153" }}>
        <h1
  className="text-xl font-black mb-1"
  style={{
    color: "white",
    fontFamily: "'Noto Sans KR', sans-serif",
    fontWeight: 900,
    textAlign: "left",
  }}
>
  무더위쉼터 안내
</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)", fontFamily: "'Noto Sans KR', sans-serif" }}>서울시 종로구 인근 쉼터 3개소 검색됨</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Map */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border" style={{ borderColor: "#F3F4F6" }}>
          <ShelterMap />
        </div>

        {/* Shelter list */}
        <div className="space-y-3">
          {SHELTERS.map((s, i) => (
            <div
              key={s.id}
              onClick={() => setSelected(i)}
              className="w-full text-left rounded-2xl p-4 border-2 bg-white shadow-sm transition-all cursor-pointer"
              style={{ borderColor: selected === i ? "#183153" : "#F3F4F6" }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm"
                  style={{
                    background: selected === i ? "#183153" : "#F5F7FA",
                    color: selected === i ? "white" : "#183153",
                    fontFamily: "Inter, sans-serif"
                  }}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-bold leading-tight" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>{s.name}</span>
                    {i === 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "#E8F5E9", color: "#2E7D32", fontFamily: "'Noto Sans KR', sans-serif" }}>
                        가장 가까운
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <Navigation size={12} color="#6B7280" />
                      <span className="text-xs font-semibold" style={{ color: "#374151", fontFamily: "Inter, sans-serif" }}>{s.dist}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={12} color="#6B7280" />
                      <span className="text-xs" style={{ color: "#6B7280", fontFamily: "'Noto Sans KR', sans-serif" }}>도보 {s.time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Building size={12} color="#6B7280" />
                      <span className="text-xs" style={{ color: "#6B7280", fontFamily: "'Noto Sans KR', sans-serif" }}>{s.type}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#4CAF50" }} />
                    <span className="text-xs" style={{ color: "#6B7280", fontFamily: "'Noto Sans KR', sans-serif" }}>운영 중 · {s.open}</span>
                  </div>
                </div>
              </div>
              {selected === i && (
                <button
                  onClick={(e) => { e.stopPropagation(); onNav("nav"); }}
                  className="w-full mt-3 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{ background: "#183153", color: "white", fontFamily: "'Noto Sans KR', sans-serif" }}
                >
                  <Navigation size={15} />
                  길찾기 시작
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Navigation Screen ────────────────────────────────────────────────────────

function NavScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    { dir: "직진", icon: "↑", detail: "50m — 창신길 따라 직진" },
    { dir: "우회전", icon: "→", detail: "80m — 종로 방면 우회전" },
    { dir: "좌회전", icon: "←", detail: "150m — 창신동 주민센터 방향" },
    { dir: "도착", icon: "📍", detail: "종로구 무더위쉼터 (창신동 주민센터)" },
  ];

  return (
    <div className="flex flex-col bg-gray-50 pb-4">
      <div className="px-5 pt-12 pb-5" style={{ background: "#183153" }}>
        <h1 className="text-xl font-black text-white mb-1" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>길찾기</h1>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex-1 rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.12)" }}>
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
                  {steps[step].icon}
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>{steps[step].dir}</div>
                  <div className="text-xs" style={{ color: "#6B7280", fontFamily: "'Noto Sans KR', sans-serif" }}>{steps[step].detail}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step-by-step */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border" style={{ borderColor: "#F3F4F6" }}>
          <h2 className="text-sm font-bold mb-3" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>경로 안내</h2>
          <div className="space-y-2">
            {steps.map((s, i) => (
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

// ─── AI Guide ─────────────────────────────────────────────────────────────────

function GuideScreen() {
  const score = 91;
  const actions = [
    { icon: "💧", title: "물 자주 마시기", sub: "30분마다 200ml 이상 섭취하세요", priority: "high", color: "#1E88E5" },
    { icon: "🏠", title: "야외활동 자제", sub: "오후 12시–16시 외출을 피하세요", priority: "high", color: "#E53935" },
    { icon: "❄️", title: "무더위쉼터 이용", sub: "인근 쉼터를 적극 활용하세요", priority: "high", color: "#4CAF50" },
    { icon: "⏰", title: "오후 외출 자제", sub: "외출 시 아침 10시 이전을 권장합니다", priority: "medium", color: "#FB8C00" },
    { icon: "👕", title: "얇고 밝은 옷 착용", sub: "통풍이 잘 되는 면 소재를 입으세요", priority: "medium", color: "#9C27B0" },
    { icon: "📱", title: "가족·이웃 안부 확인", sub: "홀로 계신 어르신에게 연락하세요", priority: "medium", color: "#183153" },
  ];

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
          {actions.map((a, i) => (
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
          {["어지럼증 또는 두통", "과도한 발한 또는 무한증", "근육 경련 발생", "의식 혼탁 또는 구역감"].map((tip, i) => (
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

// ─── App Shell ────────────────────────────────────────────────────────────────

const HOME_SCORE = 91;

export default function App() {
  const [screen, setScreen] = useState<Screen>("onboarding");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [screen]);

  const renderScreen = () => {
    switch (screen) {
      case "onboarding": return <OnboardingScreen onComplete={() => setScreen("home")} />;
      case "home": return <HomeScreen onNav={setScreen} />;
      case "analysis": return <AnalysisScreen />;
      case "shelter": return <ShelterScreen onNav={setScreen} />;
      case "nav": return <NavScreen onNav={setScreen} />;
      case "guide": return <GuideScreen />;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-200 p-4" style={{ fontFamily: "'Noto Sans KR', Inter, sans-serif", background: "#CBD5E1" }}>
      {/* Phone frame */}
      <div
        className="relative flex flex-col overflow-hidden shadow-2xl"
        style={{
          width: "min(390px, 100vw)",
          height: "min(844px, 100vh)",
          borderRadius: "44px",
          border: "12px solid #1a1a1a",
          background: "#ffffff",
        }}
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-6 py-2 flex-shrink-0 z-10" style={{ background: screen === "home" ? RISK_COLOR(HOME_SCORE) : "#183153" }}>
          <span className="text-xs font-bold text-white" style={{ fontFamily: "Inter, sans-serif" }}>9:41</span>
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5 items-end">
              {[3, 4, 5, 6].map(h => <div key={h} className="w-1 rounded-sm bg-white" style={{ height: h }} />)}
            </div>
            <div className="w-4 h-2.5 rounded-sm border border-white ml-1">
              <div className="w-3/4 h-full rounded-sm bg-white" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {renderScreen()}
        </div>

        {/* Bottom nav (hidden on onboarding) */}
        {screen !== "onboarding" && (
          <div className="flex-shrink-0" style={{ background: "white" }}>
            <BottomNav current={screen} onNav={setScreen} />
            <div style={{ height: 8 }} />
          </div>
        )}

        {/* Home indicator */}
        <div className="flex justify-center pb-2 flex-shrink-0" style={{ background: "white" }}>
          <div className="w-28 h-1 rounded-full bg-gray-300" />
        </div>
      </div>
    </div>
  );
}