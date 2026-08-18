import { useState, useEffect, useRef } from "react";
import {
  MapPin, Thermometer, Wind, Droplets, AlertTriangle,
  Navigation, ChevronRight, Phone, Heart, Clock,
  ArrowLeft, Search, Star, CheckCircle, Info,
  Home, BarChart2, Map, BookOpen,
  Users, TreePine, Building, Flame, Moon,
  RefreshCw, Shield, Plus, Minus
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type Screen = "onboarding" | "home" | "analysis" | "shelter" | "nav" | "guide";
type AgeGroup = "0-9" | "10-19" | "20-29" | "30-39" | "40-49" | "50-59" | "60-69" | "70-79" | "80+";

type RiskApiResponse = {
  age: number;
  location: {
    lat: number;
    lon: number;
    district: string | null;
  };
  weather: {
    temperature?: number;
    humidity?: number;
    max_temperature?: number;
    wind_speed?: number;
    rainfall?: number;
    green_ratio?: number;
  };
  risk: {
    score: number;
    level: string;
    age_group?: string;
    age_factor?: number;
    predicted_patient_count?: number;
  };
  shelter?: {
    name: string;
    address: string;
    lat: number;
    lon: number;
    distance_km: number;
  } | null;
  shelters?: Array<{
    name: string;
    address: string;
    lat: number;
    lon: number;
    distance_km: number;
  }>;
};

type DistrictHeatData = {
  name: string;
  lat: number;
  lon: number;
  temperature: number;
  humidity: number;
  wind_speed: number;
  rainfall: number;
  green_ratio: number;
  predicted_patient_count: number;
  score: number;
  level: string;
};

type SeoulGeoFeature = {
  type: "Feature";
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
  properties: {
    SIG_KOR_NM?: string;
    name?: string;
  };
};

type SeoulGeoJson = {
  type: "FeatureCollection";
  features: SeoulGeoFeature[];
};

type ForecastRiskData = {
  date: string;
  time: string;
  temperature: number;
  humidity: number;
  wind_speed: number;
  rainfall: number;
  max_temperature: number;
  green_ratio: number;
  predicted_patient_count: number;
  score: number;
  level: string;
};

type SelectedShelter = {
  id: number;
  name: string;
  address?: string;
  lat?: number;
  lon?: number;
  dist: string;
  time: string;
  type: string;
  open: string;
};

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

const DEMO_JONGNO_LOCATION = {
  lat: 37.5729,
  lon: 126.9794,
};

const SEOUL_GEOJSON_URLS = [
  "/seoul_municipalities_geo_simple.json",
];

function isInSeoul(lat: number, lon: number) {
  return lat >= 37.4 && lat <= 37.7 && lon >= 126.75 && lon <= 127.2;
}

async function fetchRisk(age: number, lat: number, lon: number): Promise<RiskApiResponse> {
  const response = await fetch("http://127.0.0.1:8000/api/risk", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      age,
      lat,
      lon,
    }),
  });

  if (!response.ok) {
    throw new Error("위험도 조회 실패");
  }

  return await response.json();
}

async function fetchSeoulHeatmap(age: number): Promise<DistrictHeatData[]> {
  const response = await fetch(`http://127.0.0.1:8000/api/seoul-heatmap?age=${age}`);

  if (!response.ok) {
    throw new Error("서울 폭염 현황 조회 실패");
  }

  const data = await response.json();
  return data.districts ?? [];
}

async function fetchForecastRisk(age: number, lat: number, lon: number, district: string | null): Promise<ForecastRiskData[]> {
  const params = new URLSearchParams({
    age: String(age),
    lat: String(lat),
    lon: String(lon),
  });

  if (district) {
    params.set("district", district);
  }

  const response = await fetch(`http://127.0.0.1:8000/api/forecast-risk?${params.toString()}`);

  if (!response.ok) {
    throw new Error("시간대별 예보 위험도 조회 실패");
  }

  const data = await response.json();
  return data.forecasts ?? [];
}

function ageGroupToAge(ageGroup: AgeGroup) {
  if (ageGroup === "0-9") return 5;
  if (ageGroup === "10-19") return 15;
  if (ageGroup === "20-29") return 25;
  if (ageGroup === "30-39") return 35;
  if (ageGroup === "40-49") return 45;
  if (ageGroup === "50-59") return 55;
  if (ageGroup === "60-69") return 65;
  if (ageGroup === "70-79") return 75;
  return 85;
}

function getAgeGroup(age: number) {
  if (age >= 80) return "80+";
  const start = Math.floor(age / 10) * 10;
  return `${start}-${start + 9}`;
}

// Seoul district SVG paths with approximate district-size proportions.
const SEOUL_PATHS = [
  { name: "노원구",   risk: 62, cx: 345, cy: 62,  d: "M308,22 L382,20 L410,52 L395,92 L365,112 L335,112 L306,102 L302,78 Z" },
  { name: "도봉구",   risk: 45, cx: 272, cy: 60,  d: "M245,22 L308,22 L302,78 L306,102 L278,106 L252,88 L242,62 Z" },
  { name: "강북구",   risk: 57, cx: 222, cy: 90,  d: "M182,50 L245,22 L242,62 L252,88 L278,106 L262,128 L232,133 L208,116 L188,92 Z" },
  { name: "은평구",   risk: 38, cx: 138, cy: 115, d: "M102,50 L182,50 L188,92 L190,128 L172,160 L138,165 L105,152 L90,128 L86,92 Z" },
  { name: "성북구",   risk: 49, cx: 255, cy: 140, d: "M208,116 L232,133 L262,128 L278,106 L306,102 L322,120 L320,150 L292,165 L265,170 L238,165 L218,153 L190,140 L190,128 Z" },
  { name: "중랑구",   risk: 71, cx: 362, cy: 155, d: "M320,150 L335,112 L365,112 L395,92 L410,128 L400,168 L374,184 L346,186 L320,180 L312,162 Z" },
  { name: "종로구",   risk: 91, cx: 190, cy: 190, d: "M138,165 L172,160 L190,140 L218,153 L232,170 L228,200 L216,220 L194,225 L172,220 L158,208 L148,185 Z" },
  { name: "서대문구", risk: 54, cx: 118, cy: 192, d: "M105,152 L138,165 L148,185 L148,220 L130,228 L110,222 L94,208 L94,178 Z" },
  { name: "동대문구", risk: 63, cx: 272, cy: 198, d: "M232,170 L265,170 L292,165 L312,182 L310,210 L288,226 L258,228 L232,218 L228,200 Z" },
  { name: "중구",     risk: 85, cx: 196, cy: 245, d: "M172,220 L194,225 L216,220 L228,235 L222,258 L202,264 L182,260 L168,248 L168,232 Z" },
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
  { name: "금천구",   risk: 47, cx: 138, cy: 400, d: "M126,380 L144,375 L158,380 L160,403 L146,416 L126,413 L110,403 L112,388 Z" },
  { name: "관악구",   risk: 69, cx: 183, cy: 395, d: "M146,360 L160,363 L172,368 L192,365 L207,376 L204,403 L187,416 L164,419 L143,412 L128,400 L128,382 L146,370 Z" },
  { name: "서초구",   risk: 32, cx: 222, cy: 375, d: "M206,322 L232,315 L258,312 L275,328 L280,358 L275,390 L257,406 L230,413 L206,406 L194,390 L192,368 L203,352 Z" },
  { name: "강남구",   risk: 41, cx: 318, cy: 340, d: "M286,286 L310,292 L338,290 L362,306 L368,340 L360,372 L338,384 L312,386 L290,376 L275,358 L276,328 L284,306 Z" },
  { name: "강동구",   risk: 60, cx: 420, cy: 268, d: "M405,238 L435,234 L456,256 L458,288 L448,314 L420,324 L398,312 L376,296 L380,266 L390,250 Z" },
  { name: "송파구",   risk: 53, cx: 395, cy: 348, d: "M376,296 L398,284 L422,286 L446,306 L450,340 L436,372 L410,388 L384,392 L358,384 L340,368 L340,340 L354,320 L370,308 Z" },
];

const AGE_GROUPS = [
  { id: "0-9" as AgeGroup, label: "0대", sub: "0-9세", pastel: "#E8F5E9", accent: "#4CAF50" },
  { id: "10-19" as AgeGroup, label: "10대", sub: "10-19세", pastel: "#E8F5E9", accent: "#4CAF50" },
  { id: "20-29" as AgeGroup, label: "20대", sub: "20-29세", pastel: "#FFFDE7", accent: "#F9A825" },
  { id: "30-39" as AgeGroup, label: "30대", sub: "30-39세", pastel: "#FFFDE7", accent: "#F9A825" },
  { id: "40-49" as AgeGroup, label: "40대", sub: "40-49세", pastel: "#FFF3E0", accent: "#FB8C00" },
  { id: "50-59" as AgeGroup, label: "50대", sub: "50-59세", pastel: "#FFF3E0", accent: "#FB8C00" },
  { id: "60-69" as AgeGroup, label: "60대", sub: "60-69세", pastel: "#FFEBEE", accent: "#E53935" },
  { id: "70-79" as AgeGroup, label: "70대", sub: "70-79세", pastel: "#FFEBEE", accent: "#E53935" },
  { id: "80+" as AgeGroup, label: "80대 이상", sub: "80세 이상", pastel: "#FFEBEE", accent: "#B91C1C" },
];

const SHELTERS = [
  { id: 1, name: "종로구 무더위쉼터 (창신동 주민센터)", dist: "280m", time: "4분", type: "주민센터", open: "09:00–21:00", lat: 37.5742, lng: 127.0142 },
  { id: 2, name: "낙원상가 2층 실내쉼터", dist: "430m", time: "6분", type: "공공건물", open: "10:00–22:00", lat: 37.5721, lng: 126.9915 },
  { id: 3, name: "탑골공원 냉방 휴게소", dist: "510m", time: "8분", type: "공원시설", open: "08:00–20:00", lat: 37.5726, lng: 126.9893 },
];

function calculateHeatIndex(temperature: number, humidity: number) {
  if (temperature < 27) {
    return temperature;
  }

  return temperature + (humidity - 40) * 0.08;
}

function getGreenRatioLabel(greenRatio: number) {
  const percent = greenRatio <= 1 ? greenRatio * 100 : greenRatio;

  if (percent >= 20) return `${percent.toFixed(1)}% (높음)`;
  if (percent >= 10) return `${percent.toFixed(1)}% (보통)`;
  return `${percent.toFixed(1)}% (낮음)`;
}

function clampPercent(value: number) {
  return Math.min(Math.max(value, 0), 100);
}

function getTodayLabel() {
  const today = new Date();
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}.${month}.${day} ${weekdays[today.getDay()]}요일`;
}

function getHeatAlertLabel(score: number, feelsLikeTemperature: number) {
  if (score >= 80 || feelsLikeTemperature >= 35) return "폭염 위험 매우 높음";
  if (score >= 60 || feelsLikeTemperature >= 33) return "폭염 위험 높음";
  if (score >= 40 || feelsLikeTemperature >= 30) return "폭염 주의";
  return "폭염 위험 낮음";
}

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

function getFeatureName(feature: SeoulGeoFeature) {
  return feature.properties.SIG_KOR_NM ?? feature.properties.name ?? "";
}

function getFeaturePolygons(feature: SeoulGeoFeature) {
  if (feature.geometry.type === "Polygon") {
    return feature.geometry.coordinates as number[][][];
  }

  return (feature.geometry.coordinates as number[][][][]).flat();
}

function getGeoBounds(features: SeoulGeoFeature[]) {
  const points = features.flatMap((feature) =>
    getFeaturePolygons(feature).flatMap((ring) => ring.map(([lon, lat]) => ({ lon, lat })))
  );
  const lons = points.map((point) => point.lon);
  const lats = points.map((point) => point.lat);

  return {
    minLon: Math.min(...lons),
    maxLon: Math.max(...lons),
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
  };
}

function createProjector(bounds: ReturnType<typeof getGeoBounds>) {
  const width = 460;
  const height = 420;
  const padding = 14;

  return ([lon, lat]: number[]) => {
    const x = padding + ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * (width - padding * 2);
    const y = padding + ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * (height - padding * 2);

    return [x, y];
  };
}

function featureToPath(feature: SeoulGeoFeature, project: (point: number[]) => number[]) {
  return getFeaturePolygons(feature)
    .map((ring) =>
      ring
        .map((point, index) => {
          const [x, y] = project(point);
          return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(" ") + " Z"
    )
    .join(" ");
}

function featureLabelPoint(feature: SeoulGeoFeature, project: (point: number[]) => number[]) {
  const ring = getFeaturePolygons(feature)
    .map((polygonRing) => ({
      ring: polygonRing,
      area: Math.abs(
        polygonRing.reduce((sum, [lon, lat], index) => {
          const [nextLon, nextLat] = polygonRing[(index + 1) % polygonRing.length];
          return sum + lon * nextLat - nextLon * lat;
        }, 0)
      ),
    }))
    .sort((a, b) => b.area - a.area)[0]?.ring ?? getFeaturePolygons(feature).flat();

  let doubleArea = 0;
  let centerLon = 0;
  let centerLat = 0;

  ring.forEach(([lon, lat], index) => {
    const [nextLon, nextLat] = ring[(index + 1) % ring.length];
    const cross = lon * nextLat - nextLon * lat;

    doubleArea += cross;
    centerLon += (lon + nextLon) * cross;
    centerLat += (lat + nextLat) * cross;
  });

  if (Math.abs(doubleArea) > 0.0000001) {
    centerLon = centerLon / (3 * doubleArea);
    centerLat = centerLat / (3 * doubleArea);
  } else {
    centerLon = ring.reduce((sum, [lon]) => sum + lon, 0) / ring.length;
    centerLat = ring.reduce((sum, [, lat]) => sum + lat, 0) / ring.length;
  }

  return project([centerLon, centerLat]);
}

async function fetchSeoulGeoJson() {
  for (const url of SEOUL_GEOJSON_URLS) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return response.json() as Promise<SeoulGeoJson>;
      }
    } catch {
      // Try the next source.
    }
  }

  throw new Error("서울 행정경계 데이터를 불러오지 못했습니다.");
}

function SeoulMap({
  onSelect,
  selected,
  heatmapData,
  zoom,
}: {
  onSelect: (name: string) => void;
  selected: string;
  heatmapData: DistrictHeatData[];
  zoom: number;
}) {
  const dataByDistrict = new globalThis.Map(heatmapData.map((item) => [item.name, item]));
  const [geoFeatures, setGeoFeatures] = useState<SeoulGeoFeature[]>([]);
  const [geoLoadFailed, setGeoLoadFailed] = useState(false);
  const bounds = geoFeatures.length ? getGeoBounds(geoFeatures) : null;
  const project = bounds ? createProjector(bounds) : null;

  useEffect(() => {
    let canceled = false;

    fetchSeoulGeoJson()
      .then((data) => {
        if (!canceled) {
          setGeoFeatures(data.features);
        }
      })
      .catch((error) => {
        console.error("서울 행정경계 로드 실패:", error);
        if (!canceled) {
          setGeoLoadFailed(true);
        }
      });

    return () => {
      canceled = true;
    };
  }, []);

  if (geoFeatures.length && project) {
    return (
      <div className="relative w-full overflow-hidden rounded-2xl" style={{ paddingBottom: "94%", background: "#EEF4FA" }}>
        <svg viewBox="0 0 460 420" className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <g
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "230px 210px",
              transition: "transform 0.2s ease",
            }}
          >
            {geoFeatures.map((feature) => {
              const name = getFeatureName(feature);
              const districtData = dataByDistrict.get(name);
              const fallbackScore = SEOUL_PATHS.find((d) => d.name === name)?.risk ?? 50;
              const score = districtData?.score ?? fallbackScore;
              const [labelX, labelY] = featureLabelPoint(feature, project);

              return (
                <g key={name} onClick={() => onSelect(name)} style={{ cursor: "pointer" }}>
                  <path
                    d={featureToPath(feature, project)}
                    fill={RISK_COLOR(score)}
                    fillOpacity={selected === name ? 1 : 0.8}
                    stroke="white"
                    strokeWidth={selected === name ? 2.2 : 0.9}
                    vectorEffect="non-scaling-stroke"
                    style={{ transition: "fill-opacity 0.15s, stroke-width 0.15s" }}
                  />
                  <text
                    x={labelX}
                    y={labelY + 3}
                    textAnchor="middle"
                    fontSize={["중구", "금천구", "종로구"].includes(name) ? "8.2" : "9.2"}
                    fill="white"
                    fontWeight="800"
                    fontFamily="'Noto Sans KR', sans-serif"
                    style={{ pointerEvents: "none", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
                  >
                    {name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl" style={{ paddingBottom: "94%", background: "#EEF4FA" }}>
      <svg viewBox="28 16 438 410" className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <g
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "230px 222px",
            transition: "transform 0.2s ease",
          }}
        >
          {/* Han River */}
          <path
            d="M36,310 C90,302 150,296 210,292 C270,288 330,285 390,280 L460,276 L460,296 C390,300 330,304 270,308 C210,312 148,318 90,326 L36,332 Z"
            fill="#BBDEFB"
            opacity="0.7"
          />
          {SEOUL_PATHS.map((d) => {
            const districtData = dataByDistrict.get(d.name);
            const score = districtData?.score ?? d.risk;

            return (
              <g key={d.name} onClick={() => onSelect(d.name)} style={{ cursor: "pointer" }}>
                <path
                  d={d.d}
                  fill={RISK_COLOR(score)}
                  fillOpacity={selected === d.name ? 1 : 0.78}
                  stroke="white"
                  strokeWidth={selected === d.name ? 2.2 : 0.9}
                  vectorEffect="non-scaling-stroke"
                  style={{ transition: "fill-opacity 0.15s, stroke-width 0.15s" }}
                />
                {!d.small && (
                  <text
                    x={d.cx}
                    y={d.cy + 4}
                    textAnchor="middle"
                    fontSize={["중구", "금천구", "서대문구"].includes(d.name) ? "8.2" : "9.5"}
                    fill="white"
                    fontWeight="800"
                    fontFamily="'Noto Sans KR', sans-serif"
                    style={{ pointerEvents: "none", textShadow: "0 1px 2px rgba(0,0,0,0.45)" }}
                  >
                    {d.name}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
      {geoLoadFailed && (
        <p className="absolute left-3 bottom-3 rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: "rgba(255,255,255,0.9)", color: "#6B7280", fontFamily: "'Noto Sans KR', sans-serif" }}>
          임시 지도 표시 중
        </p>
      )}
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

function OnboardingScreen({ onComplete }: { onComplete: (data: RiskApiResponse) => void }) {
  const [step, setStep] = useState<"intro" | "age">("intro");
  const [ageIndex, setAgeIndex] = useState(0);
  const selectedAgeGroup = AGE_GROUPS[ageIndex];
  const age = selectedAgeGroup.id;

  const handleStart = () => {
    if (!age) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        let lat = position.coords.latitude;
        let lon = position.coords.longitude;
        const numericAge = ageGroupToAge(age);

        if (!isInSeoul(lat, lon)) {
          lat = DEMO_JONGNO_LOCATION.lat;
          lon = DEMO_JONGNO_LOCATION.lon;
        }

        try {
          const data = await fetchRisk(numericAge, lat, lon);
          console.log("위험도 결과:", data);
          onComplete(data);
        } catch (error) {
          console.error("위험도 조회 실패:", error);
          alert("위험도 조회에 실패했습니다. 백엔드 서버가 켜져 있는지 확인해주세요.");
        }
      },
      (error) => {
        console.error("위치 가져오기 실패:", error);
        alert("현재 위치를 가져올 수 없습니다. 브라우저 위치 권한을 허용해주세요.");
      }
    );
  };

  if (step === "intro") {
    return (
      <button
        onClick={() => setStep("age")}
        className="flex min-h-full w-full flex-col items-center justify-center px-6 text-center"
        style={{ background: "#183153" }}
      >
        <div className="relative mb-5">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-lg" style={{ background: "rgba(255,255,255,0.12)" }}>
            <MapPin size={34} color="white" strokeWidth={2} />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#E53935" }}>
              <Flame size={15} color="white" strokeWidth={2.5} />
            </div>
          </div>
        </div>
        <h1 className="text-5xl font-black text-white tracking-tight mb-3" style={{ fontFamily: "Inter, sans-serif" }}>HeatMap</h1>
        <p className="text-sm leading-relaxed mb-10" style={{ color: "rgba(255,255,255,0.75)", fontFamily: "'Noto Sans KR', sans-serif", maxWidth: 280 }}>
          AI 기반 폭염 위험 예측 및<br />맞춤형 대응 서비스
        </p>
        <div className="w-full rounded-2xl py-4 font-bold text-base" style={{ background: "white", color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>
          화면을 터치해 시작하기
        </div>
      </button>
    );
  }

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
        <div className="mt-5 flex gap-2.5 p-3.5 rounded-2xl" style={{ background: "rgba(255,255,255,0.12)", maxWidth: 320 }}>
          <Info size={15} color="#F8C84E" className="flex-shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed text-left" style={{ color: "rgba(255,255,255,0.86)", fontFamily: "'Noto Sans KR', sans-serif" }}>
            본 서비스는 의료 진단이 아닌 참고용 AI 위험도 예측 서비스입니다.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-5 py-6 space-y-6 overflow-y-auto">
        {/* Age group */}
        <div>
          <label className="block text-sm font-bold mb-3" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>
            연령대 선택
          </label>
          <div className="rounded-2xl border-2 p-5" style={{ borderColor: selectedAgeGroup.accent, background: selectedAgeGroup.pastel }}>
            <div className="mb-5">
              <div className="text-xs font-bold mb-1" style={{ color: "#6B7280", fontFamily: "'Noto Sans KR', sans-serif" }}>선택 연령대</div>
              <div className="text-3xl font-black" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>{selectedAgeGroup.label}</div>
              <div className="text-sm mt-1" style={{ color: "#6B7280", fontFamily: "'Noto Sans KR', sans-serif" }}>{selectedAgeGroup.sub}</div>
            </div>
            <input
              type="range"
              min={0}
              max={AGE_GROUPS.length - 1}
              step={1}
              value={ageIndex}
              onChange={(event) => setAgeIndex(Number(event.target.value))}
              className="w-full"
              style={{ accentColor: selectedAgeGroup.accent }}
            />
            <div className="flex justify-between mt-2">
              <span className="text-xs font-bold" style={{ color: "#6B7280", fontFamily: "'Noto Sans KR', sans-serif" }}>0대</span>
              <span className="text-xs font-bold" style={{ color: "#6B7280", fontFamily: "'Noto Sans KR', sans-serif" }}>80대+</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3.5 rounded-2xl" style={{ background: "#EFF4FB" }}>
          <MapPin size={16} color="#183153" className="flex-shrink-0" />
          <p className="text-xs leading-relaxed" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>
            위치는 확인 버튼을 누르면 자동으로 가져옵니다.
          </p>
        </div>

      </div>

      {/* CTA */}
      <div className="px-5 pb-8 pt-2">
        <button
          onClick={handleStart}
          disabled={!age}
          className="w-full py-4 rounded-2xl font-bold text-base transition-all"
          style={{
            background: age ? "#183153" : "#E5E7EB",
            color: age ? "white" : "#9CA3AF",
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

function HomeScreen({ onNav, riskData }: { onNav: (s: Screen) => void; riskData: RiskApiResponse | null }) {
  const score = riskData?.risk.score ?? 91;
  const district = riskData?.location.district ?? "종로구";
  const temperature = riskData?.weather.temperature ?? 38;
  const humidity = riskData?.weather.humidity ?? 72;
  const windSpeed = riskData?.weather.wind_speed ?? 1.2;
  const greenRatio = riskData?.weather.green_ratio ?? 0.585919;
  const feelsLikeTemperature = calculateHeatIndex(temperature, humidity);
  const todayLabel = getTodayLabel();
  const heatAlertLabel = getHeatAlertLabel(score, feelsLikeTemperature);
  const ageFactorPercent = Math.round((riskData?.risk.age_factor ?? 0.4) * 100);
  const greenRatioPercent = greenRatio <= 1 ? greenRatio * 100 : greenRatio;
  const riskFactors = [
    {
      label: "체감온도",
      value: clampPercent((feelsLikeTemperature - 24) * 6),
      icon: Thermometer,
      color: feelsLikeTemperature >= 35 ? "#E53935" : feelsLikeTemperature >= 32 ? "#FB8C00" : "#FBC02D",
      detail: `${feelsLikeTemperature.toFixed(1)}°C`,
    },
    {
      label: "습도",
      value: clampPercent((humidity - 40) * 1.7),
      icon: Droplets,
      color: humidity >= 80 ? "#E53935" : humidity >= 65 ? "#FB8C00" : "#4CAF50",
      detail: `${Math.round(humidity)}%`,
    },
    {
      label: "연령 취약도",
      value: clampPercent(ageFactorPercent),
      icon: Users,
      color: ageFactorPercent >= 75 ? "#E53935" : ageFactorPercent >= 45 ? "#FB8C00" : "#4CAF50",
      detail: `${riskData?.risk.age_group ?? "30-39"} · ${ageFactorPercent}%`,
    },
    {
      label: "녹지율",
      value: clampPercent(greenRatioPercent),
      icon: TreePine,
      color: greenRatioPercent < 10 ? "#E53935" : greenRatioPercent < 20 ? "#FB8C00" : "#4CAF50",
      detail: getGreenRatioLabel(greenRatio),
    },
  ];
  const [selectedDistrict, setSelectedDistrict] = useState(district);
  const [heatmapData, setHeatmapData] = useState<DistrictHeatData[]>([]);
  const [heatmapLoading, setHeatmapLoading] = useState(false);
  const [mapZoom, setMapZoom] = useState(1);
  const selectedHeatData = heatmapData.find((item) => item.name === selectedDistrict);

  useEffect(() => {
    setSelectedDistrict(district);
  }, [district]);

  useEffect(() => {
    const loadHeatmap = async () => {
      setHeatmapLoading(true);

      try {
        const data = await fetchSeoulHeatmap(riskData?.age ?? 35);
        setHeatmapData(data);
      } catch (error) {
        console.error("서울 폭염 현황 조회 실패:", error);
      } finally {
        setHeatmapLoading(false);
      }
    };

    loadHeatmap();
  }, [riskData?.age]);

  return (
    <div className="flex flex-col bg-gray-50 pb-4">
      {/* Header */}
      <div className="px-5 pt-12 pb-5" style={{ background: RISK_COLOR(score) }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <MapPin size={14} color="white" />
            <span className="text-sm font-semibold text-white" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>서울시 {district}</span>
          </div>
          <div className="flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.85)", fontFamily: "'Noto Sans KR', sans-serif" }}>
            <RefreshCw size={11} />
            <span>방금 전 업데이트</span>
          </div>
        </div>
        <div className="flex items-end justify-between gap-4 mt-4">
          <div className="min-w-0">
            <div className="flex items-end gap-3">
              <span className="text-6xl font-black text-white tracking-normal" style={{ fontFamily: "Inter, sans-serif", lineHeight: 0.9 }}>{Math.round(temperature)}°C</span>
              <div className="mb-1.5">
                <div className="text-sm text-white font-semibold" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>체감</div>
                <div className="text-2xl text-white font-black" style={{ fontFamily: "Inter, sans-serif", lineHeight: 1 }}>{Math.round(feelsLikeTemperature)}°C</div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <Droplets size={13} color="white" />
                <span className="text-sm font-medium text-white" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>습도 {Math.round(humidity)}%</span>
              </div>
              <div className="flex items-center gap-1">
                <Wind size={13} color="white" />
                <span className="text-sm font-medium text-white" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>풍속 {windSpeed}m/s</span>
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0 max-w-[128px]">
            <div className="text-base font-black text-white leading-snug" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>{heatAlertLabel}</div>
            <div className="text-xs mt-1 leading-snug" style={{ color: "rgba(255,255,255,0.85)", fontFamily: "'Noto Sans KR', sans-serif" }}>{todayLabel}</div>
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
            {riskFactors.map((f) => (
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
                    <div className="h-full rounded-full transition-all" style={{ width: `${f.value}%`, background: f.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Seoul Heatmap */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border" style={{ borderColor: "#F3F4F6" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>서울 폭염 현황 지도</h2>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setMapZoom((value) => Math.max(1, Number((value - 0.18).toFixed(2))))}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "#F3F4F6", color: "#183153" }}
                aria-label="지도 축소"
              >
                <Minus size={15} />
              </button>
              <button
                type="button"
                onClick={() => setMapZoom((value) => Math.min(1.72, Number((value + 0.18).toFixed(2))))}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "#183153", color: "white" }}
                aria-label="지도 확대"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
          <SeoulMap selected={selectedDistrict} onSelect={(name) => setSelectedDistrict(name)} heatmapData={heatmapData} zoom={mapZoom} />
          <div className="mt-3">
            <RiskLegend />
          </div>
          {heatmapLoading && (
            <p className="mt-2 text-xs" style={{ color: "#6B7280", fontFamily: "'Noto Sans KR', sans-serif" }}>
              서울시 자치구별 폭염 정보를 불러오는 중입니다.
            </p>
          )}
          {selectedDistrict && (
            <div className="mt-3 flex items-center justify-between p-3 rounded-xl" style={{ background: "#F5F7FA" }}>
              <div className="flex items-center gap-2">
                <MapPin size={14} color="#183153" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>{selectedDistrict}</span>
                  {selectedHeatData && (
                    <span className="text-xs" style={{ color: "#6B7280", fontFamily: "'Noto Sans KR', sans-serif" }}>
                      {Math.round(selectedHeatData.temperature)}°C · 습도 {Math.round(selectedHeatData.humidity)}%
                    </span>
                  )}
                </div>
              </div>
              <span className="text-sm font-bold px-2.5 py-0.5 rounded-full" style={{
                background: RISK_BG(selectedHeatData?.score ?? SEOUL_PATHS.find(d => d.name === selectedDistrict)?.risk ?? 50),
                color: RISK_COLOR(selectedHeatData?.score ?? SEOUL_PATHS.find(d => d.name === selectedDistrict)?.risk ?? 50),
                fontFamily: "'Noto Sans KR', sans-serif"
              }}>
                {selectedHeatData?.score ?? SEOUL_PATHS.find(d => d.name === selectedDistrict)?.risk ?? 0}점 · {RISK_LABEL(selectedHeatData?.score ?? SEOUL_PATHS.find(d => d.name === selectedDistrict)?.risk ?? 50)}
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

function AnalysisScreen({ riskData }: { riskData: RiskApiResponse | null }) {
  const [forecastData, setForecastData] = useState<ForecastRiskData[]>([]);
  const [forecastLoading, setForecastLoading] = useState(false);
  const score = riskData?.risk.score ?? 50;
  const district = riskData?.location.district ?? "종로구";
  const temperature = riskData?.weather.temperature ?? 30;
  const humidity = riskData?.weather.humidity ?? 60;
  const greenRatio = riskData?.weather.green_ratio ?? 0.585919;
  const feelsLikeTemperature = calculateHeatIndex(temperature, humidity);
  const ageFactorPercent = Math.round((riskData?.risk.age_factor ?? 0.4) * 100);
  const greenRatioPercent = greenRatio <= 1 ? greenRatio * 100 : greenRatio;
  const level = RISK_LABEL(score);
  const todayLabel = getTodayLabel();
  const actionText = score >= 75
    ? "실외 활동을 줄이고 가까운 냉방 시설로 이동하세요."
    : score >= 50
      ? "장시간 야외 활동을 피하고 수분을 자주 보충하세요."
      : "현재 위험도는 낮지만 더위 노출 시간이 길어지지 않도록 주의하세요.";
  const fallbackForecastValues = [-10, -4, 0, 6, 12, 16, 10, 4, 0, -5, -8, -12].map((delta) => clampPercent(score + delta));
  const forecastBars = forecastData.length > 0
    ? forecastData.map((item) => ({
        score: item.score,
        label: `${Number(item.time.slice(0, 2))}시`,
      }))
    : fallbackForecastValues.map((value, index) => ({
        score: value,
        label: `${(6 + index * 2) % 24}시`,
      }));
  const contributions = [
    {
      label: "체감온도",
      pct: clampPercent((feelsLikeTemperature - 24) * 6),
      icon: Thermometer,
      color: feelsLikeTemperature >= 35 ? "#E53935" : feelsLikeTemperature >= 32 ? "#FB8C00" : "#FBC02D",
      detail: `${feelsLikeTemperature.toFixed(1)}°C · 현재 기온 ${Math.round(temperature)}°C`,
    },
    {
      label: "습도",
      pct: clampPercent((humidity - 40) * 1.7),
      icon: Droplets,
      color: humidity >= 80 ? "#E53935" : humidity >= 65 ? "#FB8C00" : "#4CAF50",
      detail: `${Math.round(humidity)}% · 땀 증발 효율 저하`,
    },
    {
      label: "연령 취약도",
      pct: clampPercent(ageFactorPercent),
      icon: Users,
      color: ageFactorPercent >= 75 ? "#E53935" : ageFactorPercent >= 45 ? "#FB8C00" : "#4CAF50",
      detail: `${riskData?.risk.age_group ?? "30-39"} 구간 · 가중치 ${ageFactorPercent}%`,
    },
    {
      label: "녹지율",
      pct: clampPercent(greenRatioPercent),
      icon: TreePine,
      color: greenRatioPercent < 10 ? "#E53935" : greenRatioPercent < 20 ? "#FB8C00" : "#4CAF50",
      detail: `${getGreenRatioLabel(greenRatio)} · 열섬 완화 요소`,
    },
  ];

  useEffect(() => {
    if (!riskData) return;

    const loadForecastRisk = async () => {
      setForecastLoading(true);

      try {
        const data = await fetchForecastRisk(
          riskData.age,
          riskData.location.lat,
          riskData.location.lon,
          riskData.location.district
        );
        setForecastData(data);
      } catch (error) {
        console.error("시간대별 예보 위험도 조회 실패:", error);
      } finally {
        setForecastLoading(false);
      }
    };

    loadForecastRisk();
  }, [riskData]);

  return (
    <div className="flex flex-col bg-gray-50 pb-4">
      <div className="px-5 pt-12 pb-5" style={{ background: "#183153" }}>
        <h1 className="text-xl font-black text-white mb-1" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>AI 위험 분석</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)", fontFamily: "'Noto Sans KR', sans-serif" }}>서울시 {district} · {todayLabel}</p>
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
                <span className="text-lg font-black" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>{level}</span>
                <AlertTriangle size={16} color={RISK_COLOR(score)} />
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#6B7280", fontFamily: "'Noto Sans KR', sans-serif" }}>
                현재 AI 위험도는 {score}점입니다. {actionText}
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
            현재 {district}의 체감온도는 <strong>{feelsLikeTemperature.toFixed(1)}°C</strong>, 습도는 <strong>{Math.round(humidity)}%</strong>입니다. 선택한 연령대의 취약도 가중치는 <strong>{ageFactorPercent}%</strong>이며, 녹지율은 <strong>{getGreenRatioLabel(greenRatio)}</strong>로 반영되었습니다.
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
                      <span className="text-sm font-black" style={{ color: c.color, fontFamily: "Inter, sans-serif" }}>{Math.round(c.pct)}%</span>
                    </div>
                  </div>
                </div>
                <div className="h-2 rounded-full ml-9" style={{ background: "#F3F4F6" }}>
                  <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: c.color }} />
                </div>
                <p className="text-xs mt-1 ml-9" style={{ color: "#9CA3AF", fontFamily: "'Noto Sans KR', sans-serif" }}>{c.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 24h forecast */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border" style={{ borderColor: "#F3F4F6" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>시간대별 예보 위험도</h2>
            {forecastLoading && (
              <span className="text-xs" style={{ color: "#9CA3AF", fontFamily: "'Noto Sans KR', sans-serif" }}>불러오는 중</span>
            )}
          </div>
          <div className="flex items-end gap-1 h-16">
            {forecastBars.map((item, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-sm" style={{ height: `${item.score * 0.58}px`, background: RISK_COLOR(item.score), minHeight: 4 }} />
                <span className="text-xs" style={{ color: "#9CA3AF", fontFamily: "Inter, sans-serif", fontSize: "8px" }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: "#9CA3AF", fontFamily: "'Noto Sans KR', sans-serif" }}>
            기상청 단기예보 기반으로 향후 시간대별 위험도를 계산합니다.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Shelter Map ───────────────────────────────────────────────────────────────

function ShelterMap({ shelters, selected }: { shelters: SelectedShelter[]; selected: number }) {
  const nearest = shelters[0];

  return (
    <div className="w-full rounded-2xl p-4" style={{ background: "#F5F7FA" }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs font-semibold" style={{ color: "#6B7280", fontFamily: "'Noto Sans KR', sans-serif" }}>현재 위치 기준</div>
          <div className="text-lg font-black" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>가까운 쉼터 {shelters.length}곳</div>
        </div>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "#E8F5E9" }}>
          <MapPin size={20} color="#4CAF50" />
        </div>
      </div>

      {nearest && (
        <div className="rounded-2xl p-3 mb-3" style={{ background: "white", border: "1px solid #E5E7EB" }}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-bold mb-0.5" style={{ color: "#4CAF50", fontFamily: "'Noto Sans KR', sans-serif" }}>가장 가까운 쉼터</div>
              <div className="text-sm font-black truncate" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>{nearest.name}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-2xl font-black" style={{ color: "#183153", fontFamily: "Inter, sans-serif", lineHeight: 1 }}>{nearest.dist.replace("km", "")}</div>
              <div className="text-xs" style={{ color: "#6B7280", fontFamily: "'Noto Sans KR', sans-serif" }}>km · 도보 {nearest.time}</div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {shelters.map((shelter, index) => (
          <div key={shelter.id} className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0" style={{
              background: selected === index ? "#183153" : "white",
              color: selected === index ? "white" : "#183153",
              fontFamily: "Inter, sans-serif",
            }}>
              {index + 1}
            </div>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
              <div className="h-full rounded-full" style={{
                width: `${Math.max(12, 100 - index * 24)}%`,
                background: selected === index ? "#183153" : "#4CAF50",
              }} />
            </div>
            <div className="w-16 text-right text-xs font-bold" style={{ color: "#374151", fontFamily: "Inter, sans-serif" }}>
              {shelter.dist}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShelterScreen({
  onNav,
  riskData,
  onStartRoute,
}: {
  onNav: (s: Screen) => void;
  riskData: RiskApiResponse | null;
  onStartRoute: (shelter: SelectedShelter) => void;
}) {
  const [selected, setSelected] = useState(0);
  const district = riskData?.location.district ?? "종로구";
  const apiShelters = riskData?.shelters ?? (riskData?.shelter ? [riskData.shelter] : []);
  const shelters: SelectedShelter[] = apiShelters.length > 0
    ? apiShelters.map((shelter, index) => ({
        id: index + 1,
        name: shelter.name,
        address: shelter.address,
        lat: shelter.lat,
        lon: shelter.lon,
        dist: `${shelter.distance_km}km`,
        time: `${Math.max(1, Math.round(shelter.distance_km / 4 * 60))}분`,
        type: "무더위쉼터",
        open: "운영 정보 확인 필요",
      }))
    : SHELTERS.map((shelter) => ({
        id: shelter.id,
        name: shelter.name,
        lat: shelter.lat,
        lon: shelter.lng,
        dist: shelter.dist,
        time: shelter.time,
        type: shelter.type,
        open: `운영 중 · ${shelter.open}`,
      }));

  const openDirections = (shelter: SelectedShelter) => {
    onStartRoute(shelter);
    onNav("nav");
  };

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
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)", fontFamily: "'Noto Sans KR', sans-serif" }}>서울시 {district} 기준 가까운 쉼터 {shelters.length}개</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Map */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border" style={{ borderColor: "#F3F4F6" }}>
          <ShelterMap shelters={shelters} selected={selected} />
        </div>

        {/* Shelter list */}
        <div className="space-y-3">
          {shelters.map((s, i) => (
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
                    <span className="text-xs" style={{ color: "#6B7280", fontFamily: "'Noto Sans KR', sans-serif" }}>{s.open}</span>
                  </div>
                  {"address" in s && (
                    <p className="text-xs mt-1.5 leading-snug" style={{ color: "#6B7280", fontFamily: "'Noto Sans KR', sans-serif" }}>{s.address}</p>
                  )}
                </div>
              </div>
              {selected === i && (
                <button
                  onClick={(e) => { e.stopPropagation(); openDirections(s); }}
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

function NavScreen({ onNav, selectedShelter }: { onNav: (s: Screen) => void; selectedShelter: SelectedShelter | null }) {
  const [step, setStep] = useState(0);
  const destination = selectedShelter?.name ?? "선택한 무더위쉼터";
  const distance = selectedShelter?.dist ?? "0.3km";
  const walkTime = selectedShelter?.time ?? "4분";
  const steps = [
    { dir: "출발", icon: "↑", detail: "현재 위치에서 가장 가까운 큰길 방향으로 이동" },
    { dir: "이동", icon: "→", detail: `${destination} 방향으로 이동` },
    { dir: "접근", icon: "←", detail: "쉼터 인근 도로에 도착" },
    { dir: "도착", icon: "📍", detail: destination },
  ];

  return (
    <div className="flex flex-col bg-gray-50 pb-4">
      <div className="px-5 pt-12 pb-5" style={{ background: "#183153" }}>
        <h1 className="text-xl font-black text-white mb-1" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>길찾기</h1>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex-1 rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.12)" }}>
            <div className="text-xs mb-0.5" style={{ color: "rgba(255,255,255,0.55)", fontFamily: "'Noto Sans KR', sans-serif" }}>목적지</div>
            <div className="text-sm font-bold text-white" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>{destination}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-white" style={{ fontFamily: "Inter, sans-serif" }}>{distance.replace("km", "")}</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'Noto Sans KR', sans-serif" }}>km</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-white" style={{ fontFamily: "Inter, sans-serif" }}>{walkTime.replace("분", "")}</div>
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

function GuideScreen({ riskData }: { riskData: RiskApiResponse | null }) {
  const score = riskData?.risk.score ?? 50;
  const district = riskData?.location.district ?? "종로구";
  const age = riskData?.age ?? 35;
  const ageGroup = riskData?.risk.age_group ?? getAgeGroup(age);
  const riskLevel = RISK_LABEL(score);
  const isHighRisk = score >= 60;
  const warningTitle = score >= 75 ? "즉각 대응 필요" : score >= 50 ? "주의 행동 필요" : "기본 예방 권장";
  const warningText = score >= 75
    ? `현재 ${ageGroup} 연령대는 폭염에 취약할 수 있습니다. 아래 권고사항을 즉시 실행하세요.`
    : score >= 50
      ? `현재 ${district}의 위험도가 높아지고 있습니다. 야외활동 시간을 줄이고 수분 섭취를 유지하세요.`
      : `현재 위험도는 낮지만 더위 노출이 길어지면 위험할 수 있습니다. 기본 예방수칙을 지켜주세요.`;
  const actions = [
    { icon: "💧", title: "물 자주 마시기", sub: isHighRisk ? "30분마다 200ml 이상 섭취하세요" : "목마르기 전에 자주 마시세요", priority: "high", color: "#1E88E5" },
    { icon: "🏠", title: "야외활동 조절", sub: isHighRisk ? "오후 12시–16시 외출을 피하세요" : "한낮 장시간 외출은 줄이세요", priority: "high", color: "#E53935" },
    { icon: "❄️", title: "무더위쉼터 이용", sub: score >= 50 ? "인근 쉼터를 적극 활용하세요" : "가까운 쉼터 위치를 확인하세요", priority: "high", color: "#4CAF50" },
    { icon: "⏰", title: "활동 시간 조정", sub: "외출 시 아침 또는 저녁 시간을 권장합니다", priority: "medium", color: "#FB8C00" },
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
            <span className="text-sm font-bold text-white" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>{age}세 · {district} 기준</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.65)", fontFamily: "'Noto Sans KR', sans-serif" }}>현재 위험도</span>
              <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: RISK_COLOR(score), color: "white", fontFamily: "Inter, sans-serif" }}>{score}점 · {riskLevel}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Priority warning */}
        <div className="rounded-2xl p-4 border-2" style={{ background: score >= 60 ? "#FFEBEE" : "#FFFDE7", borderColor: score >= 60 ? "#FFCDD2" : "#FFF59D" }}>
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle size={16} color={score >= 60 ? "#E53935" : "#F9A825"} />
            <span className="text-sm font-bold" style={{ color: score >= 60 ? "#C62828" : "#78350F", fontFamily: "'Noto Sans KR', sans-serif" }}>{warningTitle}</span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: score >= 60 ? "#7F1D1D" : "#78350F", fontFamily: "'Noto Sans KR', sans-serif" }}>
            {warningText}
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
  const [riskData, setRiskData] = useState<RiskApiResponse | null>(null);
  const [selectedShelter, setSelectedShelter] = useState<SelectedShelter | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const homeScore = riskData?.risk.score ?? HOME_SCORE;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [screen]);

  const renderScreen = () => {
    switch (screen) {
      case "onboarding": return <OnboardingScreen onComplete={(data) => { setRiskData(data); setScreen("home"); }} />;
      case "home": return <HomeScreen onNav={setScreen} riskData={riskData} />;
      case "analysis": return <AnalysisScreen riskData={riskData} />;
      case "shelter": return <ShelterScreen onNav={setScreen} riskData={riskData} onStartRoute={setSelectedShelter} />;
      case "nav": return <NavScreen onNav={setScreen} selectedShelter={selectedShelter} />;
      case "guide": return <GuideScreen riskData={riskData} />;
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
        <div className="flex items-center justify-between px-6 py-2 flex-shrink-0 z-10" style={{ background: screen === "home" ? RISK_COLOR(homeScore) : "#183153" }}>
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

        {/* Bottom nav (hidden on onboarding and route guidance) */}
        {screen !== "onboarding" && screen !== "nav" && (
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
