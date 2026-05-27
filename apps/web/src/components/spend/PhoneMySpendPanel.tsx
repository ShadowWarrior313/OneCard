"use client";

import { MySpendDashboard } from "@/components/spend/MySpendDashboard";

/** Compact My Spend view inside the phone demo shell. */
export function PhoneMySpendPanel() {
  return (
    <div className="w-full min-w-0 max-w-full pb-4">
      <MySpendDashboard variant="phone" />
    </div>
  );
}
