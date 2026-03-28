import Link from "next/link";
import { FaShieldAlt, FaUniversity, FaSearch, FaLink, FaArrowRight, FaEthereum, FaFileAlt, FaGlobe, FaQrcode, FaBan, FaHistory, FaShareAlt } from "react-icons/fa";
import { prisma } from "@/lib/prisma";

async function getStats() {
  try {
    const [certCount, instCount, verifyCount, revokedCount] = await Promise.all([
      prisma.certificate.count(),
      prisma.institution.count(),
      prisma.verificationLog.count(),
      prisma.certificate.count({ where: { status: "REVOKED" } }),
    ]);
    return { certCount, instCount, verifyCount, revokedCount };
  } catch {
    return { certCount: 0, instCount: 0, verifyCount: 0, revokedCount: 0 };
  }
}

export default async function HomePage() {
  const stats = await getStats();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-400 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-400 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full text-sm mb-8">
              <div className="pulse-dot bg-green-400" />
              <span className="text-primary-200">Powered by Ethereum Blockchain</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
              Verify Certificates
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-200 via-white to-primary-200">
                On the Blockchain
              </span>
            </h1>

            <p className="text-lg md:text-xl text-primary-200 mb-10 max-w-2xl mx-auto leading-relaxed">
              Tamper-proof, instant, and transparent certificate verification.
              Universities issue. Employers verify. No middleman needed.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/issue"
                className="group bg-white text-primary-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-primary-50 transition-all shadow-lg shadow-black/20 flex items-center justify-center gap-2"
              >
                Issue a Certificate
                <FaArrowRight className="text-sm group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/verify"
                className="border-2 border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 hover:border-white/50 transition-all flex items-center justify-center gap-2"
              >
                <FaSearch className="text-sm" />
                Verify a Certificate
              </Link>
            </div>
          </div>

          {/* Live Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-3xl mx-auto">
            <StatBadge value={stats.certCount} label="Certificates Issued" />
            <StatBadge value={stats.instCount} label="Institutions" />
            <StatBadge value={stats.revokedCount} label="Revoked" />
            <StatBadge value={stats.verifyCount} label="Verifications" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-primary-600 font-semibold text-sm uppercase tracking-wider mb-2">Process</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">How It Works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Step
              number="01"
              icon={<FaUniversity className="text-2xl text-primary-600" />}
              title="University Issues"
              desc="The institution uploads the certificate file. Its hash is stored on the blockchain and the file is pinned to IPFS."
            />
            <Step
              number="02"
              icon={<FaEthereum className="text-2xl text-primary-600" />}
              title="Stored On-Chain"
              desc="The certificate hash, student details, and IPFS link are permanently recorded in a smart contract."
            />
            <Step
              number="03"
              icon={<FaSearch className="text-2xl text-primary-600" />}
              title="Employer Verifies"
              desc="Anyone can verify a certificate by entering its ID or uploading the original file — instant and trustless."
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-gray-50/80">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-primary-600 font-semibold text-sm uppercase tracking-wider mb-2">Benefits</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Why CertChain?</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Feature icon={<FaShieldAlt />} title="Tamper-Proof" desc="Certificates are hashed and stored on the Ethereum blockchain. Nobody can alter them." />
            <Feature icon={<FaSearch />} title="Instant Verification" desc="Employers check a certificate in seconds — no phone calls, no waiting." />
            <Feature icon={<FaGlobe />} title="Decentralized Storage" desc="Certificate files live on IPFS — no single point of failure." />
            <Feature icon={<FaUniversity />} title="Multi-Institution" desc="Any authorised university can join and start issuing certificates." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary-700 to-primary-800 text-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-primary-200 mb-8 text-lg">
            Join the future of academic verification. Issue your first certificate in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-primary-50 transition-all shadow-lg"
            >
              Go to Dashboard
              <FaArrowRight className="text-sm" />
            </Link>
            <Link
              href="/verify"
              className="inline-flex items-center gap-2 border-2 border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 hover:border-white/50 transition-all"
            >
              <FaSearch className="text-sm" />
              Verify Certificate
            </Link>
          </div>
        </div>
      </section>

      {/* New Features Highlight */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-primary-600 font-semibold text-sm uppercase tracking-wider mb-2">What&apos;s New</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Powerful New Features</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">We&apos;ve added tools to make certificate management even more powerful and shareable.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Feature icon={<FaQrcode />} title="QR Code Sharing" desc="Generate QR codes for any certificate — perfect for printing on physical documents or sharing digitally." />
            <Feature icon={<FaBan />} title="Certificate Revocation" desc="Issuers can revoke certificates directly from the dashboard, updating both the blockchain and database." />
            <Feature icon={<FaShareAlt />} title="Public Certificate Page" desc="Each certificate has a unique shareable URL that anyone can open to view full details and verify authenticity." />
            <Feature icon={<FaHistory />} title="Verification Audit Log" desc="Every verification attempt is recorded — see who verified which certificate and when, all from the dashboard." />
          </div>
          <div className="text-center mt-10">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold text-sm"
            >
              Explore in Dashboard <FaArrowRight className="text-xs" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatBadge({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-5">
      <p className="text-3xl md:text-4xl font-bold">{value}</p>
      <p className="text-primary-300 text-xs md:text-sm mt-1">{label}</p>
    </div>
  );
}

function Step({ number, icon, title, desc }: { number: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 group">
      <span className="absolute -top-3 -left-2 text-6xl font-black text-primary-100 group-hover:text-primary-200 transition-colors select-none">{number}</span>
      <div className="relative">
        <div className="bg-primary-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4">{icon}</div>
        <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
        <p className="text-gray-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="glow-card bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 group">
      <div className="relative">
        <div className="text-3xl text-primary-600 mb-4 group-hover:scale-110 transition-transform">{icon}</div>
        <h3 className="font-semibold text-lg mb-2 text-gray-900">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
