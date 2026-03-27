"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { HiMenu, HiX } from "react-icons/hi";
import { FaCertificate, FaWallet } from "react-icons/fa";
import clsx from "clsx";

const links = [
  { href: "/", label: "Home" },
  { href: "/issue", label: "Issue" },
  { href: "/verify", label: "Verify" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [wallet, setWallet] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    async function checkWallet() {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        try {
          const accounts: string[] = await (window as any).ethereum.request({
            method: "eth_accounts",
          });
          if (accounts.length > 0) setWallet(accounts[0]);
        } catch {}
      }
    }
    checkWallet();

    if (typeof window !== "undefined" && (window as any).ethereum) {
      (window as any).ethereum.on?.("accountsChanged", (accs: string[]) => {
        setWallet(accs.length > 0 ? accs[0] : null);
      });
    }
  }, []);

  async function connectWallet() {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    try {
      const accounts: string[] = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });
      if (accounts.length > 0) setWallet(accounts[0]);
    } catch {}
  }

  const shortAddr = wallet
    ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
    : null;

  return (
    <nav className="bg-gradient-to-r from-primary-800 via-primary-700 to-primary-800 text-white shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl group">
            <div className="bg-white/15 p-2 rounded-lg group-hover:bg-white/25 transition-colors">
              <FaCertificate className="text-lg" />
            </div>
            <span className="tracking-tight">CertChain</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname === l.href
                    ? "bg-white/20 text-white shadow-inner"
                    : "text-primary-200 hover:text-white hover:bg-white/10"
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Wallet + Mobile toggle */}
          <div className="flex items-center gap-3">
            {wallet ? (
              <div className="hidden sm:flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1.5 rounded-lg text-sm">
                <div className="pulse-dot bg-green-400" />
                <span className="font-mono text-xs">{shortAddr}</span>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="hidden sm:flex items-center gap-2 bg-white/10 border border-white/20 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                <FaWallet className="text-xs" />
                <span>Connect</span>
              </button>
            )}

            <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
              {open ? <HiX size={22} /> : <HiMenu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-primary-900/95 backdrop-blur-sm pb-4 px-4 space-y-1 border-t border-white/10">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                "block py-2.5 px-3 rounded-lg transition-colors",
                pathname === l.href
                  ? "bg-white/15 text-white"
                  : "text-primary-200 hover:text-white hover:bg-white/10"
              )}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          {wallet ? (
            <div className="flex items-center gap-2 py-2.5 px-3 text-sm text-primary-200">
              <div className="pulse-dot bg-green-400" />
              <span className="font-mono text-xs">{shortAddr}</span>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="flex items-center gap-2 py-2.5 px-3 text-sm text-primary-200 hover:text-white"
            >
              <FaWallet className="text-xs" />
              Connect Wallet
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
