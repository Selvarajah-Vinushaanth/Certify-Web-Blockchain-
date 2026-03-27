"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import axios from "axios";
import { getWriteContract, hashFileBytes, waitForReceipt } from "@/lib/blockchain";
import { FaCloudUploadAlt, FaCheckCircle, FaFileAlt, FaCopy, FaExternalLinkAlt } from "react-icons/fa";

export default function IssuePage() {
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [courseName, setCourseName] = useState("");
  const [recipientAddr, setRecipientAddr] = useState("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0=idle, 1=uploading IPFS, 2=signing tx, 3=confirming
  const [result, setResult] = useState<any>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: { "application/pdf": [".pdf"], "image/*": [".png", ".jpg", ".jpeg"] },
  });

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return toast.error("Please upload a certificate file");
    if (!recipientAddr || !ethers.isAddress(recipientAddr))
      return toast.error("Enter a valid student wallet address");

    setLoading(true);
    try {
      setStep(1);
      // 1. Upload file to IPFS via our API
      const formData = new FormData();
      formData.append("file", file);
      formData.append("studentName", studentName);
      formData.append("studentEmail", studentEmail);
      formData.append("courseName", courseName);
      formData.append("recipientAddr", recipientAddr);

      const contract = await getWriteContract();
      const signer = await contract.runner as ethers.Signer;
      const issuerAddr = await signer.getAddress();
      formData.append("issuerAddr", issuerAddr);

      const instRes = await axios.get("/api/institutions");
      const inst = instRes.data.find(
        (i: any) => i.walletAddr.toLowerCase() === issuerAddr.toLowerCase()
      );
      if (!inst) {
        toast.error("Your wallet is not registered as an institution. Go to Dashboard first.");
        setLoading(false);
        setStep(0);
        return;
      }
      formData.append("institutionId", inst.id);

      const uploadRes = await axios.post("/api/certificates", formData);
      const { id: dbId, certHash, ipfsCid } = uploadRes.data;

      toast.success("File uploaded to IPFS!");

      // 2. Send on-chain transaction
      setStep(2);
      const tx = await contract.issueCertificate(
        certHash,
        ipfsCid,
        recipientAddr,
        studentName,
        courseName
      );

      setStep(3);
      const receipt = await waitForReceipt(tx);

      if (!receipt) throw new Error("Transaction failed: no receipt returned");

      const iface = new ethers.Interface([
        "event CertificateIssued(bytes32 indexed certId, address indexed issuer, address indexed recipient, string ipfsCid)",
      ]);
      const log = receipt.logs.find((l: any) => {
        try { iface.parseLog(l); return true; } catch { return false; }
      });
      if (!log) throw new Error("CertificateIssued event not found in transaction logs");
      const parsed = iface.parseLog(log);
      const certId = parsed!.args[0];

      await axios.patch(`/api/certificates/${dbId}`, {
        certId,
        txHash: receipt.hash,
      });

      setResult({ certId, txHash: receipt.hash, ipfsCid });
      toast.success("Certificate issued on-chain!");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
      setStep(0);
    }
  }

  if (result) {
    return (
      <div className="min-h-[80vh] bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-6">
        <div className="max-w-lg w-full animate-fade-in-up">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl overflow-hidden shadow-lg">
            <div className="bg-green-500 px-6 py-8 text-center text-white">
              <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheckCircle className="text-3xl" />
              </div>
              <h2 className="text-2xl font-bold">Certificate Issued!</h2>
              <p className="text-green-100 text-sm mt-1">Successfully recorded on the blockchain</p>
            </div>
            <div className="p-6 space-y-4">
              <ResultField label="Certificate ID" value={result.certId} onCopy={() => copyToClipboard(result.certId)} />
              <ResultField label="Transaction Hash" value={result.txHash} onCopy={() => copyToClipboard(result.txHash)} />
              <ResultField label="IPFS CID" value={result.ipfsCid} onCopy={() => copyToClipboard(result.ipfsCid)} />

              <div className="flex gap-3 pt-2">
                <button
                  className="flex-1 bg-primary-600 text-white px-4 py-2.5 rounded-xl hover:bg-primary-700 transition-colors font-medium text-sm"
                  onClick={() => {
                    setResult(null);
                    setFile(null);
                    setStudentName("");
                    setStudentEmail("");
                    setCourseName("");
                    setRecipientAddr("");
                  }}
                >
                  Issue Another
                </button>
                {result.ipfsCid && (
                  <a
                    href={`${process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs"}/${result.ipfsCid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm"
                  >
                    <FaExternalLinkAlt className="text-xs" />
                    View on IPFS
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-3xl mx-auto py-16 px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
            <FaFileAlt className="text-2xl text-primary-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Issue a Certificate</h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Upload the certificate file, fill in the details, and sign the blockchain transaction with your wallet.
          </p>
        </div>

        {/* Progress steps */}
        {loading && (
          <div className="mb-8 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between text-sm">
              <ProgressStep num={1} label="Uploading to IPFS" active={step === 1} done={step > 1} />
              <div className="flex-1 h-px bg-gray-200 mx-2" />
              <ProgressStep num={2} label="Sign Transaction" active={step === 2} done={step > 2} />
              <div className="flex-1 h-px bg-gray-200 mx-2" />
              <ProgressStep num={3} label="Confirming" active={step === 3} done={false} />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File upload */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Certificate File</label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
                isDragActive
                  ? "border-primary-500 bg-primary-50 shadow-lg shadow-primary-100"
                  : file
                  ? "border-green-300 bg-green-50"
                  : "border-gray-200 hover:border-primary-300 hover:shadow-md bg-gray-50"
              }`}
            >
              <input {...getInputProps()} />
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 ${
                file ? "bg-green-100" : isDragActive ? "bg-primary-100" : "bg-gray-100"
              }`}>
                {file ? (
                  <FaCheckCircle className="text-2xl text-green-500" />
                ) : (
                  <FaCloudUploadAlt className={`text-2xl ${isDragActive ? "text-primary-600" : "text-gray-400"}`} />
                )}
              </div>
              {file ? (
                <div>
                  <p className="font-semibold text-green-700">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB — Click to change</p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 font-medium">Drag & drop your certificate here</p>
                  <p className="text-gray-400 text-sm mt-1">PDF, PNG, or JPG</p>
                </div>
              )}
            </div>
          </div>

          {/* Fields */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-4">Certificate Details</label>
            <div className="grid md:grid-cols-2 gap-4">
              <Input label="Student Name" value={studentName} onChange={setStudentName} required />
              <Input label="Student Email" value={studentEmail} onChange={setStudentEmail} type="email" />
              <Input label="Course / Degree" value={courseName} onChange={setCourseName} required />
              <Input
                label="Student Wallet Address"
                value={recipientAddr}
                onChange={setRecipientAddr}
                placeholder="0x..."
                required
                mono
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold py-3.5 rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 transition-all shadow-lg shadow-primary-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Processing...
              </>
            ) : (
              "Issue Certificate"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function ProgressStep({ num, label, active, done }: { num: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
        done ? "bg-green-500 text-white" : active ? "bg-primary-600 text-white animate-pulse" : "bg-gray-200 text-gray-500"
      }`}>
        {done ? "✓" : num}
      </div>
      <span className={`hidden sm:inline ${active ? "text-primary-700 font-medium" : "text-gray-400"}`}>{label}</span>
    </div>
  );
}

function ResultField({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div className="bg-white/80 rounded-xl p-3 border border-gray-100">
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <code className="text-xs text-gray-800 break-all flex-1 font-mono">{value}</code>
        <button onClick={onCopy} className="text-gray-400 hover:text-primary-600 transition-colors p-1 flex-shrink-0">
          <FaCopy className="text-xs" />
        </button>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm bg-gray-50 focus:bg-white transition-colors ${mono ? "font-mono text-xs" : ""}`}
      />
    </div>
  );
}
