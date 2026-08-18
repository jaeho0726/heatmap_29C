import { useEffect, useMemo, useState } from "react";
import { Building, ChevronRight, Clock, LoaderCircle, MapPin, Navigation, Search } from "lucide-react";
import ShelterMap from "../components/ShelterMap";
import { LOCATIONS } from "../data/onboarding";
import { SHELTERS } from "../data/shelters";
import type { Coordinates, NavigateHandler } from "../types";
import { calculateDistance, findNearestShelter } from "../utils/location";

type ShelterSearchMode = "current" | "district" | null;

interface ShelterPageProps {
  onNav: NavigateHandler;
  userLocation: Coordinates | null;
  locationLoading: boolean;
  locationError: string | null;
  onRequestLocation: () => void;
}

export default function ShelterPage({
  onNav,
  userLocation,
  locationLoading,
  locationError,
  onRequestLocation,
}: ShelterPageProps) {
  const [selected, setSelected] = useState(0);
  const [searchMode, setSearchMode] = useState<ShelterSearchMode>(null);
  const [searchDistrict, setSearchDistrict] = useState("");
  const [districtOpen, setDistrictOpen] = useState(false);
  const [waitingForNavigationLocation, setWaitingForNavigationLocation] = useState(false);

  const distanceLocation = searchMode === "current" ? userLocation : null;
  const sheltersWithDistance = useMemo(() => SHELTERS.map((shelter) => ({
    ...shelter,
    distanceKm: distanceLocation
      ? calculateDistance(distanceLocation, { lat: shelter.lat, lng: shelter.lng })
      : null,
  })), [distanceLocation]);
  const nearestShelter = useMemo(
    () => distanceLocation ? findNearestShelter(distanceLocation, SHELTERS) : null,
    [distanceLocation],
  );
  const showShelters = (searchMode === "current" && userLocation !== null)
    || (searchMode === "district" && searchDistrict !== "");

  useEffect(() => {
    if (waitingForNavigationLocation && userLocation) {
      setWaitingForNavigationLocation(false);
      onNav("nav");
    }
  }, [onNav, userLocation, waitingForNavigationLocation]);

  const selectCurrentLocation = () => {
    setSearchMode("current");
    setSearchDistrict("");
    setDistrictOpen(false);

    if (!userLocation && !locationLoading) {
      onRequestLocation();
    }
  };

  const selectDistrictSearch = () => {
    setSearchMode("district");
    setDistrictOpen(false);
  };

  const startNavigation = () => {
    if (userLocation) {
      onNav("nav");
      return;
    }

    setWaitingForNavigationLocation(true);
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
          무더위쉼터 찾기
        </h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)", fontFamily: "'Noto Sans KR', sans-serif" }}>
          {searchMode === "current" && userLocation
            ? "현재 위치 기준 쉼터 3개소 검색됨"
            : searchMode === "district" && searchDistrict
              ? `서울시 ${searchDistrict} 기준 쉼터 목록`
              : "쉼터 검색 기준을 선택해주세요"}
        </p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {searchMode === null && (
          <div className="space-y-3">
            <h2 className="text-base font-bold px-1" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>어디를 기준으로 찾을까요?</h2>
            <button
              onClick={selectCurrentLocation}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-3 text-left"
              style={{ borderColor: "#F3F4F6" }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#EFF4FB" }}>
                <MapPin size={20} color="#183153" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>현재 위치에서 찾기</div>
                <div className="text-xs mt-1" style={{ color: "#6B7280", fontFamily: "'Noto Sans KR', sans-serif" }}>내 주변 가까운 쉼터 찾기</div>
              </div>
              <ChevronRight size={17} color="#9CA3AF" />
            </button>

            <button
              onClick={selectDistrictSearch}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-3 text-left"
              style={{ borderColor: "#F3F4F6" }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#FFF3E0" }}>
                <Search size={20} color="#FB8C00" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>다른 지역에서 찾기</div>
                <div className="text-xs mt-1" style={{ color: "#6B7280", fontFamily: "'Noto Sans KR', sans-serif" }}>원하는 지역 주변 쉼터 찾기</div>
              </div>
              <ChevronRight size={17} color="#9CA3AF" />
            </button>
          </div>
        )}

        {searchMode === "current" && !userLocation && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border text-center" style={{ borderColor: "#F3F4F6" }}>
            {locationLoading ? (
              <div className="flex items-center justify-center gap-2 py-3">
                <LoaderCircle size={18} color="#183153" className="animate-spin" />
                <span className="text-sm font-bold" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>현재 위치 확인 중...</span>
              </div>
            ) : (
              <>
                <MapPin size={24} color={locationError ? "#E53935" : "#183153"} className="mx-auto mb-2" />
                <p className="text-sm font-bold" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>
                  {locationError ? "현재 위치를 확인할 수 없습니다." : "현재 위치를 사용해 가까운 쉼터를 찾아보세요."}
                </p>
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

        {searchMode === "district" && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border" style={{ borderColor: "#F3F4F6" }}>
            <h2 className="text-sm font-bold mb-3" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>다른 지역에서 찾기</h2>
            <div className="relative">
              <button
                className="w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all"
                style={{ borderColor: districtOpen ? "#183153" : "#E5E7EB", background: "#F5F7FA" }}
                onClick={() => setDistrictOpen(!districtOpen)}
              >
                <div className="flex items-center gap-2">
                  <Search size={16} color="#183153" />
                  <span style={{ color: searchDistrict ? "#111827" : "#9CA3AF", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "15px" }}>
                    {searchDistrict || "서울시 자치구 선택"}
                  </span>
                </div>
                <ChevronRight size={16} color="#9CA3AF" style={{ transform: districtOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
              </button>
              {districtOpen && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
                  {LOCATIONS.map((district) => (
                    <button
                      key={district}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                      style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", color: "#111827" }}
                      onClick={() => { setSearchDistrict(district); setDistrictOpen(false); }}
                    >
                      서울시 {district}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {searchMode !== null && (
          <button
            onClick={() => { setSearchMode(null); setSearchDistrict(""); setDistrictOpen(false); setWaitingForNavigationLocation(false); }}
            className="w-full text-xs font-semibold"
            style={{ color: "#6B7280", fontFamily: "'Noto Sans KR', sans-serif" }}
          >
            검색 기준 다시 선택
          </button>
        )}

        {waitingForNavigationLocation && !userLocation && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border text-center" style={{ borderColor: "#F3F4F6" }}>
            {locationLoading ? (
              <div className="flex items-center justify-center gap-2 py-3">
                <LoaderCircle size={18} color="#183153" className="animate-spin" />
                <span className="text-sm font-bold" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>현재 위치 확인 중...</span>
              </div>
            ) : (
              <>
                <MapPin size={24} color={locationError ? "#E53935" : "#183153"} className="mx-auto mb-2" />
                <p className="text-sm font-bold" style={{ color: "#183153", fontFamily: "'Noto Sans KR', sans-serif" }}>길찾기를 위해 현재 위치가 필요합니다.</p>
                {locationError && (
                  <p className="text-xs mt-1" style={{ color: "#6B7280", fontFamily: "'Noto Sans KR', sans-serif" }}>{locationError}</p>
                )}
                <button
                  onClick={onRequestLocation}
                  className="mt-4 px-5 py-2.5 rounded-xl font-bold text-sm"
                  style={{ background: "#183153", color: "white", fontFamily: "'Noto Sans KR', sans-serif" }}
                >
                  {locationError ? "다시 시도" : "현재 위치 사용"}
                </button>
              </>
            )}
          </div>
        )}

        {showShelters && (
          <>
            {/* Map */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border" style={{ borderColor: "#F3F4F6" }}>
              <ShelterMap userLocation={distanceLocation} />
            </div>

            {/* Shelter list */}
            <div className="space-y-3">
              {sheltersWithDistance.map((s, i) => (
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
                        {nearestShelter?.shelter.id === s.id && (
                          <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "#E8F5E9", color: "#2E7D32", fontFamily: "'Noto Sans KR', sans-serif" }}>
                            가장 가까운
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1">
                          <Navigation size={12} color="#6B7280" />
                          <span
                            className="text-xs font-semibold"
                            style={{ color: "#374151", fontFamily: "Inter, sans-serif" }}
                            title={s.distanceKm === null ? undefined : `직선거리 ${s.distanceKm.toFixed(2)}km`}
                          >
                            {s.dist}
                          </span>
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
                      onClick={(event) => { event.stopPropagation(); startNavigation(); }}
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
          </>
        )}
      </div>
    </div>
  );
}
