import { NextResponse } from "next/server";
import { z } from "zod";
import { signInAccount } from "@/lib/invite-store";

export const runtime = "nodejs";

const signInSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = signInSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a username/email and password." },
      { status: 400 },
    );
  }

  const result = await signInAccount(parsed.data);

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 401 });
  }

  return NextResponse.json({
    account: result.account,
    message: "Signed in.",
  });
}
