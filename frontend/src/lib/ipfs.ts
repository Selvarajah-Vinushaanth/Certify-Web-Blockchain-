import axios from "axios";

const PINATA_API_KEY = process.env.PINATA_API_KEY || "";
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY || "";
const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs";

/**
 * Upload a file buffer to IPFS via Pinata.
 * Returns the IPFS CID (content identifier).
 */
export async function uploadToIPFS(
  fileBuffer: Buffer,
  fileName: string
): Promise<string> {
  const formData = new FormData();
  const blob = new Blob([fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength) as ArrayBuffer]);
  formData.append("file", blob, fileName);

  const metadata = JSON.stringify({ name: fileName });
  formData.append("pinataMetadata", metadata);

  const res = await axios.post(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    formData,
    {
      maxBodyLength: Infinity,
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      },
    }
  );

  return res.data.IpfsHash as string;
}

/**
 * Build a gateway URL from a CID.
 */
export function ipfsUrl(cid: string): string {
  return `${IPFS_GATEWAY}/${cid}`;
}
