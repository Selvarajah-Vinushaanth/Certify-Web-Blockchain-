import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/verification-logs/[id] — delete a single audit log entry
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await prisma.verificationLog.delete({
      where: { id: params.id },
    });

    return NextResponse.json(deleted);
  } catch (err: any) {
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Log entry not found" }, { status: 404 });
    }
    console.error("DELETE /api/verification-logs/[id] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
