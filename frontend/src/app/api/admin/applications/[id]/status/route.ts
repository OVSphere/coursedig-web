// frontend/src/app/api/admin/applications/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["SUBMITTED", "IN_PROGRESS", "OFFER_MADE", "GRANTED"]);

function jsonErr(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdminApi();
  if (!gate.ok) return jsonErr("Not authorised.", gate.status);

  const { id } = await params;
  const appId = String(id || "").trim();
  if (!appId) return jsonErr("Missing application id.", 400);

  const body = await req.json().catch(() => ({}));
  const statusRaw = String((body as any)?.status || "")
    .toUpperCase()
    .trim();

  if (!ALLOWED.has(statusRaw)) {
    return jsonErr("Invalid status.", 400);
  }

  const updated = await prisma.application.update({
    where: { id: appId },
    data: { status: statusRaw },
    select: { id: true, status: true },
  });

  return NextResponse.json({ ok: true, application: updated }, { status: 200 });
}
