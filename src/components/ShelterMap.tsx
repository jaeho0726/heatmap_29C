import type { Coordinates } from "../types";

interface ShelterMapProps {
  userLocation: Coordinates | null;
}

export default function ShelterMap({ userLocation }: ShelterMapProps) {
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
        {userLocation && (
          <>
            <circle cx="160" cy="100" r="12" fill="#183153" fillOpacity="0.15" />
            <circle cx="160" cy="100" r="6" fill="#183153" />
            <circle cx="160" cy="100" r="3" fill="white" />
          </>
        )}
        {/* Shelter markers */}
        {[[90, 72], [200, 55], [245, 105]].map(([sx, sy], i) => (
          <g key={i}>
            <circle cx={sx} cy={sy} r="10" fill={i === 0 ? "#4CAF50" : "#E8F5E9"} stroke="#4CAF50" strokeWidth="2" />
            <text x={sx} y={sy + 4} textAnchor="middle" fontSize="10" fill={i === 0 ? "white" : "#4CAF50"} fontWeight="700">S</text>
          </g>
        ))}
        {/* Distance lines */}
        {userLocation && (
          <line x1="160" y1="100" x2="90" y2="72" stroke="#4CAF50" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.6" />
        )}
      </svg>
      {/* Overlay labels */}
      {userLocation && (
        <div className="absolute bottom-2 left-2">
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#183153" }} />
            <span className="text-xs font-semibold" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>내 위치</span>
          </div>
        </div>
      )}
      <div className="absolute bottom-2 right-2">
        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full shadow-sm">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#4CAF50" }} />
          <span className="text-xs font-semibold" style={{ color: "#374151", fontFamily: "'Noto Sans KR', sans-serif" }}>쉼터</span>
        </div>
      </div>
    </div>
  );
}
