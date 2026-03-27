const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateVerification", function () {
  let contract;
  let owner, issuer, student, employer, other;

  beforeEach(async () => {
    [owner, issuer, student, employer, other] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("CertificateVerification");
    contract = await Factory.deploy();
    await contract.waitForDeployment();

    // Authorise the issuer (university)
    await contract.connect(owner).addIssuer(issuer.address);
  });

  // ── Issuer management ───────────────────────────────────────────
  describe("Issuer management", () => {
    it("owner can add an issuer", async () => {
      expect(await contract.authorisedIssuers(issuer.address)).to.be.true;
    });

    it("owner can remove an issuer", async () => {
      await contract.connect(owner).removeIssuer(issuer.address);
      expect(await contract.authorisedIssuers(issuer.address)).to.be.false;
    });

    it("non-owner cannot add an issuer", async () => {
      await expect(
        contract.connect(other).addIssuer(other.address)
      ).to.be.revertedWith("Only owner");
    });
  });

  // ── Certificate issuance ────────────────────────────────────────
  describe("Certificate issuance", () => {
    const certHash = ethers.keccak256(ethers.toUtf8Bytes("test-certificate-content"));
    const ipfsCid = "QmTestCid1234567890";
    const studentName = "Vinushaanth";
    const courseName = "BSc Computer Science";

    it("authorised issuer can issue a certificate", async () => {
      const tx = await contract
        .connect(issuer)
        .issueCertificate(certHash, ipfsCid, student.address, studentName, courseName);

      const receipt = await tx.wait();
      const event = receipt.logs.find((l) => l.fragment?.name === "CertificateIssued");
      expect(event).to.not.be.undefined;

      const count = await contract.getCertificateCount();
      expect(count).to.equal(1);
    });

    it("non-issuer cannot issue a certificate", async () => {
      await expect(
        contract
          .connect(other)
          .issueCertificate(certHash, ipfsCid, student.address, studentName, courseName)
      ).to.be.revertedWith("Not an authorised issuer");
    });

    it("cannot issue with zero recipient", async () => {
      await expect(
        contract
          .connect(issuer)
          .issueCertificate(certHash, ipfsCid, ethers.ZeroAddress, studentName, courseName)
      ).to.be.revertedWith("Zero recipient");
    });
  });

  // ── Verification ────────────────────────────────────────────────
  describe("Verification", () => {
    let certId;
    const certHash = ethers.keccak256(ethers.toUtf8Bytes("test-certificate-content"));
    const ipfsCid = "QmTestCid1234567890";
    const studentName = "Vinushaanth";
    const courseName = "BSc Computer Science";

    beforeEach(async () => {
      const tx = await contract
        .connect(issuer)
        .issueCertificate(certHash, ipfsCid, student.address, studentName, courseName);
      const receipt = await tx.wait();
      certId = await contract.certificateIds(0);
    });

    it("anyone can verify a valid certificate by ID", async () => {
      const result = await contract.connect(employer).verifyCertificate(certId);
      expect(result.valid).to.be.true;
      expect(result.studentName).to.equal(studentName);
      expect(result.courseName).to.equal(courseName);
      expect(result.issuer).to.equal(issuer.address);
      expect(result.recipient).to.equal(student.address);
    });

    it("anyone can verify a certificate by file hash", async () => {
      const [foundId, found] = await contract.verifyCertificateByHash(certHash);
      expect(found).to.be.true;
      expect(foundId).to.equal(certId);
    });

    it("returns not-found for unknown hash", async () => {
      const fakeHash = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      const [, found] = await contract.verifyCertificateByHash(fakeHash);
      expect(found).to.be.false;
    });
  });

  // ── Revocation ──────────────────────────────────────────────────
  describe("Revocation", () => {
    let certId;
    const certHash = ethers.keccak256(ethers.toUtf8Bytes("revoke-test"));
    const ipfsCid = "QmRevokeCid";

    beforeEach(async () => {
      await contract
        .connect(issuer)
        .issueCertificate(certHash, ipfsCid, student.address, "Student", "Course");
      certId = await contract.certificateIds(0);
    });

    it("issuer can revoke their own certificate", async () => {
      await contract.connect(issuer).revokeCertificate(certId);
      const result = await contract.verifyCertificate(certId);
      expect(result.valid).to.be.false;
    });

    it("another issuer cannot revoke someone else's certificate", async () => {
      await contract.connect(owner).addIssuer(other.address);
      await expect(
        contract.connect(other).revokeCertificate(certId)
      ).to.be.revertedWith("Not the issuer");
    });
  });
});
