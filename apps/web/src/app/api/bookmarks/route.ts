import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    bookmarks: [
      {
        id: "bm-security",
        title: "Security playbook",
        url: "veil://vault/security",
        workspaceId: "private",
      },
      {
        id: "bm-admin",
        title: "Container pool",
        url: "veil://admin/pools",
        workspaceId: "ops",
      },
    ],
  });
}
