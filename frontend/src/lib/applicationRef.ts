import { prisma } from "@/lib/prisma";

function pad4(n: number) {
  return String(n).padStart(4, "0");
}

function yyyymmdd(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export async function generateAppRef(lastName: string, dob?: Date | null) {
  const dateKey = yyyymmdd();
  const yob = dob ? String(dob.getFullYear()) : "0000";
  const surname = (lastName || "UNKNOWN").trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 12) || "UNKNOWN";

  const counter = await prisma.applicationCounter.upsert({
    where: { dateKey },
    update: { lastValue: { increment: 1 } },
    create: { dateKey, lastValue: 1 },
    select: { lastValue: true },
  });

  return `APP-${surname}-${yob}-${dateKey}-${pad4(counter.lastValue)}`;
}
