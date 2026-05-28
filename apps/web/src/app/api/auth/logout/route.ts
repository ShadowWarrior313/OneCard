import { clearSessionCookie } from "@/lib/server/authSession";

export async function POST() {
  await clearSessionCookie();
  return Response.json({ ok: true });
}
