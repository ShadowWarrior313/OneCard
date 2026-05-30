"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useTransform } from "framer-motion";
import { Play, Pause, Maximize, Minimize, Subtitles, Gauge } from "lucide-react";
import { CHAPTERS, DURATION_MS, PLAYBACK_SPEEDS, formatClock, type PlaybackSpeed } from "./filmConfig";
import type { FilmClock } from "./useFilmClock";

function TimeReadout({ clock }: { clock: FilmClock }) {
  const [ms, setMs] = useState(0);
  const secRef = useRef(-1);
  useMotionValueEvent(clock.timeMs, "change", (v) => {
    const sec = Math.floor(v / 1000);
    if (sec !== secRef.current) {
      secRef.current = sec;
      setMs(v);
    }
  });
  return (
    <span className="select-none text-[12px] font-semibold tabular-nums text-zinc-300">
      {formatClock(ms)} <span className="text-zinc-500">/ {formatClock(DURATION_MS)}</span>
    </span>
  );
}

function ScrubBar({ clock }: { clock: FilmClock }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const trackWRef = useRef(1);
  const draggingRef = useRef(false);
  const [ariaPct, setAriaPct] = useState(0);
  const ariaRef = useRef(0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => {
      trackWRef.current = el.getBoundingClientRect().width || 1;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Handle position is a transform driven by a motion value — no per-frame React state.
  const handleX = useTransform(clock.progress, (p) => p * trackWRef.current - 7);

  // aria-valuenow updates only when the integer percent changes (a few times/sec).
  useMotionValueEvent(clock.progress, "change", (v) => {
    const pct = Math.round(v * 100);
    if (pct !== ariaRef.current) {
      ariaRef.current = pct;
      setAriaPct(pct);
    }
  });

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const f = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      clock.seekFraction(f);
    },
    [clock],
  );

  return (
    <div
      ref={trackRef}
      role="slider"
      aria-label="Seek through the demo"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={ariaPct}
      tabIndex={0}
      className="group relative h-5 flex-1 cursor-pointer touch-none outline-none focus-visible:ring-2 focus-visible:ring-brand-ocean focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0f]"
      onPointerDown={(e) => {
        draggingRef.current = true;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        seekFromClientX(e.clientX);
      }}
      onPointerMove={(e) => {
        if (draggingRef.current) seekFromClientX(e.clientX);
      }}
      onPointerUp={(e) => {
        draggingRef.current = false;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          clock.nudge(-2000);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          clock.nudge(2000);
        }
      }}
    >
      {/* track */}
      <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/20">
        <motion.div
          className="h-full w-full origin-left rounded-full bg-brand-ocean"
          style={{ scaleX: clock.progress }}
        />
      </div>
      {/* chapter ticks */}
      {CHAPTERS.slice(1).map((c) => (
        <span
          key={c.id}
          className="absolute top-1/2 h-2.5 w-[2px] -translate-y-1/2 rounded-full bg-white/40"
          style={{ left: `${(c.start / DURATION_MS) * 100}%` }}
        />
      ))}
      {/* handle */}
      <motion.div
        className="absolute left-0 top-1/2 h-3.5 w-3.5 rounded-full bg-white shadow ring-1 ring-black/10"
        style={{ x: handleX, y: "-50%" }}
      />
    </div>
  );
}

function CtrlButton({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-200 outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-brand-ocean ${
        active ? "bg-white/10 text-white" : ""
      }`}
    >
      {children}
    </button>
  );
}

function FilmControlsBase({
  clock,
  captionsOn,
  onToggleCaptions,
  isFullscreen,
  onToggleFullscreen,
}: {
  clock: FilmClock;
  captionsOn: boolean;
  onToggleCaptions: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  const [speedOpen, setSpeedOpen] = useState(false);

  return (
    <div className="flex items-center gap-3 border-t border-white/10 bg-[#0b0b0f] px-3 py-2.5">
      <CtrlButton label={clock.playing ? "Pause" : "Play"} onClick={clock.toggle}>
        {clock.playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
      </CtrlButton>

      <TimeReadout clock={clock} />

      <ScrubBar clock={clock} />

      <CtrlButton label="Toggle captions" active={captionsOn} onClick={onToggleCaptions}>
        <Subtitles size={16} />
      </CtrlButton>

      {/* speed */}
      <div className="relative">
        <button
          type="button"
          aria-label="Playback speed"
          aria-expanded={speedOpen}
          onClick={() => setSpeedOpen((s) => !s)}
          className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[12px] font-bold text-zinc-200 outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-brand-ocean"
        >
          <Gauge size={15} /> {clock.speed}×
        </button>
        {speedOpen && (
          <div className="absolute bottom-10 right-0 z-10 w-20 overflow-hidden rounded-lg bg-[#1b1b22] py-1 shadow-xl ring-1 ring-white/10">
            {PLAYBACK_SPEEDS.map((s: PlaybackSpeed) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  clock.setSpeed(s);
                  setSpeedOpen(false);
                }}
                className={`block w-full px-3 py-1.5 text-left text-[12px] font-semibold outline-none hover:bg-white/10 focus-visible:bg-white/10 ${
                  clock.speed === s ? "text-brand-ocean" : "text-zinc-200"
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
        )}
      </div>

      <CtrlButton label={isFullscreen ? "Exit fullscreen" : "Fullscreen"} onClick={onToggleFullscreen}>
        {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
      </CtrlButton>
    </div>
  );
}

export const FilmControls = memo(FilmControlsBase);
