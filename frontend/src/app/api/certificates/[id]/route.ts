import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/certificates/[id] — get a single certificate with institution info
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cert = await prisma.certificate.findUnique({
      where: { id: params.id },
      include: { institution: true },
    });

    if (!cert) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    return NextResponse.json(cert);
  } catch (err: any) {
    console.error("GET /api/certificates/[id] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/certificates/[id] — update certId & txHash after on-chain tx
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { certId, txHash } = body;

    if (!certId) {
      return NextResponse.json({ error: "certId is required" }, { status: 400 });
    }

    const updated = await prisma.certificate.update({
      where: { id: params.id },
      data: { certId, txHash },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("PATCH /api/certificates/[id] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/certificates/[id] — delete a certificate record from the database
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await prisma.certificate.delete({
      where: { id: params.id },
    });

    return NextResponse.json(deleted);
  } catch (err: any) {
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }
    console.error("DELETE /api/certificates/[id] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
