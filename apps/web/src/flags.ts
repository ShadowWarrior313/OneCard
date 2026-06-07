/**
 * Feature flags.
 *
 * The rewards-intelligence hub is built backend-first and ships with its UI
 * OFF by default. With the flag off, the public website is byte-for-byte
 * unchanged: no `/hub` page, no "Rewards Hub" nav entry, no background hub
 * session sync. Flip `NEXT_PUBLIC_HUB_UI=1` to turn the hub UI on deliberately.
 *
 * This reads a `NEXT_PUBLIC_*` var so the SAME flag value is available in both
 * server and client components (inlined at build time). Default: off.
 */
export const HUB_UI_ENABLED = process.env.NEXT_PUBLIC_HUB_UI === "1";
