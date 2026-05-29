"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, Minimize2, Pause, Play } from "lucide-react";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { DemoPhoneCanvas, type DemoPhoneScreen } from "@/components/demo/DemoPhoneCanvas";
import { type SlideDirection } from "@/components/demo/DemoPhoneSlide";
import { PosTapScene, tapStageAtProgress, type TapStage } from "./PosTapScene";
import { useUserProfile } from "@/context/UserProfileContext";

type Phase = "tap" | "routing" | "wallet" | "spend" | "bills";
type StepTab = "Tap" | "Route" | "Spend" | "Bills";

const EASE = [0.22, 1, 0.36, 1] as const;
const SLIDE_SPRING = { type: "spring" as const, stiffness: 420, damping: 38 };

const PHASE_ORDER: Phase[] = ["tap", "routing", "wallet", "spend", "bills"];

const PHASE_MS: Record<Phase, number> = {
  tap: 8500,
  routing: 7000,
  wallet: 2800,
  spend: 9500,
  bills: 7000,
};

const TOTAL_MS = PHASE_ORDER.reduce((sum, p) => sum + PHASE_MS[p], 0);
/** Logo wipe at the start of the film */
const INTRO_MS = 2800;
/** Beat after logo before scene content appears */
const CONTENT_REVEAL_DELAY_MS = 400;
const FILM_CONTENT_START_MS = INTRO_MS + CONTENT_REVEAL_DELAY_MS;

const PHASE_START: Record<Phase, number> = {
  tap: 0,
  routing: PHASE_MS.tap,
  wallet: PHASE_MS.tap + PHASE_MS.routing,
  spend: PHASE_MS.tap + PHASE_MS.routing + PHASE_MS.wallet,
  bills: PHASE_MS.tap + PHASE_MS.routing + PHASE_MS.wallet + PHASE_MS.spend,
};

const DEMO_MERCHANT = "Loblaws";
const DEMO_AMOUNT = "$118.40";

const PHASE_COPY: Record<
  Phase,
  { eyebrow: string; title: string; subtitle: string; tab: StepTab }
> = {
  tap: {
    eyebrow: "Checkout",
    title: "Pay with Wallet & Face ID",
    subtitle: `Hold your iPhone near the reader — OneCard routes at ${DEMO_MERCHANT}.`,
    tab: "Tap",
  },
  routing: {
    eyebrow: "Routing engine",
    title: "Amex Cobalt wins groceries",
    subtitle: "One scroll through your wallet — best card selected once.",
    tab: "Route",
  },
  wallet: {
    eyebrow: "Your wallet",
    title: "Open My Spend",
    subtitle: "Tap through the app — same wallet you use every day.",
    tab: "Spend",
  },
  spend: {
    eyebrow: "My Spend",
    title: "Tap a card in your wallet",
    subtitle: "See spend for the card that earned on your last trip — same wallet as the app.",
    tab: "Spend",
  },
  bills: {
    eyebrow: "Bill pay",
    title: "Pay statements in one place",
    subtitle: "Due dates, balances, and payments without opening each issuer app.",
    tab: "Bills",
  },
};

const TABS: StepTab[] = ["Tap", "Route", "Spend", "Bills"];

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function isNativeFullscreen(el: HTMLElement | null) {
  if (!el) return false;
  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  return doc.fullscreenElement === el || doc.webkitFullscreenElement === el;
}

function useDemoFullscreen(containerRef: RefObject<HTMLElement | null>) {
  const [fullscreen, setFullscreen] = useState(false);

  const syncFullscreen = useCallback(() => {
    const el = containerRef.current;
    setFullscreen(isNativeFullscreen(el) || el?.dataset.pseudoFullscreen === "true");
  }, [containerRef]);

  useEffect(() => {
    document.addEventListener("fullscreenchange", syncFullscreen);
    document.addEventListener("webkitfullscreenchange", syncFullscreen);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      document.removeEventListener("webkitfullscreenchange", syncFullscreen);
    };
  }, [syncFullscreen]);

  const exitFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;

    if (isNativeFullscreen(el)) {
      const doc = document as Document & { webkitExitFullscreen?: () => Promise<void> | void };
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
    }

    delete el.dataset.pseudoFullscreen;
    document.body.style.overflow = "";
    setFullscreen(false);
  }, [containerRef]);

  const enterFullscreen = useCallback(async () => {
    const el = containerRef.current as FullscreenElement | null;
    if (!el) return;

    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
        return;
      }
      if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
        return;
      }
    } catch {
      // Fall through to pseudo-fullscreen (iOS Safari, etc.)
    }

    el.dataset.pseudoFullscreen = "true";
    document.body.style.overflow = "hidden";
    setFullscreen(true);
  }, [containerRef]);

  const toggleFullscreen = useCallback(async () => {
    if (fullscreen) await exitFullscreen();
    else await enterFullscreen();
  }, [enterFullscreen, exitFullscreen, fullscreen]);

  useEffect(() => {
    if (!fullscreen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && containerRef.current?.dataset.pseudoFullscreen === "true") {
        void exitFullscreen();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [containerRef, exitFullscreen, fullscreen]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
      if (containerRef.current) delete containerRef.current.dataset.pseudoFullscreen;
    };
  }, [containerRef]);

  return { fullscreen, toggleFullscreen, exitFullscreen };
}

function normalizeMs(ms: number): number {
  return ((ms % TOTAL_MS) + TOTAL_MS) % TOTAL_MS;
}

function msToPhase(ms: number): Phase {
  const t = normalizeMs(ms);
  for (let i = PHASE_ORDER.length - 1; i >= 0; i--) {
    const phase = PHASE_ORDER[i]!;
    if (t >= PHASE_START[phase]) return phase;
  }
  return "tap";
}

function phaseToTab(phase: Phase): StepTab {
  return PHASE_COPY[phase].tab;
}

function phaseToPhoneScreen(phase: Phase): DemoPhoneScreen | null {
  if (phase === "tap") return null;
  return phase;
}

const PHONE_PHASES: DemoPhoneScreen[] = ["routing", "wallet", "spend", "bills"];

function phoneSlideDirection(from: Phase, to: Phase): SlideDirection {
  const a = PHONE_PHASES.indexOf(from as DemoPhoneScreen);
  const b = PHONE_PHASES.indexOf(to as DemoPhoneScreen);
  if (a < 0 || b < 0) return "forward";
  return b >= a ? "forward" : "back";
}

function localPhaseMs(ms: number): number {
  const t = normalizeMs(ms);
  const phase = msToPhase(ms);
  return t - PHASE_START[phase];
}

function phaseProgress(ms: number): number {
  const phase = msToPhase(ms);
  const local = localPhaseMs(ms);
  const duration = PHASE_MS[phase];
  if (phase === "tap" && local < FILM_CONTENT_START_MS) return 0;
  if (phase === "tap") {
    return Math.min(1, (local - FILM_CONTENT_START_MS) / (duration - FILM_CONTENT_START_MS));
  }
  return Math.min(1, local / duration);
}

function introProgress(ms: number): number {
  const t = normalizeMs(ms);
  return Math.min(1, t / INTRO_MS);
}

function sceneContentVisibleAt(ms: number): boolean {
  return normalizeMs(ms) >= FILM_CONTENT_START_MS;
}

function tapProgressInPhase(ms: number): number {
  if (msToPhase(ms) !== "tap") return 0;
  const local = localPhaseMs(ms);
  if (local < FILM_CONTENT_START_MS) return 0;
  return Math.min(1, (local - FILM_CONTENT_START_MS) / (PHASE_MS.tap - FILM_CONTENT_START_MS));
}

/** Scales stage content to fill available viewport in fullscreen */
function StageScaler({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!enabled) {
      setScale(1);
      return;
    }

    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;

    const update = () => {
      const vw = viewport.clientWidth;
      const vh = viewport.clientHeight;
      const cw = content.offsetWidth;
      const ch = content.offsetHeight;
      if (vw <= 0 || vh <= 0 || cw <= 0 || ch <= 0) return;

      const pad = 12;
      const next = Math.min((vw - pad) / cw, (vh - pad) / ch);
      setScale(Math.max(0.85, Math.min(next, 3)));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(viewport);
    ro.observe(content);
    window.addEventListener("orientationchange", update);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", update);
      window.removeEventListener("resize", update);
    };
  }, [enabled, children]);

  if (!enabled) return <>{children}</>;

  return (
    <div
      ref={viewportRef}
      className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden"
    >
      <div
        ref={contentRef}
        className="w-[22rem] shrink-0 origin-center px-1 py-2 sm:px-2"
        style={{ transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}

function DemoDeviceCanvas({
  children,
  introProgress: introP,
  paused,
  onTogglePause,
  showTapContent,
  fullscreen,
}: {
  children: ReactNode;
  introProgress: number;
  paused: boolean;
  onTogglePause: () => void;
  showTapContent: boolean;
  fullscreen: boolean;
}) {
  const showIntro = introP > 0 && introP < 1;
  const logoWipe = Math.min(1, introP / 0.42);
  // Hold full logo, then fade overlay out at the very end
  const introOpacity = showIntro
    ? introP < 0.72
      ? 1
      : 1 - (introP - 0.72) / 0.28
    : 0;

  return (
    <button
      type="button"
      onClick={onTogglePause}
      aria-label={paused ? "Play demo" : "Pause demo"}
      className={`group/canvas relative w-full min-w-0 text-left ${
        fullscreen
          ? "flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-none bg-gradient-to-br from-sky-200/70 via-sky-100 to-blue-100 p-1.5 sm:p-2"
          : "min-h-[26rem] overflow-visible rounded-2xl bg-gradient-to-br from-sky-200/70 via-sky-100 to-blue-100 p-2.5 sm:min-h-[28rem] sm:p-4 md:p-5"
      }`}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/40 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-sky-300/30 blur-3xl"
        aria-hidden
      />

      {/* Logo wipe overlay — stays up until intro finishes */}
      {introOpacity > 0.01 && (
        <div
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-200/98 via-sky-100 to-blue-100"
          style={{ opacity: introOpacity }}
        >
          <div className="overflow-hidden px-6 sm:px-8">
            <div
              className="flex items-center gap-[clamp(0.75rem,3vmin,1.25rem)] transition-[clip-path] duration-700 ease-out"
              style={{ clipPath: `inset(0 ${100 - logoWipe * 100}% 0 0)` }}
            >
              <Image
                src="/brand-mark.png"
                alt=""
                width={80}
                height={52}
                className="h-[clamp(2.75rem,14vmin,4.5rem)] w-auto"
              />
              <span className="text-[clamp(1.75rem,9vmin,2.75rem)] font-semibold tracking-tight text-brand-ink">
                OneCard
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Pause hint — visible on tap/hover */}
      <div
        className={`pointer-events-none absolute inset-0 z-30 flex items-center justify-center rounded-2xl transition-opacity duration-200 ${
          paused
            ? "opacity-100"
            : "opacity-0 group-hover/canvas:opacity-100 group-active/canvas:opacity-100"
        }`}
        aria-hidden
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-ink/75 text-white shadow-lg backdrop-blur-sm sm:h-12 sm:w-12">
          {paused ? <Play className="h-5 w-5 pl-0.5" /> : <Pause className="h-5 w-5" />}
        </span>
      </div>

      <motion.div
        layout
        className={`relative mx-auto min-w-0 overflow-visible bg-white shadow-[0_12px_40px_rgba(14,116,144,0.1)] ring-1 ring-sky-200/60 ${
          fullscreen
            ? "flex min-h-0 w-full max-w-none flex-1 flex-col rounded-lg"
            : "max-w-full rounded-xl px-3 pb-5 pt-4 sm:px-5 sm:pb-7 sm:pt-6"
        }`}
      >
        <StageScaler enabled={fullscreen}>
          {showTapContent ? (
            children
          ) : (
            <div
              className={fullscreen ? "min-h-[20rem]" : "min-h-[24rem] sm:min-h-[26rem]"}
              aria-hidden
            />
          )}
        </StageScaler>
      </motion.div>
    </button>
  );
}

function WindowChrome({
  paused,
  onTogglePause,
  fullscreen,
  onToggleFullscreen,
}: {
  paused: boolean;
  onTogglePause: () => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-zinc-50/80 px-3 py-2.5 sm:px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex shrink-0 gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
        </div>
        <span className="truncate text-[0.65rem] font-medium text-brand-muted sm:text-xs">
          OneCard · Live routing
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-[0.65rem] font-semibold text-brand-ink transition hover:bg-zinc-50 sm:text-xs"
          aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {fullscreen ? (
            <>
              <Minimize2 className="h-3 w-3" />
              <span className="hidden sm:inline">Exit</span>
            </>
          ) : (
            <>
              <Maximize2 className="h-3 w-3" />
              <span className="hidden sm:inline">Fullscreen</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onTogglePause}
          className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-[0.65rem] font-semibold text-brand-ink transition hover:bg-zinc-50 sm:text-xs"
        >
          {paused ? (
            <>
              <Play className="h-3 w-3" />
              Play
            </>
          ) : (
            <>
              <Pause className="h-3 w-3" />
              Pause
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function StepTabs({ active }: { active: StepTab }) {
  return (
    <div className="flex shrink-0 gap-0.5 border-b border-zinc-200 bg-white px-2 py-1.5 sm:gap-1 sm:px-4 sm:py-2">
      {TABS.map((tab) => (
        <span
          key={tab}
          className={`flex-1 rounded-md px-2 py-1.5 text-center text-[0.7rem] font-semibold transition-colors sm:flex-none sm:px-3 sm:text-xs ${
            tab === active ? "bg-brand-ink text-white" : "text-brand-muted"
          }`}
        >
          {tab}
        </span>
      ))}
    </div>
  );
}

const TAP_SLIDE = {
  enter: { x: "100%", opacity: 1 },
  center: { x: 0, opacity: 1 },
  exit: { x: "-28%", opacity: 1 },
};

function DemoPhoneStage({
  phase,
  phaseProgress,
  sceneVisible,
  cardholderName,
  tapStage,
  merchant,
  amount,
}: {
  phase: Phase;
  phaseProgress: number;
  sceneVisible: boolean;
  cardholderName: string;
  tapStage: TapStage;
  merchant: string;
  amount: string;
}) {
  const prevPhase = useRef(phase);
  const phoneScreen = phaseToPhoneScreen(phase);
  const tapDir: SlideDirection =
    phase === "tap" || prevPhase.current === "tap" ? "forward" : phoneSlideDirection(prevPhase.current, phase);

  useEffect(() => {
    prevPhase.current = phase;
  }, [phase]);

  if (phase === "tap") {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="tap"
          variants={TAP_SLIDE}
          initial="enter"
          animate="center"
          exit="exit"
          transition={SLIDE_SPRING}
          className="min-w-0 overflow-visible"
          style={{ opacity: sceneVisible ? 1 : 0 }}
        >
          <PosTapScene
            cardholderName={cardholderName}
            stage={tapStage}
            contentVisible={sceneVisible}
            merchantName={merchant}
            amount={amount}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  if (!phoneScreen) return null;

  return (
    <div style={{ opacity: sceneVisible ? 1 : 0 }}>
      <DemoPhoneCanvas
        screen={phoneScreen}
        progress={phaseProgress}
        merchant={merchant}
        amount={amount}
      />
    </div>
  );
}

function DemoScrubber({
  progress,
  onScrub,
  onScrubStart,
  onScrubEnd,
}: {
  progress: number;
  onScrub: (p: number) => void;
  onScrubStart: () => void;
  onScrubEnd: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const pct = `${Math.max(progress * 100, 0)}%`;

  function positionToProgress(clientX: number) {
    const track = trackRef.current;
    if (!track) return progress;
    const rect = track.getBoundingClientRect();
    const p = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(1, p));
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    dragging.current = true;
    onScrubStart();
    onScrub(positionToProgress(e.clientX));
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    onScrub(positionToProgress(e.clientX));
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
      aria-valuenow={Math.round(progress * 100)}
      tabIndex={0}
      className="group relative h-4 cursor-pointer touch-none rounded-full bg-sky-100 sm:h-3"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") onScrub(Math.min(1, progress + 0.02));
        if (e.key === "ArrowLeft") onScrub(Math.max(0, progress - 0.02));
      }}
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-sky-500"
        style={{ width: pct }}
      />
      <div
        className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-sky-600 shadow-sm group-hover:scale-110 sm:h-3.5 sm:w-3.5"
        style={{ left: pct }}
      />
    </div>
  );
}

export function OneCardDemoFilm() {
  const { cardholderName } = useUserProfile();
  const containerRef = useRef<HTMLDivElement>(null);
  const { fullscreen, toggleFullscreen } = useDemoFullscreen(containerRef);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [paused, setPaused] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const lastTick = useRef<number | null>(null);
  const wasPlayingBeforeScrub = useRef(false);

  const phase = msToPhase(elapsedMs);
  const copy = PHASE_COPY[phase];
  const progress = (elapsedMs % TOTAL_MS) / TOTAL_MS;
  const introP = introProgress(elapsedMs);
  const sceneVisible = sceneContentVisibleAt(elapsedMs);
  const phaseProgress01 = phaseProgress(elapsedMs);
  const tapStage: TapStage =
    phase === "tap" ? tapStageAtProgress(tapProgressInPhase(elapsedMs)) : "idle";

  const togglePause = useCallback(() => setPaused((p) => !p), []);

  useEffect(() => {
    if (paused || scrubbing) {
      lastTick.current = null;
      return;
    }

    let frame: number;
    function tick(now: number) {
      if (lastTick.current != null) {
        const delta = now - lastTick.current;
        setElapsedMs((ms) => ms + delta);
      }
      lastTick.current = now;
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      lastTick.current = null;
    };
  }, [paused, scrubbing]);

  const scrubTo = useCallback((p: number) => {
    setElapsedMs(p * TOTAL_MS);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`flex w-full min-w-0 max-w-full flex-col bg-white ${
        fullscreen
          ? "fixed inset-0 z-[9999] h-[100dvh] max-h-[100dvh] overflow-hidden rounded-none border-0 shadow-none landscape:flex-row landscape:items-stretch"
          : "min-h-0 overflow-x-hidden rounded-xl border border-zinc-200 shadow-sm sm:min-h-[32rem]"
      }`}
      style={
        fullscreen
          ? {
              paddingTop: "env(safe-area-inset-top)",
              paddingBottom: "env(safe-area-inset-bottom)",
              paddingLeft: "env(safe-area-inset-left)",
              paddingRight: "env(safe-area-inset-right)",
            }
          : undefined
      }
    >
      <div
        className={`flex min-h-0 flex-col ${
          fullscreen ? "landscape:w-[min(20rem,36vw)] landscape:shrink-0 landscape:overflow-y-auto" : ""
        }`}
      >
        <WindowChrome
          paused={paused}
          onTogglePause={togglePause}
          fullscreen={fullscreen}
          onToggleFullscreen={toggleFullscreen}
        />
        <StepTabs active={phaseToTab(phase)} />

        <div
          className={`shrink-0 border-b border-zinc-100 px-3 py-3 sm:px-5 sm:py-5 ${
            fullscreen ? "hidden landscape:block landscape:px-4 landscape:py-3" : ""
          }`}
        >
          <div className="min-w-0">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-brand-muted">
              {copy.eyebrow}
            </p>
            <p
              className={`mt-1 break-words font-semibold text-brand-ink ${
                fullscreen ? "text-sm sm:text-base landscape:text-sm" : "text-base sm:text-lg"
              }`}
            >
              {copy.title}
            </p>
            <p
              className={`mt-1.5 break-words leading-relaxed text-brand-muted ${
                fullscreen ? "text-xs landscape:line-clamp-2" : "text-sm"
              }`}
            >
              {copy.subtitle}
            </p>
          </div>
        </div>
      </div>

      <div
        className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${
          fullscreen ? "p-1.5 sm:p-2" : "px-2 py-2 sm:px-5 sm:py-5"
        }`}
      >
        <DemoDeviceCanvas
          introProgress={introP}
          paused={paused}
          onTogglePause={togglePause}
          showTapContent={sceneVisible}
          fullscreen={fullscreen}
        >
          <DemoPhoneStage
            phase={phase}
            phaseProgress={phaseProgress01}
            sceneVisible={sceneVisible}
            cardholderName={cardholderName}
            tapStage={tapStage}
            merchant={DEMO_MERCHANT}
            amount={DEMO_AMOUNT}
          />
        </DemoDeviceCanvas>

        <footer
          className={`shrink-0 border-t border-zinc-100 px-3 py-3 sm:px-5 ${
            fullscreen ? "landscape:border-t-0 landscape:px-0 landscape:pt-2" : ""
          }`}
        >
          <DemoScrubber
            progress={progress}
            onScrub={scrubTo}
            onScrubStart={() => {
              wasPlayingBeforeScrub.current = !paused;
              setScrubbing(true);
              setPaused(true);
            }}
            onScrubEnd={() => {
              setScrubbing(false);
              if (wasPlayingBeforeScrub.current) {
                setPaused(false);
              }
            }}
          />
          <p className="mt-2 text-center text-[0.6rem] leading-relaxed text-brand-muted sm:text-[0.65rem]">
            Tap video to pause · drag bar to scrub
            {!fullscreen && " · fullscreen for landscape"}
          </p>
        </footer>
      </div>
    </div>
  );
}
