import { useState } from "react";
import { Building, Clock, Navigation } from "lucide-react";
import ShelterMap from "../components/ShelterMap";
import { SHELTERS } from "../data/shelters";
import type { NavigateHandler } from "../types";

export default function ShelterPage({ onNav }: { onNav: NavigateHandler }) {
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

