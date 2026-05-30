"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export type MockupFrameDensity = "player" | "card" | "modal";

const DESIGN_WIDTH: Record<MockupFrameDensity, number> = {
  player: 360,
  card: 300,
  modal: 380,
};

/** Fit-to-container mockup wrapper — clipping is structurally impossible. */
export function MockupFrame({
  children,
  density = "player",
  aspectRatio = "4 / 3",
  className = "",
  innerClassName = "",
}: {
  children: ReactNode;
  density?: MockupFrameDensity;
  aspectRatio?: string;
  className?: string;
  innerClassName?: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const frame = frameRef.current;
    const inner = innerRef.current;
    if (!frame || !inner) return;

    const update = () => {
      const pad = density === "card" ? 12 : 20;
      const availW = frame.clientWidth - pad;
      const availH = frame.clientHeight - pad;
      const cw = inner.offsetWidth || DESIGN_WIDTH[density];
      const ch = inner.offsetHeight || cw * 0.75;
      if (availW <= 0 || availH <= 0) return;
      setScale(Math.min(1, availW / cw, availH / ch));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(frame);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [density, children]);

  return (
    <div
      ref={frameRef}
      className={`relative w-full overflow-hidden ${className}`.trim()}
      style={
        aspectRatio === "auto"
          ? { minHeight: density === "card" ? "10rem" : undefined }
          : { aspectRatio, minHeight: density === "card" ? "10rem" : undefined }
      }
    >
      <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-3">
        <div
          ref={innerRef}
          className={`origin-center ${innerClassName}`.trim()}
          style={{
            transform: `scale(${scale})`,
            width: DESIGN_WIDTH[density],
            maxWidth: "100%",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function FloatingPanel({
  title,
  children,
  className = "",
  enlargeReady = false,
  enlargePressed = false,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  enlargeReady?: boolean;
  enlargePressed?: boolean;
}) {
  return (
    <div
      className={`w-full overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(11,11,15,0.06),0_24px_48px_-12px_rgba(11,11,15,0.14)] ring-1 ring-zinc-200/80 ${className}`.trim()}
    >
      {title && (
        <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50/90 px-3 py-2">
          <div className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-zinc-300" aria-hidden />
            <span className="h-2 w-2 rounded-full bg-zinc-300" aria-hidden />
            <span
              data-demo-enlarge-btn
              className={`h-2 w-2 rounded-full transition-transform duration-150 ${
                enlargeReady ? "bg-emerald-400 ring-2 ring-emerald-400/35" : "bg-zinc-300"
              } ${enlargePressed ? "scale-90" : "scale-100"}`}
              aria-hidden
            />
          </div>
          <span className="truncate text-[0.65rem] font-medium text-brand-muted">{title}</span>
        </div>
      )}
      <div className="p-3">{children}</div>
    </div>
  );
}
