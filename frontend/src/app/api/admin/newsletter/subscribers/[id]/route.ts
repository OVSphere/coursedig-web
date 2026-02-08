import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function forbidden() {
  return NextResponse.json({ message: "Forbidden" }, { status: 403 });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
  if (!user.isSuperAdmin) return forbidden();

  const { id } = await ctx.params;

  const body = await req.json().catch(() => ({}));
  const email = body.email ? String(body.email).trim().toLowerCase() : undefined;
  const fullName = body.fullName !== undefined ? String(body.fullName ?? "").trim() || null : undefined;
  const isActive = body.isActive !== undefined ? !!body.isActive : undefined;

  if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: "Enter a valid email." }, { status: 400 });
  }

  try {
    await prisma.newsletterSubscriber.update({
      where: { id },
      data: {
        ...(email !== undefined ? { email } : {}),
        ...(fullName !== undefined ? { fullName } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ message: "Update failed." }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
  if (!user.isSuperAdmin) return forbidden();

  const { id } = await ctx.params;

  await prisma.newsletterSubscriber.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true }, { status: 200 });
}
