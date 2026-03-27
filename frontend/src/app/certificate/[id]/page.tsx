"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
import { FaCheckCircle, FaBan, FaUniversity, FaExternalLinkAlt, FaUserGraduate, FaBook, FaCalendar, FaLink, FaCheck } from "react-icons/fa";
import Link from "next/link";

interface CertificateDetail {
  id: string;
  certId: string;
  certHash: string;
  ipfsCid: string;
  studentName: string;
  studentEmail?: string;
  courseName: string;
  recipientAddr: string;
  issuerAddr: string;
  txHash?: string;
  status: string;
  issuedAt: string;
  institution: {
    name: string;
    email: string;
    walletAddr: string;
  };
}

export default function CertificatePage() {
  const params = useParams();
  const [cert, setCert] = useState<CertificateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await axios.get(`/api/certificates/${params.id}`);
        setCert(res.data);
      } catch {
        setError("Certificate not found");
      } finally {
        setLoading(false);
      }
    }
    if (params.id) load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-400 mb-4">{error || "Certificate not found"}</p>
          <Link href="/verify" className="text-primary-600 hover:text-primary-700 font-medium">
            Go to Verification Page
          </Link>
        </div>
      </div>
    );
  }

  const isActive = cert.status === "ACTIVE";
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-3xl mx-auto py-10 px-6">
        {/* Status Banner */}
        <div
          className={`rounded-2xl p-6 mb-8 text-center ${
            isActive
              ? "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200"
              : "bg-gradient-to-r from-red-50 to-rose-50 border border-red-200"
          }`}
        >
          <div className="flex justify-center mb-3">
            {isActive ? (
              <FaCheckCircle className="text-5xl text-green-500" />
            ) : (
              <FaBan className="text-5xl text-red-500" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isActive ? "Verified Certificate" : "Revoked Certificate"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isActive
              ? "This certificate has been verified on the blockchain"
              : "This certificate has been revoked by the issuer"}
          </p>
        </div>

        {/* Certificate Card */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
            <h2 className="text-white font-semibold text-lg flex items-center gap-2">
              <FaUniversity /> {cert.institution.name}
            </h2>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <InfoRow icon={<FaUserGraduate />} label="Student Name" value={cert.studentName} />
              <InfoRow icon={<FaBook />} label="Course" value={cert.courseName} />
              <InfoRow
                icon={<FaCalendar />}
                label="Issued On"
                value={new Date(cert.issuedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              />
              <InfoRow
                icon={isActive ? <FaCheckCircle className="text-green-500" /> : <FaBan className="text-red-500" />}
                label="Status"
                value={cert.status}
              />
            </div>

            {/* Technical Details */}
            <div className="border-t border-gray-100 pt-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Blockchain Details</h3>
              <DetailRow label="Certificate ID" value={cert.certId} mono />
              <DetailRow label="File Hash" value={cert.certHash} mono />
              <DetailRow label="Issuer Wallet" value={cert.issuerAddr} mono />
              <DetailRow label="Recipient Wallet" value={cert.recipientAddr} mono />
              {cert.txHash && <DetailRow label="Tx Hash" value={cert.txHash} mono />}
            </div>

            {/* Actions */}
            <div className="border-t border-gray-100 pt-5 flex flex-wrap items-center gap-4">
              {cert.ipfsCid && (
                <a
                  href={`${process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs"}/${cert.ipfsCid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-100 transition-colors"
                >
                  <FaExternalLinkAlt className="text-xs" /> View on IPFS
                </a>
              )}
              <Link
                href="/verify"
                className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Verify Another
              </Link>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  copied
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {copied ? (
                  <><FaCheck className="text-xs" /> Copied!</>
                ) : (
                  <><FaLink className="text-xs" /> Copy Link</>
                )}
              </button>
            </div>
          </div>

          {/* QR Code Footer */}
          <div className="bg-gray-50 border-t border-gray-100 px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Scan to verify this certificate</p>
              <p className="text-xs text-gray-300 font-mono mt-1">{cert.id}</p>
            </div>
            <QRCodeSVG value={shareUrl} size={80} level="M" />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-primary-500 mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="font-medium text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`text-sm text-gray-700 break-all mt-0.5 ${mono ? "font-mono bg-gray-50 px-2 py-1 rounded-lg" : ""}`}>
        {value}
      </p>
    </div>
  );
}
