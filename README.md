# 🔗 CertChain — Decentralized Certificate Verification System

A full-stack blockchain application that lets **universities issue** tamper-proof academic certificates and **employers verify** them instantly — no middleman required.

Built with **Solidity + Hardhat + Next.js + Prisma (PostgreSQL) + IPFS**.

---

## 📑 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Getting Started](#getting-started)
6. [Smart Contract](#smart-contract)
7. [Frontend & Backend](#frontend--backend)
8. [Database (Prisma + PostgreSQL)](#database-prisma--postgresql)
9. [IPFS (Pinata)](#ipfs-pinata)
10. [How It Works (Flow)](#how-it-works-flow)
11. [Key Concepts to Learn](#key-concepts-to-learn)
12. [API Reference](#api-reference)
13. [Deployment to Testnet](#deployment-to-testnet)
14. [Troubleshooting](#troubleshooting)
15. [License](#license)

---

## Architecture Overview

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Browser    │────▶│  Next.js App │────▶│  PostgreSQL (DB)  │
│  (MetaMask)  │     │  (API Routes)│     │  via Prisma ORM   │
└──────┬───────┘     └──────┬───────┘     └──────────────────┘
       │                    │
       │ sign tx            │ read
       ▼                    ▼
┌──────────────┐     ┌──────────────┐
│   Ethereum   │     │    IPFS      │
│  Blockchain  │     │  (Pinata)    │
│  (Hardhat /  │     │              │
│   Sepolia)   │     │              │
└──────────────┘     └──────────────┘
```

**Flow:**
1. University uploads a certificate file → file goes to **IPFS**, hash goes to **blockchain**
2. Metadata (student name, course, etc.) stored in **PostgreSQL** for fast queries
3. Employer enters Certificate ID or uploads the file → app checks **blockchain** → returns result

---

## Tech Stack

| Layer           | Technology                         |
| --------------- | ---------------------------------- |
| Smart Contract  | Solidity 0.8.24                    |
| Blockchain Dev  | Hardhat                            |
| Frontend        | Next.js 14 (App Router), Tailwind  |
| Backend (API)   | Next.js API Routes (server-side)   |
| ORM / Database  | Prisma + PostgreSQL                |
| File Storage    | IPFS via Pinata                    |
| Wallet          | MetaMask (ethers.js v6)            |
| Testing         | Hardhat + Chai + Ethers            |

---

## Project Structure

```
blockchain/
├── contracts/
│   └── CertificateVerification.sol    # Solidity smart contract
├── scripts/
│   └── deploy.js                      # Deployment script
├── test/
│   └── CertificateVerification.test.js # Contract tests
├── hardhat.config.js
├── package.json                       # Root (Hardhat) deps
│
├── frontend/
│   ├── prisma/
│   │   └── schema.prisma             # Database schema
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx            # Root layout
│   │   │   ├── page.tsx              # Home page
│   │   │   ├── issue/page.tsx        # Issue certificate page
│   │   │   ├── verify/page.tsx       # Verify certificate page
│   │   │   ├── dashboard/page.tsx    # Dashboard page
│   │   │   └── api/
│   │   │       ├── certificates/
│   │   │       │   ├── route.ts      # GET/POST certificates
│   │   │       │   └── [id]/route.ts # PATCH certificate
│   │   │       ├── verify/route.ts   # POST verify
│   │   │       └── institutions/route.ts
│   │   ├── components/
│   │   │   └── Navbar.tsx
│   │   └── lib/
│   │       ├── prisma.ts             # Prisma client singleton
│   │       ├── blockchain.ts         # Ethers.js helpers
│   │       └── ipfs.ts              # Pinata upload helpers
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── .env.example
├── .gitignore
└── README.md                          # ← You are here
```

---

## Prerequisites

Before you start, install these on your machine:

| Tool          | Version  | Purpose                        | Install                                   |
| ------------- | -------- | ------------------------------ | ----------------------------------------- |
| **Node.js**   | ≥ 18     | JavaScript runtime             | https://nodejs.org                        |
| **npm**       | ≥ 9      | Package manager (comes w/ Node)| —                                         |
| **PostgreSQL**| ≥ 14     | Relational database            | `sudo apt install postgresql`             |
| **MetaMask**  | latest   | Browser wallet extension       | https://metamask.io                       |
| **Git**       | latest   | Version control                | `sudo apt install git`                    |

Optional but recommended:
- **Pinata account** (free) for IPFS: https://www.pinata.cloud
- **Infura / Alchemy** account for Sepolia testnet RPC

---

## Getting Started

### 1. Clone & install dependencies

```bash
cd ~/blockchain

# Install Hardhat (smart contract) dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
```

### 2. Setup environment variables

```bash
# Root .env (for Hardhat)
cp .env.example .env

# Frontend .env
cd frontend
cp .env.example .env
```

Edit the `.env` files with your actual values.

### 3. Start PostgreSQL & create the database

```bash
sudo -u postgres psql -c "CREATE DATABASE certverify;"
```

### 4. Run Prisma migrations

```bash
cd frontend
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Start a local blockchain

```bash
# In the root blockchain/ directory
npx hardhat node
```

This starts a local Ethereum node on `http://127.0.0.1:8545` with 20 funded test accounts.

### 6. Deploy the smart contract

```bash
# In a new terminal
npx hardhat run scripts/deploy.js --network localhost
```

Copy the contract address and put it in `frontend/.env`:
```
NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### 7. Start the frontend

```bash
cd frontend
npm run dev
```

Open http://localhost:3000 🚀

### 8. Connect MetaMask

1. Open MetaMask → Settings → Networks → Add Network
2. Add: `http://127.0.0.1:8545`, Chain ID: `31337`
3. Import a test account using the private key from the Hardhat node output

---

## Smart Contract

### CertificateVerification.sol

The contract handles:

| Function               | Who Can Call     | Description                              |
| ---------------------- | ---------------- | ---------------------------------------- |
| `addIssuer(addr)`      | Contract owner   | Authorise a university to issue certs    |
| `removeIssuer(addr)`   | Contract owner   | Revoke university's issuing rights       |
| `issueCertificate(…)`  | Authorised issuer| Store cert hash + metadata on-chain      |
| `revokeCertificate(id)`| Original issuer  | Mark a certificate as revoked            |
| `verifyCertificate(id)`| Anyone (view)    | Check if cert is valid & get details     |
| `verifyCertificateByHash(hash)` | Anyone  | Look up cert by file hash                |

### Running tests

```bash
npx hardhat test
```

Expected output:
```
  CertificateVerification
    Issuer management
      ✓ owner can add an issuer
      ✓ owner can remove an issuer
      ✓ non-owner cannot add an issuer
    Certificate issuance
      ✓ authorised issuer can issue a certificate
      ✓ non-issuer cannot issue a certificate
      ✓ cannot issue with zero recipient
    Verification
      ✓ anyone can verify a valid certificate by ID
      ✓ anyone can verify a certificate by file hash
      ✓ returns not-found for unknown hash
    Revocation
      ✓ issuer can revoke their own certificate
      ✓ another issuer cannot revoke someone else's certificate
```

---

## Frontend & Backend

The frontend uses **Next.js 14 App Router** with both client-side pages and server-side API routes.

### Pages

| Route         | Description                                    |
| ------------- | ---------------------------------------------- |
| `/`           | Landing page with "How it works" explanation   |
| `/issue`      | Form to upload certificate & issue on-chain    |
| `/verify`     | Verify by Certificate ID or by file upload     |
| `/dashboard`  | View institutions, certificates, register new  |

### Key Frontend Libraries

- **ethers.js v6** — interact with the Ethereum blockchain from the browser
- **react-dropzone** — drag & drop file uploads
- **react-hot-toast** — toast notifications
- **Tailwind CSS** — utility-first styling

---

## Database (Prisma + PostgreSQL)

### Why a database alongside blockchain?

- Blockchain is great for **immutability and verification**
- But it's **slow and expensive** for queries like "list all certificates"
- PostgreSQL stores metadata for fast reads; blockchain is the source of truth

### Schema

```
Institution
  ├── id, name, walletAddr, email
  └── certificates[]

Certificate
  ├── certId (on-chain ID)
  ├── certHash (keccak256 of file)
  ├── ipfsCid (IPFS content ID)
  ├── studentName, courseName, etc.
  ├── txHash (blockchain tx)
  └── status (ACTIVE / REVOKED)

VerificationLog
  ├── certId, verifierIp, result, timestamp
```

### Useful Prisma commands

```bash
npx prisma migrate dev --name <migration_name>  # Create migration
npx prisma db push                               # Push schema to DB
npx prisma studio                                # GUI to browse data
npx prisma generate                              # Regenerate client
```

---

## IPFS (Pinata)

[IPFS](https://ipfs.io) is a decentralized file storage protocol. We use [Pinata](https://www.pinata.cloud) as a pinning service.

### Setup Pinata

1. Go to https://www.pinata.cloud and create a free account
2. Go to API Keys → New Key → copy the API Key and Secret
3. Add to `frontend/.env`:
   ```
   PINATA_API_KEY=your_key
   PINATA_SECRET_KEY=your_secret
   ```

### How it works

1. User uploads a PDF → our API sends it to Pinata
2. Pinata pins the file on IPFS and returns a **CID** (Content Identifier)
3. The CID is stored on-chain alongside the certificate hash
4. Anyone with the CID can view the file: `https://gateway.pinata.cloud/ipfs/<CID>`

---

## How It Works (Flow)

### Issuing a Certificate

```
University (Browser + MetaMask)
  │
  ├─ 1. Upload certificate PDF
  ├─ 2. Fill in student details
  ├─ 3. Click "Issue Certificate"
  │
  ▼
Next.js API
  │
  ├─ 4. Compute keccak256 hash of file
  ├─ 5. Upload file to IPFS (Pinata)
  ├─ 6. Save metadata to PostgreSQL
  │
  ▼
Browser
  │
  ├─ 7. Call smart contract issueCertificate()
  ├─ 8. MetaMask prompts to sign transaction
  ├─ 9. Transaction confirmed on blockchain
  └─ 10. Update DB with certId + txHash
```

### Verifying a Certificate

```
Employer (Browser)
  │
  ├─ 1. Enter Certificate ID OR upload file
  │
  ▼
Next.js API
  │
  ├─ 2. If file: compute hash → verifyCertificateByHash()
  ├─ 3. If ID: verifyCertificate(certId)
  ├─ 4. Returns: valid/invalid + student details
  └─ 5. Log verification attempt in DB
```

---

## Key Concepts to Learn

### 🔷 Blockchain Basics
- **What is a blockchain?** — A distributed, immutable ledger
- **Ethereum** — A programmable blockchain that runs smart contracts
- **Gas** — The fee you pay to execute transactions
- **Wallet** — Your identity on the blockchain (public + private key pair)
- **Testnet vs Mainnet** — Testnet is free (fake ETH), mainnet is real money

### 🔷 Solidity (Smart Contract Language)
- **Data types**: `address`, `uint256`, `bytes32`, `string`, `mapping`, `struct`, `enum`
- **Visibility**: `public`, `private`, `external`, `internal`
- **Modifiers**: `onlyOwner`, `onlyIssuer` — guards on who can call a function
- **Events**: Logs emitted by the contract (indexed for efficient querying)
- **View vs Write functions**: View = free (no gas), Write = costs gas

### 🔷 Hardhat (Development Framework)
- Local blockchain node (`npx hardhat node`)
- Compile, test, and deploy contracts
- Console for debugging (`npx hardhat console`)

### 🔷 Ethers.js (JavaScript ↔ Blockchain)
- **Provider** — read-only connection to the blockchain
- **Signer** — a provider that can sign transactions (via MetaMask)
- **Contract** — JavaScript wrapper to call smart contract functions
- **ABI** — the interface definition of your contract

### 🔷 IPFS (InterPlanetary File System)
- Decentralized file storage — no single server
- Files are addressed by their **content hash** (CID)
- **Pinning** — keeping files available (Pinata does this for you)

### 🔷 Prisma ORM
- Type-safe database client for Node.js/TypeScript
- Schema-first approach: define your schema, generate the client
- **Migrations** — version-controlled database changes
- **Prisma Studio** — visual database browser

### 🔷 Next.js 14
- **App Router** — file-based routing in `src/app/`
- **API Routes** — backend endpoints in `src/app/api/`
- **Server Components vs Client Components** — `"use client"` directive
- **Server-side rendering** — pages render on the server first

### 🔷 MetaMask
- Browser extension wallet
- Signs transactions on behalf of the user
- Connects to different networks (localhost, Sepolia, Mainnet)

---

## API Reference

### `GET /api/certificates`
List all certificates. Optional query params: `?issuer=0x…&student=0x…`

### `POST /api/certificates`
Upload a certificate file. Body: `FormData` with fields:
- `file` (File), `studentName`, `studentEmail`, `courseName`, `recipientAddr`, `issuerAddr`, `institutionId`

### `PATCH /api/certificates/:id`
Update with on-chain data. Body: `{ certId, txHash }`

### `POST /api/verify`
Verify a certificate. Body: `{ certId }` or `{ certHash }`

### `GET /api/institutions`
List all registered institutions.

### `POST /api/institutions`
Register a new institution. Body: `{ name, walletAddr, email }`

---

## Deployment to Testnet

To deploy to **Sepolia** testnet instead of localhost:

### 1. Get Sepolia ETH
- Go to https://sepoliafaucet.com or https://faucets.chain.link/sepolia
- Enter your wallet address → receive free test ETH

### 2. Get an RPC URL
- Sign up at https://infura.io or https://alchemy.com
- Create a project → copy the Sepolia RPC URL

### 3. Configure `.env`
```
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=your_wallet_private_key
```

### 4. Deploy
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### 5. Update frontend `.env`
```
NEXT_PUBLIC_CONTRACT_ADDRESS=<deployed_address>
NEXT_PUBLIC_CHAIN_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| MetaMask not connecting | Make sure you added the local network (Chain ID: 31337, RPC: http://127.0.0.1:8545) |
| "Nonce too high" in MetaMask | Settings → Advanced → Clear Activity Tab Data |
| Prisma errors | Run `npx prisma generate` and `npx prisma migrate dev` |
| Contract not found | Check `NEXT_PUBLIC_CONTRACT_ADDRESS` in `.env` matches deployed address |
| IPFS upload fails | Check Pinata API keys in `.env` |
| "Not an authorised issuer" | The wallet must be added via `addIssuer()` by the contract owner |

---

## Learning Resources

Here are recommended resources to deepen your understanding:

1. **Solidity** — https://docs.soliditylang.org
2. **Hardhat** — https://hardhat.org/docs
3. **Ethers.js v6** — https://docs.ethers.org/v6/
4. **Next.js** — https://nextjs.org/docs
5. **Prisma** — https://www.prisma.io/docs
6. **IPFS** — https://docs.ipfs.io
7. **MetaMask Docs** — https://docs.metamask.io
8. **CryptoZombies** (interactive Solidity tutorial) — https://cryptozombies.io
9. **Ethereum.org** — https://ethereum.org/en/developers/

---

## License

MIT — feel free to use this for learning, portfolios, or production projects.

---

**Built with ❤️ for learning blockchain technology.**
