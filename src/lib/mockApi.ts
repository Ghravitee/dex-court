import type { Agreement } from "../types";

const agreements: Agreement[] = [
  {
    id: 1,
    title: "Dev Retainer Q1",
    type: "Private",
    counterparty: "@0xAres",
    description:
      "Development retainer agreement for Q1 deliverables. Payments made monthly upon delivery of code review reports.",
    images: [],
    deadline: "2025-11-01",
    includeFunds: "yes",
    useEscrow: true,
    token: "USDC",
    amount: "1000",
    status: "completed",
    createdBy: "@0xNova",
    dateCreated: "2025-09-22",
    escrowAddress: "0x1234abcd5678ef901234567890abcdef12345678",
  },
  {
    id: 2,
    title: "Brand Design",
    type: "Public",
    counterparty: "@0xEcho",
    description:
      "Logo and brand identity for marketing campaigns. 50% upfront and 50% after final approval. Edits limited to 3 rounds.",
    images: ["brand.png"],
    deadline: "2025-10-28",
    includeFunds: "yes",
    useEscrow: false,
    token: "DAI",
    amount: "500",
    status: "pending",
    createdBy: "@0xNova",
    dateCreated: "2025-09-30",
  },
  {
    id: 3,
    title: "Smart Contract Audit",
    type: "Private",
    counterparty: "@0xSecure",
    description:
      "Comprehensive security audit for DeFi protocol smart contracts. Full audit report delivered within 4 weeks. Critical fixes included.",
    images: ["audit-report.pdf"],
    deadline: "2025-12-15",
    includeFunds: "yes",
    useEscrow: true,
    token: "ETH",
    amount: "2.5",
    status: "disputed", // 🔹 changed from "signed"
    createdBy: "@0xTech",
    dateCreated: "2025-10-05",
    escrowAddress: "0x7890abcdef1234567890abcdef1234567890abcd",
  },
  {
    id: 4,
    title: "NFT Collection Launch",
    type: "Public",
    counterparty: "@0xArtist",
    description:
      "Creation and launch of 10,000 generative NFT collection. Royalties set at 7.5%. Artist retains commercial rights.",
    images: ["nft-sample1.jpg", "nft-sample2.jpg"],
    deadline: "2025-11-30",
    includeFunds: "yes",
    useEscrow: true,
    token: "ETH",
    amount: "5",
    status: "disputed", // 🔹 changed from "pending"
    createdBy: "@0xGallery",
    dateCreated: "2025-10-08",
    escrowAddress: "0xdef456abc789012def456abc789012def456abc7",
  },
  {
    id: 5,
    title: "DAO Treasury Management",
    type: "Private",
    counterparty: "@0xFinance",
    description:
      "Quarterly treasury management and investment strategy for DAO. Monthly performance reports required. All investments must be approved by governance.",
    images: [],
    deadline: "2025-12-31",
    includeFunds: "no",
    status: "draft",
    createdBy: "@0xGov",
    dateCreated: "2025-10-12",
  },
  {
    id: 6,
    title: "Mobile App Development",
    type: "Private",
    counterparty: "@0xDevs",
    description:
      "Cross-platform mobile application for crypto wallet management. Milestone-based payments. Source code ownership transfers upon final payment.",
    images: ["wireframes.pdf", "design-system.fig"],
    deadline: "2026-02-28",
    includeFunds: "yes",
    useEscrow: true,
    token: "USDC",
    amount: "15000",
    status: "disputed", // 🟢 remains disputed
    createdBy: "@0xWallet",
    dateCreated: "2025-09-15",
    escrowAddress: "0x2345678901bcdef2345678901bcdef2345678901",
  },
  {
    id: 7,
    title: "Content Marketing Campaign",
    type: "Public",
    counterparty: "@0xContent",
    description:
      "3-month content marketing campaign including blog posts and social media. 12 blog posts and 60 social media posts. Performance metrics tracked weekly.",
    images: ["content-calendar.xlsx"],
    deadline: "2025-11-20",
    includeFunds: "yes",
    useEscrow: false,
    token: "DAI",
    amount: "3000",
    status: "completed",
    createdBy: "@0xMarketing",
    dateCreated: "2025-08-22",
  },
  {
    id: 8,
    title: "Node Operation Services",
    type: "Private",
    counterparty: "@0xInfra",
    description:
      "Dedicated node operation and maintenance for blockchain network. 99.9% uptime guarantee. 24/7 monitoring and support included.",
    images: [],
    deadline: "2026-01-15",
    includeFunds: "yes",
    useEscrow: true,
    token: "ETH",
    amount: "8",
    status: "signed",
    createdBy: "@0xNetwork",
    dateCreated: "2025-10-01",
    escrowAddress: "0x8901234567cdef8901234567cdef8901234567cd",
  },
  {
    id: 9,
    title: "Legal Framework Review",
    type: "Private",
    counterparty: "@0xLegal",
    description:
      "Compliance review of tokenomics and governance structure. Confidentiality required. All findings delivered in written report.",
    images: ["legal-assessment.docx"],
    deadline: "2025-10-25",
    includeFunds: "yes",
    useEscrow: false,
    token: "USDC",
    amount: "2500",
    status: "cancelled",
    createdBy: "@0xStartup",
    dateCreated: "2025-09-10",
  },
  {
    id: 10,
    title: "Community Moderation",
    type: "Public",
    counterparty: "@0xMods",
    description:
      "24/7 community moderation for Discord and Telegram channels. Monthly reporting required. Emergency response within 15 minutes.",
    images: [],
    deadline: "2025-12-31",
    includeFunds: "yes",
    useEscrow: true,
    token: "USDT",
    amount: "1200",
    status: "pending",
    createdBy: "@0xCommunity",
    dateCreated: "2025-10-03",
    escrowAddress: "0x4567890123efab4567890123efab4567890123ef",
  },
];

// Simulate network delay
function simulateDelay<T>(data: T, delay = 600): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), delay));
}

export function fetchAgreements(): Promise<Agreement[]> {
  return simulateDelay(agreements);
}

export function fetchAgreementById(id: number): Promise<Agreement | undefined> {
  const agreement = agreements.find((a) => a.id === id);
  return simulateDelay(agreement);
}

export function createAgreement(
  newAgreement: Omit<Agreement, "id" | "dateCreated">,
): Promise<Agreement> {
  const created = {
    ...newAgreement,
    id: agreements.length + 1,
    dateCreated: new Date().toISOString().split("T")[0],
  };
  agreements.push(created);
  return simulateDelay(created);
}
