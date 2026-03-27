import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getReadContract } from "@/lib/blockchain";

// POST /api/verify — verify a certificate by on-chain ID or file hash
export async function POST(req: NextRequest) {
  try {
    const { certId, certHash } = await req.json();

    if (!certId && !certHash) {
      return NextResponse.json(
        { error: "Provide certId or certHash" },
        { status: 400 }
      );
    }

    const contract = getReadContract();

    let onChainId = certId;

    // If only hash provided, look up by hash first
    if (!onChainId && certHash) {
      const [foundId, found] = await contract.verifyCertificateByHash(certHash);
      if (!found) {
        return NextResponse.json({ verified: false, reason: "Certificate not found on-chain" });
      }
      onChainId = foundId;
    }

    // Verify on-chain
    const result = await contract.verifyCertificate(onChainId);
    const [valid, studentName, courseName, issuer, recipient, ipfsCid, issuedAt] = result;

    // Log the verification attempt
    await prisma.verificationLog.create({
      data: {
        certId: onChainId,
        verifierIp: req.headers.get("x-forwarded-for") || "unknown",
        result: valid,
      },
    });

    // Also fetch DB metadata if available
    const dbCert = await prisma.certificate.findUnique({
      where: { certId: onChainId },
      include: { institution: true },
    });

    return NextResponse.json({
      verified: valid,
      onChain: {
        studentName,
        courseName,
        issuer,
        recipient,
        ipfsCid,
        issuedAt: Number(issuedAt),
      },
      dbRecord: dbCert,
    });
  } catch (err: any) {
    console.error("POST /api/verify error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
