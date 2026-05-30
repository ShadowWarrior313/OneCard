"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMotionValue, useTransform, type MotionValue } from "framer-motion";
import { DURATION_MS, type PlaybackSpeed } from "./filmConfig";

export interface FilmClock {
  /** Current time in ms as a MotionValue — drives all scene animation with zero React renders. */
  timeMs: MotionValue<number>;
  /** Derived 0..1 progress. */
  progress: MotionValue<number>;
  durationMs: number;
  playing: boolean;
  ended: boolean;
  speed: PlaybackSpeed;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  /** Seek to an absolute ms position. */
  seek: (ms: number) => void;
  /** Seek to a 0..1 fraction. */
  seekFraction: (f: number) => void;
  /** Nudge by a relative ms amount (keyboard arrows). */
  nudge: (deltaMs: number) => void;
  replay: () => void;
  setSpeed: (s: PlaybackSpeed) => void;
}

/**
 * The timeline engine. Advances `timeMs` in a single requestAnimationFrame loop,
 * writing only to the MotionValue (no per-frame setState). React state changes
 * only on user actions and at the end boundary.
 */
export function useFilmClock(): FilmClock {
  const timeMs = useMotionValue(0);
  const progress = useTransform(timeMs, [0, DURATION_MS], [0, 1], { clamp: true });

  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [speed, setSpeedState] = useState<PlaybackSpeed>(1);

  const playingRef = useRef(false);
  const speedRef = useRef<PlaybackSpeed>(1);
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);

  // Single rAF loop, restarted only when `playing` flips.
  useEffect(() => {
    if (!playing) return;
    playingRef.current = true;
    lastTsRef.current = 0;

    const tick = (ts: number) => {
      if (!playingRef.current) return;
      if (lastTsRef.current === 0) lastTsRef.current = ts;
      const dt = ts - lastTsRef.current;
      lastTsRef.current = ts;

      const next = timeMs.get() + dt * speedRef.current;
      if (next >= DURATION_MS) {
        timeMs.set(DURATION_MS);
        playingRef.current = false;
        setPlaying(false);
        setEnded(true);
        return;
      }
      timeMs.set(next);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      playingRef.current = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [playing, timeMs]);

  const play = useCallback(() => {
    if (timeMs.get() >= DURATION_MS) {
      timeMs.set(0);
      setEnded(false);
    }
    setPlaying(true);
  }, [timeMs]);

  const pause = useCallback(() => setPlaying(false), []);

  const toggle = useCallback(() => {
    if (playingRef.current) {
      setPlaying(false);
    } else {
      play();
    }
  }, [play]);

  const seek = useCallback(
    (ms: number) => {
      const clamped = Math.min(DURATION_MS, Math.max(0, ms));
      timeMs.set(clamped);
      if (clamped < DURATION_MS && ended) setEnded(false);
    },
    [timeMs, ended],
  );

  const seekFraction = useCallback((f: number) => seek(f * DURATION_MS), [seek]);
  const nudge = useCallback((deltaMs: number) => seek(timeMs.get() + deltaMs), [seek, timeMs]);

  const replay = useCallback(() => {
    timeMs.set(0);
    setEnded(false);
    setPlaying(true);
  }, [timeMs]);

  const setSpeed = useCallback((s: PlaybackSpeed) => {
    speedRef.current = s;
    setSpeedState(s);
  }, []);

  return useMemo(
    () => ({
      timeMs,
      progress,
      durationMs: DURATION_MS,
      playing,
      ended,
      speed,
      play,
      pause,
      toggle,
      seek,
      seekFraction,
      nudge,
      replay,
      setSpeed,
    }),
    [timeMs, progress, playing, ended, speed, play, pause, toggle, seek, seekFraction, nudge, replay, setSpeed],
  );
}
