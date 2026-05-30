"use client";

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from "react";
import {
  DemoCaption,
  DemoChapterTabs,
  DemoPlayerChrome,
} from "@/components/how-it-works/DemoPlayerChrome";
import {
  DEMO_CHAPTERS,
  backdropForChapter,
  captionForChapter,
  chapterProgressAt,
} from "@/components/how-it-works/demoChapters";
import {
  DemoTimelineProvider,
  useChapterProgressWhenActive,
  useDemoTimeline,
  useSceneAnimReady,
} from "@/components/how-it-works/DemoTimelineContext";
import { MockupFrame } from "@/components/how-it-works/MockupFrame";
import { SceneBackdrop, SceneLayer } from "@/components/how-it-works/SceneTransition";
import { usePrefersReducedMotion } from "@/components/how-it-works/usePrefersReducedMotion";
import { IntroScene } from "@/components/how-it-works/scenes/IntroScene";
import { TapScene } from "@/components/how-it-works/scenes/TapScene";
import { RouteScene } from "@/components/how-it-works/scenes/RouteScene";
import { SpendScene } from "@/components/how-it-works/scenes/SpendScene";
import { BillsScene } from "@/components/how-it-works/scenes/BillsScene";
import { DemoReplayPrompt } from "@/components/how-it-works/DemoReplayPrompt";

const CHROME_HIDE_MS = 2500;
const SCENE_FRAME_CLASS =
  "flex items-center justify-center px-3 pt-11 pb-[4.75rem] sm:px-5 sm:pt-12 sm:pb-20";

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function useDemoFullscreen(containerRef: RefObject<HTMLElement | null>) {
  const [fullscreen, setFullscreen] = useState(false);

  const sync = useCallback(() => {
    const el = containerRef.current;
    const doc = document as Document & { webkitFullscreenElement?: Element | null };
    setFullscreen(
      !!el && (doc.fullscreenElement === el || doc.webkitFullscreenElement === el),
    );
  }, [containerRef]);

  useEffect(() => {
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, [sync]);

  const toggle = useCallback(async () => {
    const el = containerRef.current as FullscreenElement | null;
    if (!el) return;
    const doc = document as Document & { webkitExitFullscreen?: () => Promise<void> | void };
    const isFs =
      document.fullscreenElement === el ||
      (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement === el;

    if (isFs) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
      return;
    }

    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    } catch {
      /* ignore */
    }
  }, [containerRef]);

  return { fullscreen, toggleFullscreen: toggle };
}

function sceneKeyFor(chapterId: string, progress: number): string {
  if (chapterId === "bills" && progress > 0.55) return "bills-outro";
  return chapterId;
}

function useActiveSceneKey() {
  const { chapterId, uiTick, elapsedMsRef } = useDemoTimeline();
  void uiTick;
  return sceneKeyFor(chapterId, chapterProgressAt(elapsedMsRef.current));
}

type SceneLayerProps = {
  layerKey: string;
  activeKey: string;
  reducedMotion: boolean;
  children: (props: { progress: number; animReady: boolean }) => React.ReactNode;
};

const DemoSceneLayer = memo(function DemoSceneLayer({
  layerKey,
  activeKey,
  reducedMotion,
  children,
}: SceneLayerProps) {
  const active = activeKey === layerKey;
  const progress = useChapterProgressWhenActive(active);
  const animReady = useSceneAnimReady(active, reducedMotion);

  return (
    <SceneLayer active={active} reducedMotion={reducedMotion} className={SCENE_FRAME_CLASS}>
      <MockupFrame density="player" aspectRatio="auto" className="h-full max-h-full w-full">
        {children({ progress: active ? progress : 0, animReady })}
      </MockupFrame>
    </SceneLayer>
  );
});

function DemoSceneStack({ reducedMotion }: { reducedMotion: boolean }) {
  const activeKey = useActiveSceneKey();

  return (
    <>
      <DemoSceneLayer layerKey="intro" activeKey={activeKey} reducedMotion={reducedMotion}>
        {({ progress, animReady }) => (
          <IntroScene progress={progress} reducedMotion={reducedMotion} animReady={animReady} />
        )}
      </DemoSceneLayer>
      <DemoSceneLayer layerKey="tap" activeKey={activeKey} reducedMotion={reducedMotion}>
        {({ progress, animReady }) => (
          <TapScene progress={progress} reducedMotion={reducedMotion} animReady={animReady} />
        )}
      </DemoSceneLayer>
      <DemoSceneLayer layerKey="route" activeKey={activeKey} reducedMotion={reducedMotion}>
        {({ progress, animReady }) => (
          <RouteScene
            progress={progress}
            density="player"
            reducedMotion={reducedMotion}
            animReady={animReady}
          />
        )}
      </DemoSceneLayer>
      <DemoSceneLayer layerKey="spend" activeKey={activeKey} reducedMotion={reducedMotion}>
        {({ progress, animReady }) => (
          <SpendScene
            progress={progress}
            density="player"
            reducedMotion={reducedMotion}
            animReady={animReady}
          />
        )}
      </DemoSceneLayer>
      <DemoSceneLayer layerKey="bills" activeKey={activeKey} reducedMotion={reducedMotion}>
        {({ progress, animReady }) => (
          <BillsScene
            progress={progress}
            density="player"
            reducedMotion={reducedMotion}
            showOutro={false}
            animReady={animReady}
          />
        )}
      </DemoSceneLayer>
      <DemoSceneLayer layerKey="bills-outro" activeKey={activeKey} reducedMotion={reducedMotion}>
        {({ progress, animReady }) => (
          <BillsScene
            progress={progress}
            density="player"
            reducedMotion={reducedMotion}
            showOutro
            animReady={animReady}
          />
        )}
      </DemoSceneLayer>
    </>
  );
}

function DemoPlayerInner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const machine = useDemoTimeline();
  const { fullscreen, toggleFullscreen } = useDemoFullscreen(containerRef);
  const [chromeVisible, setChromeVisible] = useState(true);
  const hideTimer = useRef<number | null>(null);

  const chapter = DEMO_CHAPTERS[machine.chapterIndex]!;
  void machine.uiTick;
  const progress = chapterProgressAt(machine.elapsedMsRef.current);
  const backdrop = backdropForChapter(chapter, progress);
  const caption = captionForChapter(chapter, progress);
  const outroActive = chapter.id === "bills" && progress > 0.55;

  const bumpChrome = useCallback(() => {
    setChromeVisible(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setChromeVisible(false), CHROME_HIDE_MS);
  }, []);

  useEffect(() => {
    bumpChrome();
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [bumpChrome]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === " ") {
        e.preventDefault();
        if (machine.hasEnded) {
          machine.replay();
        } else {
          machine.togglePlay();
        }
        bumpChrome();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        machine.seekChapter(1);
        bumpChrome();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        machine.seekChapter(-1);
        bumpChrome();
      }
      if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        void toggleFullscreen();
        bumpChrome();
      }
    }

    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
  }, [machine, bumpChrome, toggleFullscreen]);

  function onStageClick(e: ReactMouseEvent<HTMLDivElement>) {
    if (machine.hasEnded) return;
    if ((e.target as HTMLElement).closest("a, button, [data-chrome], input, [role='slider']")) {
      return;
    }
    machine.togglePlay();
    bumpChrome();
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label="OneCard product demo player"
      className={`group/player relative mx-auto w-full max-w-[68.75rem] overflow-hidden rounded-[1.5rem] border border-zinc-200/80 shadow-[0_1px_2px_rgba(11,11,15,0.06),0_24px_48px_-12px_rgba(11,11,15,0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${
        fullscreen ? "fixed inset-0 z-[9999] max-w-none rounded-none" : "aspect-[16/10] max-sm:aspect-[4/5]"
      }`}
      onMouseMove={bumpChrome}
      onTouchStart={bumpChrome}
      onFocus={bumpChrome}
      onClick={onStageClick}
    >
      <SceneLayer active={backdrop === "cinematic"} reducedMotion={reducedMotion}>
        <SceneBackdrop variant="cinematic" />
      </SceneLayer>
      <SceneLayer active={backdrop === "sky"} reducedMotion={reducedMotion}>
        <SceneBackdrop variant="sky" />
      </SceneLayer>

      <div className={`absolute inset-0 overflow-hidden ${outroActive ? "z-[20]" : "z-[1]"}`}>
        <DemoChapterTabs activeIndex={machine.chapterIndex} />
        <DemoSceneStack reducedMotion={reducedMotion} />
      </div>

      {outroActive && (
        <div className="absolute inset-0 z-[25]">
          <SceneLayer active reducedMotion={reducedMotion} className={SCENE_FRAME_CLASS}>
            <MockupFrame density="player" aspectRatio="auto" className="h-full max-h-full w-full">
              <BillsScene reducedMotion={reducedMotion} showOutro progress={1} density="player" animReady />
            </MockupFrame>
          </SceneLayer>
        </div>
      )}

      <DemoCaption
        text={caption}
        visible={machine.captionsOn}
        dark={backdrop === "cinematic"}
      />

      <DemoPlayerChrome
        machine={machine}
        isFullscreen={fullscreen}
        onToggleFullscreen={() => void toggleFullscreen()}
        chromeVisible={chromeVisible || !machine.isPlaying || machine.hasEnded}
        onInteraction={bumpChrome}
      />

      {machine.hasEnded && (
        <DemoReplayPrompt
          onReplay={machine.replay}
          reducedMotion={reducedMotion}
        />
      )}
    </div>
  );
}

export function DemoPlayer() {
  const reducedMotion = usePrefersReducedMotion();
  return (
    <DemoTimelineProvider initialPlaying={!reducedMotion}>
      <DemoPlayerInner />
    </DemoTimelineProvider>
  );
}
