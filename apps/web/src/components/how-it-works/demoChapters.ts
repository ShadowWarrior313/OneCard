export type ChapterId = "intro" | "tap" | "route" | "spend" | "bills";

export type DemoChapter = {
  id: ChapterId;
  tabLabel: string | null;
  durationMs: number;
  caption: string;
  backdrop: "cinematic" | "sky";
};

export const DEMO_CHAPTERS: DemoChapter[] = [
  {
    id: "intro",
    tabLabel: null,
    durationMs: 4000,
    caption: "One wallet. One tap. Smarter every time.",
    backdrop: "cinematic",
  },
  {
    id: "tap",
    tabLabel: "Tap",
    durationMs: 6000,
    caption: "Tap once at checkout — the same contactless tap you already use.",
    backdrop: "sky",
  },
  {
    id: "route",
    tabLabel: "Route",
    durationMs: 8000,
    caption:
      "We read the merchant category and pick the best card in your wallet — in milliseconds.",
    backdrop: "sky",
  },
  {
    id: "spend",
    tabLabel: "Spend",
    durationMs: 8000,
    caption:
      "Rewards still post on your real accounts — and you see exactly where they came from.",
    backdrop: "sky",
  },
  {
    id: "bills",
    tabLabel: "Bills",
    durationMs: 6000,
    caption: "Recurring bills routed to the card that earns most — on autopilot.",
    backdrop: "sky",
  },
];

export const OUTRO_CAPTION = "Tap once. Route smarter. Earn more.";

export function captionForChapter(
  chapter: DemoChapter,
  chapterProgress: number,
): string {
  if (chapter.id === "bills" && chapterProgress > 0.55) {
    return OUTRO_CAPTION;
  }
  return chapter.caption;
}

export function backdropForChapter(
  chapter: DemoChapter,
  chapterProgress: number,
): "cinematic" | "sky" {
  if (chapter.id === "intro") return "cinematic";
  if (chapter.id === "bills" && chapterProgress > 0.55) return "cinematic";
  return chapter.backdrop;
}

export const TOTAL_DEMO_MS = DEMO_CHAPTERS.reduce((sum, c) => sum + c.durationMs, 0);

export const CHAPTER_START_MS: Record<ChapterId, number> = DEMO_CHAPTERS.reduce(
  (acc, chapter, index) => {
    const start = DEMO_CHAPTERS.slice(0, index).reduce((s, c) => s + c.durationMs, 0);
    acc[chapter.id] = start;
    return acc;
  },
  {} as Record<ChapterId, number>,
);

export function msToChapterIndex(ms: number): number {
  if (ms >= TOTAL_DEMO_MS) return DEMO_CHAPTERS.length - 1;
  const t = Math.max(0, ms);
  for (let i = DEMO_CHAPTERS.length - 1; i >= 0; i--) {
    const chapter = DEMO_CHAPTERS[i]!;
    if (t >= CHAPTER_START_MS[chapter.id]) return i;
  }
  return 0;
}

export function msToChapterId(ms: number): ChapterId {
  return DEMO_CHAPTERS[msToChapterIndex(ms)]!.id;
}

export function chapterProgressAt(ms: number): number {
  const capped = Math.max(0, Math.min(TOTAL_DEMO_MS, ms));
  const t =
    capped >= TOTAL_DEMO_MS
      ? TOTAL_DEMO_MS - 1
      : ((capped % TOTAL_DEMO_MS) + TOTAL_DEMO_MS) % TOTAL_DEMO_MS;
  const index = msToChapterIndex(t);
  const chapter = DEMO_CHAPTERS[index]!;
  const local = t - CHAPTER_START_MS[chapter.id];
  return Math.max(0, Math.min(1, local / chapter.durationMs));
}

export function formatDemoTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
