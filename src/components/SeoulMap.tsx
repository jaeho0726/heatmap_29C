import { SEOUL_PATHS } from "../data/seoulDistricts";
import { RISK_COLOR } from "../utils/risk";

export default function SeoulMap({
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
