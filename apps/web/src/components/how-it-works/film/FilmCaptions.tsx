"use client";

import { memo, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, type MotionValue } from "framer-motion";
import { CAPTIONS, FILM_EASE } from "./filmConfig";

function captionIndexAt(ms: number): number {
  return CAPTIONS.findIndex((c) => ms >= c.start && ms < c.end);
}

/**
 * Lower-third captions. Updates state only when the active caption changes
 * (a boundary event), never per frame.
 */
function FilmCaptionsBase({ timeMs, enabled }: { timeMs: MotionValue<number>; enabled: boolean }) {
  const [idx, setIdx] = useState(() => captionIndexAt(timeMs.get()));
  const idxRef = useRef(idx);

  useMotionValueEvent(timeMs, "change", (v) => {
    const next = captionIndexAt(v);
    if (next !== idxRef.current) {
      idxRef.current = next;
      setIdx(next);
    }
  });

  if (!enabled) return null;
  const caption = idx >= 0 ? CAPTIONS[idx] : null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[7%] flex justify-center px-6">
      <AnimatePresence mode="wait">
        {caption && (
          <motion.p
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.34, ease: FILM_EASE }}
            className="max-w-[78%] rounded-full bg-black/70 px-4 py-2 text-center text-[13px] font-semibold text-white backdrop-blur-sm sm:text-[15px]"
          >
            {caption.text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export const FilmCaptions = memo(FilmCaptionsBase);
