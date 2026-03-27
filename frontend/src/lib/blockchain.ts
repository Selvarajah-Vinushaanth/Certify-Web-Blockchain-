import { ethers } from "ethers";

// ABI – only the functions we call from the frontend / API
export const CONTRACT_ABI = [
  "function issueCertificate(bytes32 _certHash, string _ipfsCid, address _recipient, string _studentName, string _courseName) external returns (bytes32)",
  "function revokeCertificate(bytes32 _certId) external",
  "function verifyCertificate(bytes32 _certId) external view returns (bool valid, string studentName, string courseName, address issuer, address recipient, string ipfsCid, uint256 issuedAt)",
  "function verifyCertificateByHash(bytes32 _certHash) external view returns (bytes32 certId, bool found)",
  "function addIssuer(address _issuer) external",
  "function removeIssuer(address _issuer) external",
  "function authorisedIssuers(address) external view returns (bool)",
  "function getCertificateCount() external view returns (uint256)",
  "function certificateIds(uint256) external view returns (bytes32)",
  "event CertificateIssued(bytes32 indexed certId, address indexed issuer, address indexed recipient, string ipfsCid)",
  "event CertificateRevoked(bytes32 indexed certId, address indexed issuer)",
];

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
const RPC_URL = process.env.NEXT_PUBLIC_CHAIN_RPC_URL || "http://127.0.0.1:8545";

// ── Read-only provider (for verification) ──────────────────────────
export function getProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

export function getReadContract() {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, getProvider());
}

// ── Browser wallet signer (for issuing) ────────────────────────────
export async function getSigner() {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("MetaMask not detected");
  }
  const provider = new ethers.BrowserProvider((window as any).ethereum);
  await provider.send("eth_requestAccounts", []);
  return provider.getSigner();
}

export async function getWriteContract() {
  const signer = await getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

// ── Helper: hash file bytes ────────────────────────────────────────
export function hashFileBytes(bytes: Uint8Array): string {
  return ethers.keccak256(bytes);
}

// ── Helper: wait for a transaction to be mined ────────────────────
export async function waitForReceipt(tx: ethers.TransactionResponse) {
  return await tx.wait();
}
