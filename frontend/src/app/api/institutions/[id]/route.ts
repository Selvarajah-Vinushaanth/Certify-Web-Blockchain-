import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/institutions/[id] — delete an institution and its certificates
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Delete all certificates belonging to this institution first
    await prisma.certificate.deleteMany({
      where: { institutionId: id },
    });

    // Delete the institution
    const deleted = await prisma.institution.delete({
      where: { id },
    });

    return NextResponse.json(deleted);
  } catch (err: any) {
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Institution not found" }, { status: 404 });
    }
    console.error("DELETE /api/institutions/[id] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
