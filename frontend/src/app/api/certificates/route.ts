import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToIPFS } from "@/lib/ipfs";
import { ethers } from "ethers";

// GET /api/certificates — list all certificates (with optional filters)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const issuer = searchParams.get("issuer");
  const student = searchParams.get("student");

  const where: Record<string, string> = {};
  if (issuer) where.issuerAddr = issuer;
  if (student) where.recipientAddr = student;

  const certs = await prisma.certificate.findMany({
    where,
    orderBy: { issuedAt: "desc" },
    include: { institution: true },
  });

  return NextResponse.json(certs);
}

// POST /api/certificates — upload file to IPFS & save metadata in DB
// (The actual on-chain tx is done from the browser via MetaMask)
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const studentName = formData.get("studentName") as string;
    const studentEmail = formData.get("studentEmail") as string | null;
    const courseName = formData.get("courseName") as string;
    const recipientAddr = formData.get("recipientAddr") as string;
    const issuerAddr = formData.get("issuerAddr") as string;
    const institutionId = formData.get("institutionId") as string;

    if (!file || !studentName || !courseName || !recipientAddr || !issuerAddr || !institutionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Read file bytes & compute hash
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const certHash = ethers.keccak256(new Uint8Array(fileBuffer));

    // Upload to IPFS
    const ipfsCid = await uploadToIPFS(fileBuffer, file.name);

    // Save to database (certId and txHash will be updated after on-chain tx)
    const cert = await prisma.certificate.create({
      data: {
        certId: `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`, // unique temp value
        certHash,
        ipfsCid,
        studentName,
        studentEmail,
        courseName,
        recipientAddr,
        issuerAddr,
        institutionId,
      },
    });

    return NextResponse.json({
      id: cert.id,
      certHash,
      ipfsCid,
      message: "File uploaded to IPFS. Complete the on-chain transaction from your wallet.",
    });
  } catch (err: any) {
    console.error("POST /api/certificates error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/certificates — delete all certificates
export async function DELETE() {
  await prisma.certificate.deleteMany({});
  return NextResponse.json({ success: true });
}
