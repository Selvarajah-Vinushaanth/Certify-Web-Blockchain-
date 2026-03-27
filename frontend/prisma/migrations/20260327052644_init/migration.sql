-- CreateEnum
CREATE TYPE "CertStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "walletAddr" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "certId" TEXT NOT NULL,
    "certHash" TEXT NOT NULL,
    "ipfsCid" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "studentEmail" TEXT,
    "courseName" TEXT NOT NULL,
    "recipientAddr" TEXT NOT NULL,
    "issuerAddr" TEXT NOT NULL,
    "txHash" TEXT,
    "status" "CertStatus" NOT NULL DEFAULT 'ACTIVE',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "institutionId" TEXT NOT NULL,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationLog" (
    "id" TEXT NOT NULL,
    "certId" TEXT NOT NULL,
    "verifierIp" TEXT,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "result" BOOLEAN NOT NULL,

    CONSTRAINT "VerificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Institution_walletAddr_key" ON "Institution"("walletAddr");

-- CreateIndex
CREATE UNIQUE INDEX "Institution_email_key" ON "Institution"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_certId_key" ON "Certificate"("certId");

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
