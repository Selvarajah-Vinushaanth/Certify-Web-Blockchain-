import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "react-hot-toast";
import { FaCertificate, FaGithub, FaEthereum } from "react-icons/fa";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CertChain",
  description:
    "Issue and verify academic certificates on the blockchain. Tamper-proof, instant, and transparent.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: "12px",
              background: "#1e1b4b",
              color: "#fff",
              fontSize: "14px",
            },
          }}
        />
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="bg-gray-900 text-gray-400 border-t border-gray-800">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
                  <FaCertificate />
                  CertChain
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Decentralized certificate verification system built on Ethereum blockchain with IPFS storage.
                </p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-3 text-sm">Quick Links</h4>
                <div className="flex flex-col gap-2 text-sm">
                  <Link href="/issue" className="hover:text-primary-400 transition-colors">Issue Certificate</Link>
                  <Link href="/verify" className="hover:text-primary-400 transition-colors">Verify Certificate</Link>
                  <Link href="/dashboard" className="hover:text-primary-400 transition-colors">Dashboard</Link>
                </div>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-3 text-sm">Technology</h4>
                <div className="flex flex-col gap-2 text-sm">
                  <span className="flex items-center gap-2"><FaEthereum /> Ethereum Smart Contracts</span>
                  <span>IPFS via Pinata</span>
                  <span>Next.js + PostgreSQL</span>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-6 text-center text-xs text-gray-600">
              © {new Date().getFullYear()} CertChain — Decentralized Certificate Verification System
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
