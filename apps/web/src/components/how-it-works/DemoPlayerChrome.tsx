"use client";

import {
  Captions,
  CaptionsOff,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Settings,
} from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { CHAPTER_START_MS, DEMO_CHAPTERS, TOTAL_DEMO_MS } from "@/components/how-it-works/demoChapters";
import type { DemoPlayerMachine } from "@/components/how-it-works/DemoTimelineContext";

const SPEEDS = [0.75, 1, 1.25] as const;

export function DemoPlayerChrome({
  machine,
  onToggleFullscreen,
  isFullscreen,
  chromeVisible,
  onInteraction,
}: {
  machine: DemoPlayerMachine;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  chromeVisible: boolean;
  onInteraction: () => void;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const { fillRef, thumbRef, timeRef } = machine.scrubRefs;

  useEffect(() => {
    if (!settingsOpen) return;
    function onDoc(e: MouseEvent) {
      if (!settingsRef.current?.contains(e.target as Node)) setSettingsOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [settingsOpen]);

  const chapterTicks = DEMO_CHAPTERS.map((c) => CHAPTER_START_MS[c.id] / TOTAL_DEMO_MS);

  return (
    <div
      className={`absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/75 via-black/45 to-transparent px-3 pb-3 pt-10 transition-opacity duration-300 sm:px-4 ${
        chromeVisible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      data-chrome
      onPointerDown={onInteraction}
    >
      <DemoScrubber
        fillRef={fillRef}
        thumbRef={thumbRef}
        chapterTicks={chapterTicks}
        onScrub={machine.seekToProgress}
        onScrubStart={machine.startScrub}
        onScrubEnd={machine.endScrub}
        onInteraction={onInteraction}
      />

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={machine.isPlaying ? "Pause demo" : "Play demo"}
            onClick={() => {
              onInteraction();
              machine.togglePlay();
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {machine.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 pl-0.5" />}
          </button>
          <span ref={timeRef} className="ml-1 tabular-nums text-xs text-white/90">
            0:00 / 0:32
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={machine.captionsOn ? "Turn captions off" : "Turn captions on"}
            aria-pressed={machine.captionsOn}
            onClick={() => {
              onInteraction();
              machine.setCaptionsOn((v) => !v);
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {machine.captionsOn ? <Captions className="h-4 w-4" /> : <CaptionsOff className="h-4 w-4" />}
          </button>

          <div className="relative" ref={settingsRef}>
            <button
              type="button"
              aria-label="Playback settings"
              aria-expanded={settingsOpen}
              onClick={() => {
                onInteraction();
                setSettingsOpen((v) => !v);
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Settings className="h-4 w-4" />
            </button>
            {settingsOpen && (
              <div className="absolute bottom-full right-0 mb-2 min-w-[8rem] rounded-xl border border-white/15 bg-[#15151C] p-2 shadow-xl">
                <p className="px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-zinc-400">
                  Speed
                </p>
                {SPEEDS.map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => {
                      machine.setPlaybackRate(speed);
                      setSettingsOpen(false);
                      onInteraction();
                    }}
                    className={`block w-full rounded-lg px-2 py-1.5 text-left text-sm ${
                      machine.playbackRate === speed
                        ? "bg-white/15 font-semibold text-white"
                        : "text-zinc-300 hover:bg-white/10"
                    }`}
                  >
                    {speed}×
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            onClick={() => {
              onInteraction();
              onToggleFullscreen();
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function DemoScrubber({
  fillRef,
  thumbRef,
  chapterTicks,
  onScrub,
  onScrubStart,
  onScrubEnd,
  onInteraction,
}: {
  fillRef: RefObject<HTMLDivElement>;
  thumbRef: RefObject<HTMLDivElement>;
  chapterTicks: number[];
  onScrub: (p: number) => void;
  onScrubStart: () => void;
  onScrubEnd: () => void;
  onInteraction: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const progressRef = useRef(0);

  function positionToProgress(clientX: number) {
    const track = trackRef.current;
    if (!track) return progressRef.current;
    const rect = track.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }

  function paint(p: number) {
    progressRef.current = p;
    const pct = `${p * 100}%`;
    if (fillRef.current) fillRef.current.style.width = pct;
    if (thumbRef.current) thumbRef.current.style.left = pct;
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    dragging.current = true;
    onScrubStart();
    const p = positionToProgress(e.clientX);
    paint(p);
    onScrub(p);
    onInteraction();
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    const p = positionToProgress(e.clientX);
    paint(p);
    onScrub(p);
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    dragging.current = false;
    onScrubEnd();
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  return (
    <div
      ref={trackRef}
      role="slider"
      aria-label="Demo progress"
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      className="group relative h-5 cursor-pointer touch-none rounded-full bg-white/20"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          const p = Math.min(1, progressRef.current + 0.02);
          paint(p);
          onScrub(p);
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          const p = Math.max(0, progressRef.current - 0.02);
          paint(p);
          onScrub(p);
        }
      }}
    >
      {chapterTicks.map((tick) => (
        <span
          key={tick}
          className="pointer-events-none absolute top-1/2 z-10 h-2 w-0.5 -translate-y-1/2 rounded-full bg-white/50"
          style={{ left: `${tick * 100}%` }}
          aria-hidden
        />
      ))}
      <div
        ref={fillRef}
        className="pointer-events-none absolute inset-y-0 left-0 w-0 rounded-full bg-sky-400"
      />
      <div
        ref={thumbRef}
        className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-sky-500"
        style={{ left: 0 }}
      />
    </div>
  );
}

export function DemoCaption({
  text,
  visible,
  dark,
}: {
  text: string;
  visible: boolean;
  dark: boolean;
}) {
  if (!visible || !text) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[4.75rem] z-20 flex justify-center px-4 sm:bottom-[5rem]">
      <p
        className={`max-w-xl rounded-lg px-3 py-2 text-center text-xs leading-relaxed sm:text-sm ${
          dark ? "bg-black/55 text-white" : "bg-white/85 text-brand-ink"
        }`}
      >
        {text}
      </p>
    </div>
  );
}

export function DemoChapterTabs({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="absolute left-3 top-3 z-20 flex flex-wrap gap-1 sm:left-4">
      {DEMO_CHAPTERS.map((chapter, i) => {
        if (!chapter.tabLabel) return null;
        const active = i === activeIndex;
        return (
          <span
            key={chapter.id}
            className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold sm:text-xs ${
              active ? "bg-white text-brand-ink shadow-sm" : "bg-black/20 text-white/85"
            }`}
          >
            {chapter.tabLabel}
          </span>
        );
      })}
    </div>
  );
}
