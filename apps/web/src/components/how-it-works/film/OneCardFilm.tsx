"use client";

/**
 * OneCardFilm — the /how-it-works guided product film.
 *
 * A self-contained, scrubbable cinematic demo. Timeline progress is driven by a
 * single rAF loop writing to a MotionValue (no per-frame React state). Plays
 * through once, then ends on a Replay button — never auto-loops.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { usePrefersReducedMotion } from "../usePrefersReducedMotion";
import { useFilmClock } from "./useFilmClock";
import { FilmStage } from "./FilmStage";
import { FilmControls } from "./FilmControls";

export function OneCardFilm() {
  const clock = useFilmClock();
  const reducedMotion = usePrefersReducedMotion();

  const shellRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const autoPlayedRef = useRef(false);

  const [captionsOn, setCaptionsOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [started, setStarted] = useState(false);

  const begin = useCallback(() => {
    setStarted(true);
    clock.play();
  }, [clock]);

  // Autoplay once on first scroll into view (muted; never loops).
  useEffect(() => {
    if (reducedMotion) return;
    const el = shellRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.5 && !autoPlayedRef.current) {
            autoPlayedRef.current = true;
            setStarted(true);
            clock.play();
            io.disconnect();
          }
        }
      },
      { threshold: [0, 0.5, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [clock, reducedMotion]);

  // Fullscreen wiring.
  const toggleFullscreen = useCallback(() => {
    const el = shellRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void el.requestFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Click anywhere on the video toggles play/pause (but not on real controls).
  const onStageClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("button, a, [role='slider']")) return;
      setStarted(true);
      clock.toggle();
    },
    [clock],
  );

  // Keyboard: Space play/pause, ←/→ seek, F fullscreen.
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        setStarted(true);
        clock.toggle();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        clock.nudge(-5000);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        clock.nudge(5000);
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      }
    },
    [clock, toggleFullscreen],
  );

  const showPoster = !started && !clock.playing && !clock.ended;

  return (
    <figure className="m-0">
      <div
        ref={shellRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-label="OneCard guided product demo"
        className={`group/film relative flex flex-col overflow-hidden rounded-2xl bg-[#0b0b0f] shadow-[0_30px_80px_-40px_rgba(15,23,42,0.5)] outline-none ring-1 ring-zinc-200 focus-visible:ring-2 focus-visible:ring-brand-ocean ${
          isFullscreen ? "h-screen w-screen justify-center" : ""
        }`}
      >
        {/* Video area */}
        <div
          className={`relative ${isFullscreen ? "flex min-h-0 flex-1 items-center justify-center" : ""}`}
          onClick={onStageClick}
        >
          <FilmStage
            timeMs={clock.timeMs}
            reducedMotion={reducedMotion}
            captionsOn={captionsOn}
            fitMode={isFullscreen ? "contain" : "width"}
            stageRef={stageRef}
          />

          {/* Poster / initial play affordance */}
          {showPoster && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30">
              <button
                type="button"
                aria-label="Play demo"
                onClick={begin}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-brand-ink shadow-xl outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-brand-ocean"
              >
                <Play size={26} fill="currentColor" className="ml-1" />
              </button>
            </div>
          )}

          {/* Replay overlay — never auto-loops */}
          {clock.ended && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/45 backdrop-blur-[2px]">
              <button
                type="button"
                aria-label="Replay demo"
                onClick={(e) => {
                  e.stopPropagation();
                  setStarted(true);
                  clock.replay();
                }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-brand-ink shadow-xl outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-brand-ocean"
              >
                <RotateCcw size={24} />
              </button>
              <span className="text-[13px] font-semibold text-white/90">Replay</span>
            </div>
          )}

          {reducedMotion && showPoster && (
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-white/80">
              Reduced motion — drag the bar to step through
            </span>
          )}
        </div>

        {/* Controls */}
        <FilmControls
          clock={clock}
          captionsOn={captionsOn}
          onToggleCaptions={() => setCaptionsOn((c) => !c)}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
        />
      </div>
      <figcaption className="sr-only">
        A guided demo of how OneCard routes each purchase to the card that earns the most — online via
        the browser extension and in person with a contactless tap.
      </figcaption>
    </figure>
  );
}
