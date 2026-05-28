import { readSessionEmail } from "@/lib/server/authSession";
import { getUserByEmail } from "@/lib/server/authStore";

export async function GET() {
  const email = await readSessionEmail();
  if (!email) return Response.json({ authenticated: false }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user || !user.verified) return Response.json({ authenticated: false }, { status: 401 });

  return Response.json({
    authenticated: true,
    user: {
      email: user.email,
      name: user.name,
      joinedAt: user.createdAt,
    },
  });
}
