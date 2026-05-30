"use client";

import { memo, useRef, type ComponentType, type RefObject } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { CHAPTERS, CROSSFADE_MS, DURATION_MS, STAGE_H, STAGE_W, type Chapter } from "./filmConfig";
import { useFitToContainer } from "./useFitToContainer";
import { FilmCursor } from "./FilmCursor";
import { FilmCaptions } from "./FilmCaptions";
import { OnlineCheckoutScene } from "./scenes/OnlineCheckoutScene";
import { TapToPayScene } from "./scenes/TapToPayScene";
import { RoutingScene } from "./scenes/RoutingScene";
import { WalletScene } from "./scenes/WalletScene";
import { ClosingScene } from "./scenes/ClosingScene";

// Camera (Ken-Burns) keyframes — shared monotonic time axis.
const CAM_T = [0, 6800, 7400, 9000, 9900, 14200, 14900, 15800, 16800, 25600, 26300, 28800, 29600, 33400, 34000, 34700, 35600, 39400, DURATION_MS - 1];
const CAM_S = [1, 1, 1.18, 1.18, 1, 1, 1.16, 1.16, 1, 1, 1.14, 1.14, 1, 1, 1.1, 1.1, 1, 1, 1.06];
const CAM_FX = [500, 500, 430, 430, 500, 500, 760, 760, 500, 500, 500, 500, 500, 500, 278, 278, 500, 500, 500];
const CAM_FY = [312, 312, 430, 430, 312, 312, 300, 300, 312, 312, 262, 262, 312, 312, 384, 384, 312, 312, 300];

function sceneOpacityRange(ch: Chapter, isFirst: boolean, isLast: boolean): [number[], number[]] {
  if (isFirst) return [[ch.start, ch.end, ch.end + CROSSFADE_MS], [1, 1, 0]];
  if (isLast) return [[ch.start, ch.start + CROSSFADE_MS, ch.end], [0, 1, 1]];
  return [
    [ch.start, ch.start + CROSSFADE_MS, ch.end, ch.end + CROSSFADE_MS],
    [0, 1, 1, 0],
  ];
}

const SCENE_COMPONENTS: Record<
  Chapter["id"],
  ComponentType<{ timeMs: MotionValue<number> }>
> = {
  online: OnlineCheckoutScene,
  tap: TapToPayScene,
  routing: RoutingScene,
  wallet: WalletScene,
  closing: ClosingScene,
};

function SceneSlot({
  timeMs,
  chapter,
  isFirst,
  isLast,
}: {
  timeMs: MotionValue<number>;
  chapter: Chapter;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [input, output] = sceneOpacityRange(chapter, isFirst, isLast);
  const opacity = useTransform(timeMs, input, output, { clamp: true });
  const Scene = SCENE_COMPONENTS[chapter.id];
  return (
    <motion.div style={{ opacity }} className="absolute inset-0">
      <Scene timeMs={timeMs} />
    </motion.div>
  );
}

function FilmStageBase({
  timeMs,
  reducedMotion,
  captionsOn,
  fitMode,
  stageRef,
}: {
  timeMs: MotionValue<number>;
  reducedMotion: boolean;
  captionsOn: boolean;
  fitMode: "width" | "contain";
  stageRef: RefObject<HTMLDivElement>;
}) {
  const measureRef = useRef<HTMLDivElement>(null);
  const scale = useFitToContainer(measureRef, fitMode);

  // Camera transform (disabled under reduced motion).
  const camScale = useTransform(timeMs, CAM_T, CAM_S, { clamp: true });
  const camFx = useTransform(timeMs, CAM_T, CAM_FX, { clamp: true });
  const camFy = useTransform(timeMs, CAM_T, CAM_FY, { clamp: true });
  const camX = useTransform(() => STAGE_W / 2 - camFx.get() * camScale.get());
  const camY = useTransform(() => STAGE_H / 2 - camFy.get() * camScale.get());

  const cameraStyle = reducedMotion ? {} : { x: camX, y: camY, scale: camScale };

  return (
    <div
      ref={measureRef}
      className="relative w-full overflow-hidden rounded-2xl bg-black ring-1 ring-zinc-200"
      style={fitMode === "contain" ? { height: "100%" } : { height: STAGE_H * scale }}
    >
      {/* Centering wrapper for fullscreen letterbox */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          ref={stageRef}
          className="relative origin-top-left"
          style={{
            width: STAGE_W,
            height: STAGE_H,
            transform: `scale(${scale})`,
            transformOrigin: fitMode === "contain" ? "center center" : "top left",
            position: fitMode === "contain" ? "relative" : "absolute",
            left: fitMode === "contain" ? undefined : 0,
            top: fitMode === "contain" ? undefined : 0,
          }}
        >
          {/* Camera layer (zoom) wraps the scenes only */}
          <motion.div style={cameraStyle} className="absolute inset-0 origin-top-left">
            <div className="pointer-events-none absolute inset-0">
              {CHAPTERS.map((ch, i) => (
                <SceneSlot
                  key={ch.id}
                  timeMs={timeMs}
                  chapter={ch}
                  isFirst={i === 0}
                  isLast={i === CHAPTERS.length - 1}
                />
              ))}
            </div>
          </motion.div>

          {/* Guided cursor — in stage coords, above scenes, not zoomed */}
          <FilmCursor timeMs={timeMs} reducedMotion={reducedMotion} />
        </div>
      </div>

      {/* Captions + disclaimer in unscaled container space (always legible) */}
      <FilmCaptions timeMs={timeMs} enabled={captionsOn} />
      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold text-white/80 backdrop-blur-sm sm:text-[11px]">
        Demo only — not a licensed issuer
      </span>
    </div>
  );
}

export const FilmStage = memo(FilmStageBase);
