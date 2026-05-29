"use client";

import {
  OneCardFace,
  ONECARD_SHOWCASE_HEIGHT_PX,
  ONECARD_SHOWCASE_WIDTH_PX,
} from "@/components/OneCardFace";

/** ~0.66 → ~145px wide card inside the demo phone shell */
const PHONE_INNER_SCALE = 0.66;

type DemoOneCardProps = {
  className?: string;
  /** Uniform scale from homepage showcase size (13.75rem wide) */
  scale?: number;
};

/**
 * Renders OneCard at the exact homepage showcase size, then scales uniformly
 * so type, padding, and spacing stay proportional (no flex squish).
 */
export function DemoOneCard({
  className = "",
  scale = PHONE_INNER_SCALE,
}: DemoOneCardProps) {
  const outerW = ONECARD_SHOWCASE_WIDTH_PX * scale;
  const outerH = ONECARD_SHOWCASE_HEIGHT_PX * scale;

  return (
    <div
      className={`relative mx-auto shrink-0 ${className}`.trim()}
      style={{ width: outerW, height: outerH }}
    >
      <div
        className="absolute left-1/2 top-0"
        style={{
          width: ONECARD_SHOWCASE_WIDTH_PX,
          height: ONECARD_SHOWCASE_HEIGHT_PX,
          transform: `translateX(-50%) scale(${scale})`,
          transformOrigin: "top center",
        }}
      >
        <OneCardFace variant="showcase" className="shadow-[0_24px_64px_rgba(14,116,144,0.28)]" />
      </div>
    </div>
  );
}
