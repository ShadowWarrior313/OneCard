import type { LucideIcon } from "lucide-react";
import {
  Coffee,
  Film,
  Fuel,
  Hotel,
  Music,
  Plane,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Store,
  Tv,
  UtensilsCrossed,
  Warehouse,
} from "lucide-react";
import type { MerchantGroup } from "@/data/merchants";

/** Consistent merchant mark sizes across the app */
export const MERCHANT_LOGO = {
  tile: 44,
  sector: 44,
  compact: 36,
  hero: 52,
} as const;

export const MERCHANT_GROUP_STYLE: Record<
  MerchantGroup,
  { bg: string; icon: string; Icon: LucideIcon }
> = {
  Groceries: { bg: "bg-emerald-50", icon: "text-emerald-700", Icon: ShoppingCart },
  "Food & drink": { bg: "bg-orange-50", icon: "text-orange-700", Icon: UtensilsCrossed },
  Travel: { bg: "bg-sky-50", icon: "text-sky-700", Icon: Plane },
  Entertainment: { bg: "bg-violet-50", icon: "text-violet-700", Icon: Film },
  Gas: { bg: "bg-amber-50", icon: "text-amber-800", Icon: Fuel },
  Shopping: { bg: "bg-slate-100", icon: "text-slate-700", Icon: ShoppingBag },
  Subscriptions: { bg: "bg-indigo-50", icon: "text-indigo-700", Icon: Tv },
};

/** Per-merchant lucide icon (used when no local PNG asset) */
export const MERCHANT_ICONS: Record<string, LucideIcon> = {
  sector_groceries: ShoppingCart,
  loblaws: Store,
  metro: Store,
  costco: Warehouse,
  sector_dining: UtensilsCrossed,
  tim_hortons: Coffee,
  sector_travel: Plane,
  air_canada: Plane,
  westjet: Plane,
  marriott: Hotel,
  sector_entertainment: Film,
  cineplex: Film,
  sector_gas: Fuel,
  shell: Fuel,
  petro_canada: Fuel,
  sector_shopping: ShoppingBag,
  sector_subscriptions: Tv,
  spotify: Music,
  rogers: Smartphone,
};

export function merchantLucideIcon(
  merchantId: string,
  group: MerchantGroup,
): { Icon: LucideIcon; bg: string; iconClass: string } {
  const groupStyle = MERCHANT_GROUP_STYLE[group];
  const Icon = MERCHANT_ICONS[merchantId] ?? groupStyle.Icon;
  return { Icon, bg: groupStyle.bg, iconClass: groupStyle.icon };
}
