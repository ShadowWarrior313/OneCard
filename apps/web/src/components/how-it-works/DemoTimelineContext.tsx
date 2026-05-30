"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {
  DEMO_CHAPTERS,
  TOTAL_DEMO_MS,
  CHAPTER_START_MS,
  chapterProgressAt,
  msToChapterIndex,
  type ChapterId,
} from "@/components/how-it-works/demoChapters";

export type ScrubRefs = {
  fillRef: RefObject<HTMLDivElement>;
  thumbRef: RefObject<HTMLDivElement>;
  timeRef: RefObject<HTMLSpanElement>;
};

type TimelineContextValue = {
  elapsedMsRef: React.MutableRefObject<number>;
  uiTick: number;
  isPlaying: boolean;
  isScrubbing: boolean;
  hasEnded: boolean;
  playbackRate: number;
  captionsOn: boolean;
  chapterIndex: number;
  chapterId: ChapterId;
  scrubRefs: ScrubRefs;
  setIsPlaying: (v: boolean) => void;
  setPlaybackRate: (v: number) => void;
  setCaptionsOn: React.Dispatch<React.SetStateAction<boolean>>;
  togglePlay: () => void;
  seekToMs: (ms: number) => void;
  seekToProgress: (p: number) => void;
  seekChapter: (delta: number) => void;
  startScrub: () => void;
  endScrub: () => void;
  replay: () => void;
  totalMs: number;
  chapters: typeof DEMO_CHAPTERS;
};

const TimelineContext = createContext<TimelineContextValue | null>(null);

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function paintScrub(refs: ScrubRefs, ms: number) {
  const p = Math.max(0, Math.min(1, ms / TOTAL_DEMO_MS));
  const pct = `${p * 100}%`;
  if (refs.fillRef.current) refs.fillRef.current.style.width = pct;
  if (refs.thumbRef.current) refs.thumbRef.current.style.left = pct;
  if (refs.timeRef.current) {
    const shown = Math.min(ms, TOTAL_DEMO_MS);
    refs.timeRef.current.textContent = `${formatTime(shown)} / ${formatTime(TOTAL_DEMO_MS)}`;
  }
}

export function DemoTimelineProvider({
  children,
  initialPlaying = true,
}: {
  children: ReactNode;
  initialPlaying?: boolean;
}) {
  const elapsedMsRef = useRef(0);
  const [uiTick, setUiTick] = useState(0);
  const [isPlaying, setIsPlaying] = useState(initialPlaying);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const lastTick = useRef<number | null>(null);
  const lastChapter = useRef(0);
  const lastOutro = useRef(false);
  const wasPlayingBeforeScrub = useRef(false);

  const fillRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const scrubRefs = useMemo(() => ({ fillRef, thumbRef, timeRef }), []);

  const bumpUi = useCallback(() => setUiTick((t) => t + 1), []);

  const syncChapter = useCallback(
    (ms: number) => {
      paintScrub(scrubRefs, ms);
      const ch = msToChapterIndex(ms);
      const chapter = DEMO_CHAPTERS[ch]!;
      const local = ms - CHAPTER_START_MS[chapter.id];
      const inOutro = chapter.id === "bills" && local / chapter.durationMs > 0.55;
      let changed = false;
      if (ch !== lastChapter.current) {
        lastChapter.current = ch;
        changed = true;
      }
      if (inOutro !== lastOutro.current) {
        lastOutro.current = inOutro;
        changed = true;
      }
      if (changed) bumpUi();
    },
    [bumpUi, scrubRefs],
  );

  const seekToMs = useCallback(
    (ms: number) => {
      const clamped = Math.max(0, Math.min(TOTAL_DEMO_MS, ms));
      elapsedMsRef.current = clamped;
      if (clamped < TOTAL_DEMO_MS) setHasEnded(false);
      syncChapter(clamped);
      bumpUi();
    },
    [bumpUi, syncChapter],
  );

  const replay = useCallback(() => {
    setHasEnded(false);
    elapsedMsRef.current = 0;
    lastChapter.current = -1;
    lastOutro.current = false;
    syncChapter(0);
    setIsPlaying(true);
    bumpUi();
  }, [bumpUi, syncChapter]);

  const seekToProgress = useCallback(
    (p: number) => seekToMs(p * TOTAL_DEMO_MS),
    [seekToMs],
  );

  const chapterIndex = msToChapterIndex(elapsedMsRef.current);
  const chapterId = DEMO_CHAPTERS[chapterIndex]!.id;

  const seekChapter = useCallback(
    (delta: number) => {
      const next = Math.max(0, Math.min(DEMO_CHAPTERS.length - 1, chapterIndex + delta));
      seekToMs(CHAPTER_START_MS[DEMO_CHAPTERS[next]!.id]);
    },
    [chapterIndex, seekToMs],
  );

  const togglePlay = useCallback(() => {
    if (hasEnded) return;
    setIsPlaying((p) => !p);
  }, [hasEnded]);

  const startScrub = useCallback(() => {
    wasPlayingBeforeScrub.current = isPlaying;
    setIsScrubbing(true);
    setIsPlaying(false);
  }, [isPlaying]);

  const endScrub = useCallback(() => {
    setIsScrubbing(false);
    if (wasPlayingBeforeScrub.current) setIsPlaying(true);
    bumpUi();
  }, [bumpUi]);

  useEffect(() => {
    paintScrub(scrubRefs, elapsedMsRef.current);
  }, [scrubRefs]);

  useEffect(() => {
    if (!isPlaying || isScrubbing) {
      lastTick.current = null;
      return;
    }

    let frame = 0;
    function tick(now: number) {
      if (lastTick.current != null) {
        elapsedMsRef.current += (now - lastTick.current) * playbackRate;
        if (elapsedMsRef.current >= TOTAL_DEMO_MS) {
          elapsedMsRef.current = TOTAL_DEMO_MS;
          setIsPlaying(false);
          setHasEnded(true);
          syncChapter(TOTAL_DEMO_MS);
          bumpUi();
          return;
        }
        syncChapter(elapsedMsRef.current);
      }
      lastTick.current = now;
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      lastTick.current = null;
    };
  }, [isPlaying, isScrubbing, playbackRate, syncChapter, bumpUi]);

  const value = useMemo(
    (): TimelineContextValue => ({
      elapsedMsRef,
      uiTick,
      isPlaying,
      isScrubbing,
      hasEnded,
      playbackRate,
      captionsOn,
      chapterIndex,
      chapterId,
      scrubRefs,
      setIsPlaying,
      setPlaybackRate,
      setCaptionsOn,
      togglePlay,
      seekToMs,
      seekToProgress,
      seekChapter,
      startScrub,
      endScrub,
      replay,
      totalMs: TOTAL_DEMO_MS,
      chapters: DEMO_CHAPTERS,
    }),
    [
      uiTick,
      isPlaying,
      isScrubbing,
      hasEnded,
      playbackRate,
      captionsOn,
      chapterIndex,
      chapterId,
      scrubRefs,
      togglePlay,
      seekToMs,
      seekToProgress,
      seekChapter,
      startScrub,
      endScrub,
      replay,
    ],
  );

  return <TimelineContext.Provider value={value}>{children}</TimelineContext.Provider>;
}

export function useDemoTimeline() {
  const ctx = useContext(TimelineContext);
  if (!ctx) throw new Error("useDemoTimeline must be used within DemoTimelineProvider");
  return ctx;
}

/** RAF-driven chapter progress — only call from an active scene layer. */
export function useChapterProgressWhenActive(active: boolean) {
  const { elapsedMsRef, uiTick, isScrubbing } = useDemoTimeline();
  const [progress, setProgress] = useState(() =>
    active ? chapterProgressAt(elapsedMsRef.current) : 0,
  );

  useEffect(() => {
    if (!active) {
      setProgress(0);
      return;
    }

    setProgress(chapterProgressAt(elapsedMsRef.current));

    let frame = 0;
    function tick() {
      setProgress(chapterProgressAt(elapsedMsRef.current));
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, uiTick, isScrubbing, elapsedMsRef]);

  return progress;
}

/** @deprecated Prefer useChapterProgressWhenActive(active) to avoid parent re-renders. */
export function useChapterProgress() {
  return useChapterProgressWhenActive(true);
}

export function useSceneAnimReady(active: boolean, reducedMotion: boolean) {
  const { uiTick } = useDemoTimeline();
  const [ready, setReady] = useState(reducedMotion);

  useEffect(() => {
    if (!active) {
      setReady(false);
      return;
    }
    if (reducedMotion) {
      setReady(true);
      return;
    }
    setReady(false);
    const id = window.setTimeout(() => setReady(true), 500);
    return () => window.clearTimeout(id);
  }, [active, uiTick, reducedMotion]);

  return ready;
}

export type DemoPlayerMachine = TimelineContextValue;
