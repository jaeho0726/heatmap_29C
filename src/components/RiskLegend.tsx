export default function RiskLegend() {
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
