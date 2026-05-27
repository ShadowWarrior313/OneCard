"use client";

import { MySpendDashboard } from "@/components/spend/MySpendDashboard";

export function PhoneMySpendPanel() {
  return (
    <div className="overflow-y-auto px-3 pb-24 pt-2">
      <MySpendDashboard variant="phone" />
    </div>
  );
}
