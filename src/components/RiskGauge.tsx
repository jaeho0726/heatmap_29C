import { RISK_COLOR } from "../utils/risk";

export default function RiskGauge({ score }: { score: number }) {
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
