import { redirect } from "next/navigation";
import { readSessionEmail } from "@/lib/server/authSession";
import { getUserByEmail } from "@/lib/server/authStore";

export async function requireAuth(pathname: string): Promise<void> {
  const email = await readSessionEmail();
  if (!email) {
    redirect(`/login?next=${encodeURIComponent(pathname)}`);
  }
  const user = await getUserByEmail(email);
  if (!user?.verified) {
    redirect(`/login?next=${encodeURIComponent(pathname)}`);
  }
}
