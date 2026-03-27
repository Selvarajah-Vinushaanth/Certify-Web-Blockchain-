import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/certificates/[id]/revoke — mark certificate as REVOKED in DB
export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updated = await prisma.certificate.update({
      where: { id: params.id },
      data: { status: "REVOKED" },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }
    console.error("PATCH /api/certificates/[id]/revoke error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
