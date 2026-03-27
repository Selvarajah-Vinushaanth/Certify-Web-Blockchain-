"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { ethers } from "ethers";
import { getWriteContract } from "@/lib/blockchain";
import { FaPlus, FaUniversity, FaFileAlt, FaCheckCircle, FaExternalLinkAlt, FaSearch, FaTrash, FaBan, FaQrcode, FaHistory, FaLink } from "react-icons/fa";
import Link from "next/link";
import ConfirmModal from "@/components/ConfirmModal";
import { QRCodeSVG } from "qrcode.react";

interface Institution {
  id: string;
  name: string;
  walletAddr: string;
  email: string;
}

interface Certificate {
  id: string;
  certId: string;
  studentName: string;
  courseName: string;
  ipfsCid: string;
  status: string;
  issuedAt: string;
  txHash?: string;
  institution: Institution;
}

interface VerificationLog {
  id: string;
  certId: string;
  verifierIp: string;
  verifiedAt: string;
  result: boolean;
}

export default function DashboardPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [showRegister, setShowRegister] = useState(false);
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regWallet, setRegWallet] = useState("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState<"certs" | "institutions" | "logs">("certs");
  const [deleteTarget, setDeleteTarget] = useState<{ type: "institution" | "certificate" | "log"; id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [qrCertId, setQrCertId] = useState<string | null>(null);
  const [verificationLogs, setVerificationLogs] = useState<VerificationLog[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [instRes, certRes, logRes] = await Promise.all([
        axios.get("/api/institutions"),
        axios.get("/api/certificates"),
        axios.get("/api/verification-logs"),
      ]);
      setInstitutions(instRes.data);
      setCertificates(certRes.data);
      setVerificationLogs(logRes.data);
    } catch {
      toast.error("Failed to load data");
    }
  }

  async function handleRevoke(cert: Certificate) {
    if (!cert.certId || cert.certId.startsWith("pending")) {
      return toast.error("Certificate hasn't been confirmed on-chain yet");
    }
    if (cert.status === "REVOKED") {
      return toast.error("Certificate is already revoked");
    }
    setRevoking(cert.id);
    try {
      const contract = await getWriteContract();
      const tx = await contract.revokeCertificate(cert.certId);
      await tx.wait();

      await axios.patch(`/api/certificates/${cert.id}/revoke`);
      toast.success("Certificate revoked on-chain and in database");
      fetchData();
    } catch (err: any) {
      toast.error(err?.reason || "Revocation failed — are you the issuer?");
    } finally {
      setRevoking(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const endpoint =
        deleteTarget.type === "institution"
          ? `/api/institutions/${deleteTarget.id}`
          : deleteTarget.type === "log"
          ? `/api/verification-logs/${deleteTarget.id}`
          : `/api/certificates/${deleteTarget.id}`;
      await axios.delete(endpoint);
      toast.success(
        deleteTarget.type === "institution"
          ? "Institution deleted successfully"
          : deleteTarget.type === "log"
          ? "Audit log entry deleted successfully"
          : "Certificate deleted successfully"
      );
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Delete failed");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!regName || !regEmail || !regWallet) return toast.error("Fill all fields");
    if (!ethers.isAddress(regWallet)) return toast.error("Invalid wallet address");

    setLoading(true);
    try {
      await axios.post("/api/institutions", {
        name: regName,
        walletAddr: regWallet,
        email: regEmail,
      });

      try {
        const contract = await getWriteContract();
        const tx = await contract.addIssuer(regWallet);
        await tx.wait();
        toast.success("Institution registered and authorised on-chain!");
      } catch {
        toast.success("Institution registered in DB. On-chain authorisation may need the contract owner.");
      }

      setShowRegister(false);
      setRegName("");
      setRegEmail("");
      setRegWallet("");
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  const activeCerts = certificates.filter((c) => c.status === "ACTIVE").length;
  const revokedCerts = certificates.filter((c) => c.status === "REVOKED").length;

  const filteredCerts = certificates.filter(
    (c) =>
      c.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.certId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto py-10 px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Manage institutions and certificates</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/issue"
              className="bg-primary-600 text-white px-5 py-2.5 rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
            >
              <FaFileAlt className="text-xs" /> Issue Certificate
            </Link>
            <button
              onClick={() => setShowRegister(!showRegister)}
              className="bg-white text-gray-700 border border-gray-200 px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
            >
              <FaPlus className="text-xs" /> Add Institution
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Certificates" value={certificates.length} color="primary" icon={<FaFileAlt />} />
          <StatCard label="Active" value={activeCerts} color="green" icon={<FaCheckCircle />} />
          <StatCard label="Revoked" value={revokedCerts} color="red" icon={<FaBan />} />
          <StatCard label="Institutions" value={institutions.length} color="purple" icon={<FaUniversity />} />
        </div>

        {/* Register form */}
        {showRegister && (
          <form
            onSubmit={handleRegister}
            className="bg-white border border-gray-100 rounded-2xl p-6 mb-8 space-y-4 shadow-sm animate-fade-in-up"
          >
            <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
              <FaUniversity className="text-primary-600" /> Register a New Institution
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <input
                placeholder="Institution Name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                required
              />
              <input
                placeholder="Email"
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                required
              />
              <input
                placeholder="Wallet Address (0x…)"
                value={regWallet}
                onChange={(e) => setRegWallet(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-primary-600 text-white px-6 py-2.5 rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                {loading ? "Registering…" : "Register"}
              </button>
              <button
                type="button"
                onClick={() => setShowRegister(false)}
                className="text-gray-500 hover:text-gray-700 px-4 py-2.5 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          <button
            onClick={() => setTab("certs")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "certs" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Certificates ({certificates.length})
          </button>
          <button
            onClick={() => setTab("institutions")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "institutions" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Institutions ({institutions.length})
          </button>
          <button
            onClick={() => setTab("logs")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "logs" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Audit Log ({verificationLogs.length})
          </button>
        </div>

        {/* Certificates Tab */}
        {tab === "certs" && (
          <section className="animate-fade-in">
            {/* Search */}
            <div className="relative mb-4 max-w-md">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search by student, course, or cert ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>

            {filteredCerts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <FaFileAlt className="text-4xl text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">No certificates found.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-100">
                        <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">Student</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">Course</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">Institution</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">Issued</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredCerts.map((cert) => (
                        <tr key={cert.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3.5">
                            <p className="font-medium text-gray-800">{cert.studentName}</p>
                            <p className="text-xs text-gray-400 font-mono mt-0.5">{cert.certId?.slice(0, 14) || "pending"}…</p>
                          </td>
                          <td className="px-4 py-3.5 text-gray-600">{cert.courseName}</td>
                          <td className="px-4 py-3.5 text-gray-600">{cert.institution?.name || "—"}</td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                cert.status === "ACTIVE"
                                  ? "bg-green-50 text-green-700 border border-green-200"
                                  : "bg-red-50 text-red-700 border border-red-200"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${cert.status === "ACTIVE" ? "bg-green-500" : "bg-red-500"}`} />
                              {cert.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-gray-500 text-xs">
                            {new Date(cert.issuedAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1">
                              {cert.ipfsCid && (
                                <a
                                  href={`${process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs"}/${cert.ipfsCid}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary-600 hover:text-primary-800 p-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                                  title="View on IPFS"
                                >
                                  <FaExternalLinkAlt className="text-xs" />
                                </a>
                              )}
                              <Link
                                href={`/certificate/${cert.id}`}
                                className="text-primary-600 hover:text-primary-800 p-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                                title="Public certificate link"
                              >
                                <FaLink className="text-xs" />
                              </Link>
                              <button
                                onClick={() => setQrCertId(qrCertId === cert.id ? null : cert.id)}
                                className="text-gray-500 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                title="Show QR code"
                              >
                                <FaQrcode className="text-xs" />
                              </button>
                              {cert.status === "ACTIVE" && !cert.certId?.startsWith("pending") && (
                                <button
                                  onClick={() => handleRevoke(cert)}
                                  disabled={revoking === cert.id}
                                  className="text-orange-500 hover:text-orange-700 p-1.5 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50"
                                  title="Revoke certificate"
                                >
                                  <FaBan className="text-xs" />
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  setDeleteTarget({ type: "certificate", id: cert.id, name: `${cert.studentName} — ${cert.courseName}` })
                                }
                                className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                title="Delete certificate"
                              >
                                <FaTrash className="text-xs" />
                              </button>
                            </div>
                            {qrCertId === cert.id && (
                              <div className="mt-2 p-3 bg-white border border-gray-200 rounded-xl shadow-lg inline-block">
                                <QRCodeSVG
                                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/certificate/${cert.id}`}
                                  size={120}
                                  level="M"
                                />
                                <p className="text-xs text-gray-400 mt-1 text-center">Scan to verify</p>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Institutions Tab */}
        {tab === "institutions" && (
          <section className="animate-fade-in">
            {institutions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <FaUniversity className="text-4xl text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">No institutions registered yet.</p>
                <button
                  onClick={() => setShowRegister(true)}
                  className="mt-4 text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  Register your first institution
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {institutions.map((inst) => (
                  <div key={inst.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary-50 p-2.5 rounded-xl group-hover:bg-primary-100 transition-colors">
                        <FaUniversity className="text-primary-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-800">{inst.name}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{inst.email}</p>
                        <p className="text-xs text-gray-400 break-all mt-2 font-mono bg-gray-50 px-2 py-1 rounded-lg">{inst.walletAddr}</p>
                      </div>
                      <button
                        onClick={() => setDeleteTarget({ type: "institution", id: inst.id, name: inst.name })}
                        className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete institution"
                      >
                        <FaTrash className="text-sm" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Audit Log Tab */}
        {tab === "logs" && (
          <section className="animate-fade-in">
            {verificationLogs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <FaHistory className="text-4xl text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">No verification attempts recorded yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-100">
                        <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">Cert ID</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">Result</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">Verifier IP</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">Verified At</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {verificationLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3.5 font-mono text-xs text-gray-600">{log.certId?.slice(0, 18)}…</td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                log.result
                                  ? "bg-green-50 text-green-700 border border-green-200"
                                  : "bg-red-50 text-red-700 border border-red-200"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${log.result ? "bg-green-500" : "bg-red-500"}`} />
                              {log.result ? "VALID" : "INVALID"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-gray-500 text-xs">{log.verifierIp || "—"}</td>
                          <td className="px-4 py-3.5 text-gray-500 text-xs">
                            {new Date(log.verifiedAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3.5">
                            <button
                              onClick={() =>
                                setDeleteTarget({ type: "log", id: log.id, name: log.certId?.slice(0, 18) + "…" })
                              }
                              className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete log entry"
                            >
                              <FaTrash className="text-xs" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title={
          deleteTarget?.type === "institution"
            ? "Delete Institution"
            : deleteTarget?.type === "log"
            ? "Delete Audit Log Entry"
            : "Delete Certificate"
        }
        message={
          deleteTarget?.type === "institution"
            ? `Are you sure you want to delete "${deleteTarget?.name}"? All certificates belonging to this institution will also be removed from the database.`
            : deleteTarget?.type === "log"
            ? `Are you sure you want to delete this audit log entry (${deleteTarget?.name})?`
            : `Are you sure you want to delete the certificate for "${deleteTarget?.name}"? This will only remove the database record, not the blockchain entry.`
        }
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  const colors: Record<string, string> = {
    primary: "bg-primary-50 text-primary-600 border-primary-100",
    green: "bg-green-50 text-green-600 border-green-100",
    red: "bg-red-50 text-red-600 border-red-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
  };

  return (
    <div className={`${colors[color]} border rounded-2xl p-5`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg">{icon}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs mt-1 opacity-75">{label}</p>
    </div>
  );
}
