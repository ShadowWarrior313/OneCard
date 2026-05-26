import type { LucideIcon } from "lucide-react";
import {
  Coffee,
  Film,
  Fuel,
  GraduationCap,
  HeartPulse,
  Hotel,
  Music,
  Plane,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Store,
  TrainFront,
  Tv,
  UtensilsCrossed,
  Warehouse,
  Zap,
  CircleDot,
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
  "Health & pharmacy": { bg: "bg-rose-50", icon: "text-rose-700", Icon: HeartPulse },
  Transportation: { bg: "bg-cyan-50", icon: "text-cyan-700", Icon: TrainFront },
  Education: { bg: "bg-blue-50", icon: "text-blue-700", Icon: GraduationCap },
  "Home & utilities": { bg: "bg-yellow-50", icon: "text-yellow-800", Icon: Zap },
  Other: { bg: "bg-stone-100", icon: "text-stone-600", Icon: CircleDot },
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
  sector_health: HeartPulse,
  sector_transport: TrainFront,
  sector_education: GraduationCap,
  sector_utilities: Zap,
  sector_other: CircleDot,
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
