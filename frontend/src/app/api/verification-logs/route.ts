import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/verification-logs — list all verification attempts
export async function GET() {
  const logs = await prisma.verificationLog.findMany({
    orderBy: { verifiedAt: "desc" },
    take: 200,
  });
  return NextResponse.json(logs);
}
