"use client";

import { AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import { DemoPhoneShell } from "@/components/demo/DemoPhoneShell";
import { DemoPhoneSlide, type SlideDirection } from "@/components/demo/DemoPhoneSlide";
import {
  AppRoutingView,
  BillsScene,
  SpendScene,
  WalletHubScene,
} from "@/components/demo/OneCardDemoScenes";

export type DemoPhoneScreen = "routing" | "wallet" | "spend" | "bills";

const SCREEN_ORDER: DemoPhoneScreen[] = ["routing", "wallet", "spend", "bills"];

function slideDirection(from: DemoPhoneScreen, to: DemoPhoneScreen): SlideDirection {
  const a = SCREEN_ORDER.indexOf(from);
  const b = SCREEN_ORDER.indexOf(to);
  if (a < 0 || b < 0) return "forward";
  return b >= a ? "forward" : "back";
}

export function DemoPhoneCanvas({
  screen,
  progress,
  merchant,
  amount,
}: {
  screen: DemoPhoneScreen;
  progress: number;
  merchant: string;
  amount: string;
}) {
  const prevScreen = useRef(screen);
  const direction = slideDirection(prevScreen.current, screen);

  useEffect(() => {
    prevScreen.current = screen;
  }, [screen]);

  return (
    <DemoPhoneShell className="!overflow-hidden !p-0">
      <div className="relative min-h-[19rem] flex-1 overflow-hidden">
        <AnimatePresence initial={false} custom={direction}>
          <DemoPhoneSlide screenKey={screen} direction={direction}>
            {screen === "routing" && (
              <AppRoutingView progress={progress} merchant={merchant} amount={amount} />
            )}
            {screen === "wallet" && <WalletHubScene progress={progress} />}
            {screen === "spend" && <SpendScene progress={progress} />}
            {screen === "bills" && <BillsScene progress={progress} />}
          </DemoPhoneSlide>
        </AnimatePresence>
      </div>
    </DemoPhoneShell>
  );
}
