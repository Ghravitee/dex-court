// Enhanced types for disputes
export type DisputeStatus =
  | "Pending"
  | "Vote in Progress"
  | "Settled"
  | "Dismissed";

export type RequestKind = "Pro Bono" | "Paid";

// Add vote outcome type
export type VoteOutcome = {
  result: "Plaintiff Wins" | "Defendant Wins" | "Compromise";
  plaintiffVotes: number;
  defendantVotes: number;
  compromiseVotes: number;
  totalVotes: number;
  settlementDetails?: string;
  resolvedAt: string;
};

export type DisputeRow = {
  id: string;
  createdAt: string; // ISO
  title: string;
  request: RequestKind;
  parties: string;
  plaintiff: string;
  defendant: string;
  status: DisputeStatus;
  description: string;
  claim: string;
  evidence: string[]; // URLs or file paths
  witnesses: string[];
  telegramNotificationSent: boolean;
  defendantResponse?: {
    description: string;
    evidence: string[];
    createdAt: string;
  };
  plaintiffReply?: {
    description: string;
    evidence: string[];
    createdAt: string;
  };
  // Add vote outcome for settled disputes
  voteOutcome?: VoteOutcome;
};

// Enhanced mock data with realistic disputes following the same pattern
const disputesData: DisputeRow[] = [
  {
    id: "D-311",
    createdAt: "2025-10-30",
    title: "He disappeared after taking my money for the audit!",
    request: "Paid",
    parties: "@0xAlfa vs @0xBeta",
    plaintiff: "@0xAlfa",
    defendant: "@0xBeta",
    status: "Vote in Progress",
    description:
      "I hired @0xBeta on October 15th to conduct a comprehensive smart contract audit for my DeFi protocol. We agreed on $5,000 for the full audit, and I paid $2,500 upfront as a 50% deposit. He delivered an initial assessment but then completely ghosted me for 3 weeks right when the full report was due. I've sent multiple messages on Telegram and even tried contacting him through mutual connections, but he's been completely unresponsive. His last seen was recently updated, so I know he's active and ignoring me.",
    claim:
      "I want @0xBeta to either deliver the completed audit report immediately or refund my $2,500 deposit since he abandoned the project.",
    evidence: [
      "https://etherscan.io/tx/0x123456789abc",
      "/telegram_audit_conversation_no_frame.webp",
      "/Smart_Contract_Audit_Agreement.pdf",
      "/Smart_Contract_Audit_Agreement.pdf",
    ],
    witnesses: ["@audit_expert", "@web3_legal"],
    telegramNotificationSent: true,
    defendantResponse: {
      description:
        "I had a family emergency that required my immediate attention. The audit is 85% complete and I can deliver it within 5 days. @0xAlfa has been sending aggressive messages daily which made the situation more stressful.",
      evidence: [
        "/hospital-medical-certificate.pdf",
        "/telegram_chat_history.pdf",
      ],
      createdAt: "2025-11-02",
    },
  },
  {
    id: "D-309",
    createdAt: "2025-10-28",
    title: "Ghosted me after taking deposit for NFT collection!",
    request: "Pro Bono",
    parties: "@0xAstra vs @0xNova",
    plaintiff: "@0xAstra",
    defendant: "@0xNova",
    status: "Pending",
    description:
      "On October 1st, I commissioned @0xNova to create a 100-piece NFT collection for my project. We agreed on 1 ETH total, and I paid 0.5 ETH deposit. The delivery date was October 25th, but he completely disappeared around October 20th. I only received 15 poorly made NFTs that look nothing like the examples he showed me. He's been offline on Telegram for over a week, but I saw him active on Twitter yesterday posting about other projects. I trusted him because he came highly recommended from a friend in the space.",
    claim:
      "Full refund of my 0.5 ETH deposit plus 0.2 ETH compensation for the missed launch window that cost me potential sales.",
    evidence: [
      "https://etherscan.io/tx/0x789abcdef123",
      "/nft_brief_specs.pdf",
      "/original_dm_conversation.pdf",
      "twitter_activity_screenshots.png",
      "/telegram_chat_history.pdf",
    ],
    witnesses: ["@nft_creator", "@art_director"],
    telegramNotificationSent: true,
  },
  {
    id: "D-300",
    createdAt: "2025-10-14",
    title: "Stole my artwork and made money from it!",
    request: "Paid",
    parties: "@0xOrion vs @0xEcho",
    plaintiff: "@0xOrion",
    defendant: "@0xEcho",
    status: "Settled",
    description:
      "I shared my character designs with @0xEcho in a private Discord server on September 5th, asking for feedback. I clearly stated these were my original creations and not to be used commercially. To my shock, I discovered on October 10th that he minted and sold 500 NFTs using my exact designs without any permission or attribution. He made approximately 2.5 ETH from sales. When I confronted him, he initially denied it but then admitted it and offered me a small percentage, which I refused.",
    claim:
      "Transfer of all 2.5 ETH revenue generated from my stolen artwork, immediate delisting of the NFT collection, and public apology acknowledging the theft.",
    evidence: [
      "original_design_files.psd",
      "discord_chat_screenshots.png",
      "opensea_collection_proof.png",
      "/revenue_transactions.pdf",
      "admission_chat_screenshots.png",
    ],
    witnesses: ["@ip_lawyer", "@digital_artist"],
    telegramNotificationSent: true,
    defendantResponse: {
      description:
        "I misunderstood the terms - I thought since the artwork was shared in a community server, it was open for inspiration. I've already removed the collection and I'm willing to pay 50% of the revenue as a licensing fee.",
      evidence: ["/placeholder_evidence.pdf"],
      createdAt: "2025-10-18",
    },
    plaintiffReply: {
      description:
        "This wasn't a misunderstanding - I have clear messages stating these were my proprietary designs. The server rules explicitly say all shared content remains creator property. Full revenue transfer is the minimum acceptable resolution.",
      evidence: ["server_rules_screenshot.png", "/placeholder_evidence.pdf"],
      createdAt: "2025-10-20",
    },
    voteOutcome: {
      result: "Plaintiff Wins",
      plaintiffVotes: 8,
      defendantVotes: 2,
      compromiseVotes: 1,
      totalVotes: 11,
      settlementDetails:
        "Defendant ordered to transfer 2.0 ETH to plaintiff and issue public apology. NFT collection permanently delisted.",
      resolvedAt: "2025-10-25",
    },
  },
  {
    id: "D-296",
    createdAt: "2025-10-09",
    title: "Took my money and vanished for website development!",
    request: "Pro Bono",
    parties: "@0xZen vs @0xVolt",
    plaintiff: "@0xZen",
    defendant: "@0xVolt",
    status: "Dismissed",
    description:
      "I hired @0xVolt on September 15th to build a responsive React website for my crypto project. We had one video call to discuss requirements, and I sent him 0.3 ETH as upfront payment. That was the last I heard from him. He stopped responding to my Telegram messages after September 18th. I've tried contacting him through every channel possible - Telegram, Twitter, email - but he's completely ghosted me. No code, no updates, nothing. I found out through a mutual connection that he's been active and taking other projects.",
    claim:
      "Full refund of 0.3 ETH since he took the money and provided absolutely nothing in return.",
    evidence: [
      "https://etherscan.io/tx/0xdef456789abc",
      "/telegram_chat_history.pdf",
      "/email_screenshots.pdf",
    ],
    witnesses: ["@web_dev", "@project_manager"],
    telegramNotificationSent: true,
  },
  {
    id: "D-315",
    createdAt: "2025-11-01",
    title: "His buggy code cost me 5 ETH!",
    request: "Paid",
    parties: "@0xFlash vs @0xSpider",
    plaintiff: "@0xFlash",
    defendant: "@0xSpider",
    status: "Pending",
    description:
      "I paid @0xSpider 1.2 ETH on October 20th to develop a custom staking contract for my project. He delivered the code on October 25th, and I deployed it with 5 ETH in the treasury. Within 24 hours, someone exploited a critical vulnerability in the contract and drained all 5 ETH. When I analyzed the code, I found a obvious reentrancy bug that any experienced developer should have caught. @0xSpider admitted the bug exists but says it's not his responsibility since I 'approved' the code. I lost my entire project treasury because of his negligence.",
    claim:
      "Full refund of 1.2 ETH development fee plus compensation for the 5 ETH lost due to his incompetent code.",
    evidence: [
      "https://etherscan.io/tx/0xabc123def456",

      "/Bug_Analysis_Report.pdf",
      "/telegram_chat_history.pdf",
      "telegram_admission_screenshots.png",
    ],
    witnesses: ["@solidity_expert", "@security_auditor"],
    telegramNotificationSent: false,
  },
  {
    id: "D-320",
    createdAt: "2025-11-03",
    title: "Refused to refund despite going AWOL for weeks!",
    request: "Pro Bono",
    parties: "@0xFlash vs @0xSpider",
    plaintiff: "@0xFlash",
    defendant: "@0xSpider",
    status: "Pending",
    description:
      "We entered an agreement on the 3rd of September concerning a website development. He was supposed to build a responsive website for me and we agreed that $250 was a fair price for the job. I didn't know about DexCourt when we entered the agreement so there was no Escrow, I trusted him cuz I trust the person who recommended him to me. Only for him to ghost me after paying $150 deposit. I tried to reach him through his tg and X account but no response. He was offline for a while then 3 days ago, I noticed his last seen was recent, so I decided to text him again. He still didn't respond. Then I saw DexCourt's post on X about helping people resolve disputes, so I decided to give it a shot.",
    claim:
      "I want my $150 refunded immediately since he abandoned the project and has been unresponsive for weeks.",
    evidence: [
      "/request-history.webp",
      "/payment-150.webp",
      "/placeholder_evidence.pdf",
    ],
    witnesses: ["@web_developer", "@mutual_friend"],
    telegramNotificationSent: true,
  },
  {
    id: "D-318",
    createdAt: "2025-11-02",
    title: "Delivered broken code and blocked me everywhere!",
    request: "Paid",
    parties: "@CryptoQueen vs @DevDragon",
    plaintiff: "@CryptoQueen",
    defendant: "@DevDragon",
    status: "Vote in Progress",
    description:
      "I paid @DevDragon 0.8 ETH on October 10th to build a custom token dashboard. He delivered the code on October 25th, but it was completely broken - wouldn't even compile. When I asked for fixes, he became defensive and said I didn't provide clear requirements. Then he just blocked me on Telegram and Twitter! I can see he's still active and taking new clients while ignoring my requests for either working code or a refund. This has set my project back by weeks.",
    claim:
      "Full refund of 0.8 ETH since the delivered code is completely unusable and he's refusing to communicate.",
    evidence: ["/errors.webp", "/blocked-chat.webp"],
    witnesses: ["@fullstack_dev", "@qa_tester"],
    telegramNotificationSent: true,
    defendantResponse: {
      description:
        "The client kept changing requirements daily and was never satisfied. The code works fine - she just doesn't know how to set it up properly. I blocked her because she was sending harassing messages at all hours.",
      evidence: ["/changing_requirements_chat.pdf"],
      createdAt: "2025-11-04",
    },
  },
];

// 🧩 Fetch all disputes
export function getDisputes(): Promise<DisputeRow[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(disputesData), 500);
  });
}

// 🧩 Fetch single dispute by ID
export function getDisputeById(id: string): Promise<DisputeRow | undefined> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const dispute = disputesData.find((d) => d.id === id);
      resolve(dispute);
    }, 400);
  });
}

// 🧩 Create new dispute
export function createDispute(
  disputeData: Omit<
    DisputeRow,
    "id" | "createdAt" | "parties" | "telegramNotificationSent"
  >,
): Promise<DisputeRow> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newDispute: DisputeRow = {
        ...disputeData,
        id: `D-${Math.floor(300 + Math.random() * 100)}`,
        createdAt: new Date().toISOString().split("T")[0],
        parties: `${disputeData.plaintiff} vs ${disputeData.defendant}`,
        telegramNotificationSent: false,
      };
      disputesData.unshift(newDispute);
      resolve(newDispute);
    }, 600);
  });
}
