"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import axios from "axios";
import { FaSearch, FaCheckCircle, FaTimesCircle, FaCloudUploadAlt, FaExternalLinkAlt, FaShieldAlt } from "react-icons/fa";

export default function VerifyPage() {
  const [certIdInput, setCertIdInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) {
      setFile(accepted[0]);
      setCertIdInput("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
  });

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!certIdInput && !file) {
      return toast.error("Enter a Certificate ID or upload the certificate file");
    }

    setLoading(true);
    setResult(null);
    try {
      let payload: any = {};

      if (certIdInput) {
        payload.certId = certIdInput;
      } else if (file) {
        const arrayBuffer = await file.arrayBuffer();
        const hash = ethers.keccak256(new Uint8Array(arrayBuffer));
        payload.certHash = hash;
      }

      const res = await axios.post("/api/verify", payload);
      setResult(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-3xl mx-auto py-16 px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
            <FaShieldAlt className="text-2xl text-primary-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Verify a Certificate</h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Enter the on-chain Certificate ID or upload the original certificate file to check its authenticity instantly.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          {/* Certificate ID */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Certificate ID <span className="text-gray-400 font-normal">(bytes32)</span>
            </label>
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                value={certIdInput}
                onChange={(e) => {
                  setCertIdInput(e.target.value);
                  setFile(null);
                }}
                placeholder="0x..."
                className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm font-mono bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-sm font-medium">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* File upload */}
          <div
            {...getRootProps()}
            className={`bg-white rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-200 shadow-sm ${
              isDragActive
                ? "border-primary-500 bg-primary-50 shadow-primary-100 shadow-lg"
                : "border-gray-200 hover:border-primary-300 hover:shadow-md"
            }`}
          >
            <input {...getInputProps()} />
            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 transition-colors ${
              isDragActive ? "bg-primary-100" : "bg-gray-100"
            }`}>
              <FaCloudUploadAlt className={`text-2xl ${isDragActive ? "text-primary-600" : "text-gray-400"}`} />
            </div>
            {file ? (
              <div>
                <p className="font-semibold text-primary-700">{file.name}</p>
                <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 font-medium">Drop your certificate file here</p>
                <p className="text-gray-400 text-sm mt-1">or click to browse</p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold py-3.5 rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-200"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Verifying on chain...
              </>
            ) : (
              <>
                <FaSearch />
                Verify Certificate
              </>
            )}
          </button>
        </form>

        {/* Result */}
        {result && (
          <div className={`mt-10 rounded-2xl overflow-hidden border shadow-sm animate-fade-in-up ${
            result.verified
              ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
              : "bg-gradient-to-br from-red-50 to-orange-50 border-red-200"
          }`}>
            {/* Status banner */}
            <div className={`px-6 py-4 ${result.verified ? "bg-green-100/50" : "bg-red-100/50"}`}>
              <div className="flex items-center gap-3">
                {result.verified ? (
                  <>
                    <div className="bg-green-500 p-2 rounded-xl">
                      <FaCheckCircle className="text-white text-lg" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-green-800">Certificate is VALID</h2>
                      <p className="text-green-600 text-sm">Verified on the Ethereum blockchain</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-red-500 p-2 rounded-xl">
                      <FaTimesCircle className="text-white text-lg" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-red-800">
                        {result.reason || "Certificate is REVOKED or INVALID"}
                      </h2>
                      <p className="text-red-600 text-sm">Verification failed</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {result.onChain && (
              <div className="p-6 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <DetailCard label="Student" value={result.onChain.studentName} />
                  <DetailCard label="Course" value={result.onChain.courseName} />
                  <DetailCard label="Issuer Address" value={result.onChain.issuer} mono />
                  <DetailCard label="Recipient Address" value={result.onChain.recipient} mono />
                  <DetailCard label="IPFS CID" value={result.onChain.ipfsCid} mono />
                  <DetailCard
                    label="Issued At"
                    value={
                      result.onChain.issuedAt
                        ? new Date(result.onChain.issuedAt * 1000).toLocaleString()
                        : "N/A"
                    }
                  />
                </div>

                {result.dbRecord?.institution?.name && (
                  <div className="bg-white/50 rounded-xl p-4 border border-gray-200/50">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Issuing Institution</p>
                    <p className="font-semibold text-gray-800">{result.dbRecord.institution.name}</p>
                  </div>
                )}

                {result.onChain.ipfsCid && (
                  <a
                    href={`${process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs"}/${result.onChain.ipfsCid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl hover:bg-primary-700 transition-colors text-sm font-medium"
                  >
                    <FaExternalLinkAlt className="text-xs" />
                    View Certificate on IPFS
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-white/60 rounded-xl p-3 border border-gray-100">
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-sm text-gray-800 break-all ${mono ? "font-mono text-xs" : "font-medium"}`}>
        {value}
      </p>
    </div>
  );
}
