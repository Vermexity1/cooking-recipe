import { NextResponse } from "next/server";
import { z } from "zod";
import { claimInviteKey } from "@/lib/invite-store";

export const runtime = "nodejs";

const claimSchema = z.object({
  accountEmail: z.string().email(),
  inviteKey: z.string().min(8),
  password: z.string().min(8),
  username: z.string().min(3).max(20),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = claimSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Enter a username, email address, password, and verification key.",
      },
      { status: 400 },
    );
  }

  const result = await claimInviteKey(parsed.data);

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 403 });
  }

  return NextResponse.json({
    account: result.account,
    message: "Verification key linked to account.",
  });
}
