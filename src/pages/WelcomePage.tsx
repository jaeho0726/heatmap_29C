import { useCallback, useEffect, useRef, useState } from "react";
import { Flame, MapPin } from "lucide-react";

interface WelcomePageProps {
  onComplete: () => void;
}

export default function WelcomePage({ onComplete }: WelcomePageProps) {
  const [leaving, setLeaving] = useState(false);
  const completedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const complete = useCallback(() => {
    if (completedRef.current) {
      return;
    }

    completedRef.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const start = () => {
    if (leaving) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      complete();
      return;
    }

    setLeaving(true);
    timeoutRef.current = setTimeout(complete, 550);
  };

  return (
    <button
      type="button"
      onClick={start}
      onTransitionEnd={(event) => {
        if (event.target === event.currentTarget && leaving) {
          complete();
        }
      }}
      aria-label="HeatMap 시작 화면. 눌러서 온보딩 시작"
      className="absolute inset-0 z-20 w-full h-full flex flex-col items-center justify-center px-6 text-center transition-transform duration-500 ease-in-out motion-reduce:transition-none"
      style={{ background: "#183153", transform: leaving ? "translateY(-100%)" : "translateY(0)" }}
    >
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-lg" style={{ background: "rgba(255,255,255,0.12)" }}>
          <MapPin size={36} color="white" strokeWidth={2} />
          <div className="absolute -bottom-1.5 -right-1.5 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#E53935" }}>
            <Flame size={17} color="white" strokeWidth={2.5} />
          </div>
        </div>
      </div>
      <h1 className="text-5xl font-black text-white tracking-tight mb-4" style={{ fontFamily: "Inter, sans-serif" }}>HeatMap</h1>
      <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)", fontFamily: "'Noto Sans KR', sans-serif" }}>
        AI 기반 폭염 위험 예측 및<br />맞춤형 대응 서비스
      </p>
      <span
        className="absolute bottom-12 text-xs font-semibold"
        style={{ color: "rgba(255,255,255,0.65)", fontFamily: "'Noto Sans KR', sans-serif" }}
      >
        화면을 터치하여 시작
      </span>
    </button>
  );
}
