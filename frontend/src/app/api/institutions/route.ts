import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/institutions — list all
export async function GET() {
  const institutions = await prisma.institution.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(institutions);
}

// POST /api/institutions — register a new institution
export async function POST(req: NextRequest) {
  try {
    const { name, walletAddr, email } = await req.json();

    if (!name || !walletAddr || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const institution = await prisma.institution.create({
      data: { name, walletAddr, email },
    });

    return NextResponse.json(institution, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Wallet address or email already registered" }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
