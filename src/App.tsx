import { useEffect, useRef, useState } from "react";
import BottomNav from "./components/BottomNav";
import { HOME_SCORE } from "./data/risk";
import useGeolocation from "./hooks/useGeolocation";
import AnalysisPage from "./pages/AnalysisPage";
import GuidePage from "./pages/GuidePage";
import HomePage from "./pages/HomePage";
import NavigationPage from "./pages/NavigationPage";
import OnboardingPage from "./pages/OnboardingPage";
import ShelterPage from "./pages/ShelterPage";
import type { Screen } from "./types";
import { RISK_COLOR } from "./utils/risk";

export default function App() {
  const [screen, setScreen] = useState<Screen>("onboarding");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { location, loading, error, requestLocation } = useGeolocation();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [screen]);

  const renderScreen = () => {
    switch (screen) {
      case "onboarding": return <OnboardingPage onComplete={() => setScreen("home")} />;
      case "home": return <HomePage onNav={setScreen} />;
      case "analysis": return <AnalysisPage />;
      case "shelter": return (
        <ShelterPage
          onNav={setScreen}
          userLocation={location}
          locationLoading={loading}
          locationError={error}
          onRequestLocation={requestLocation}
        />
      );
      case "nav": return (
        <NavigationPage
          onNav={setScreen}
          userLocation={location}
          locationLoading={loading}
          locationError={error}
          onRequestLocation={requestLocation}
        />
      );
      case "guide": return <GuidePage />;
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
