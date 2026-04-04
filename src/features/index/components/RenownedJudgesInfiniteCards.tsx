import { useMemo } from "react";
import { InfiniteMovingJudges } from "../../../components/ui/infinite-moving-judges";
import avatar1 from "../../../assets/avatar-1.svg";
import avatar2 from "../../../assets/avatar-2.webp";
import avatar3 from "../../../assets/avatar-3.webp";
import avatar4 from "../../../assets/avatar4.webp";
import { type JudgeItem } from "../types";

export const RenownedJudgesInfiniteCards = () => {
  const judgeItems: JudgeItem[] = useMemo(
    () => [
      {
        quote:
          "Lead arbitrator, Solidity auditor, and DAO governance advisor with 5+ years in on-chain dispute resolution. Known for technical fairness and precise smart contract analysis.",
        name: "@judgeNova",
        title: "Lead Arbitrator • Solidity Expert",
        avatar: avatar2,
        userId: "judgeNova",
      },
      {
        quote:
          "Founder of AresLabs • DeFi risk analyst and strategist. Brings deep financial expertise to tokenomics disputes and contract risk assessments.",
        name: "@judgeAres",
        title: "DeFi Risk Analyst • Financial Strategist",
        avatar: avatar1,
        userId: "judgeAres",
      },
      {
        quote:
          "Full-stack developer and Layer-2 researcher with focus on zk-rollups and protocol efficiency. Mediates technical disputes with balanced reasoning.",
        name: "@judgeKai",
        title: "Full-Stack Developer • L2 Researcher",
        avatar: avatar4,
        userId: "judgeKai",
      },
      {
        quote:
          "Corporate lawyer and IP rights advocate bridging Web2 and Web3 legal frameworks. Oversees intellectual property and compliance-related disputes.",
        name: "@judgeVera",
        title: "Corporate Lawyer • IP Rights Expert",
        avatar: avatar3,
        userId: "judgeVera",
      },
      {
        quote:
          "Protocol governance specialist and DAO operations consultant. Focuses on collective decision-making ethics and decentralization fairness.",
        name: "@judgeOrion",
        title: "Governance Specialist • DAO Consultant",
        avatar: avatar4,
        userId: "judgeOrion",
      },
    ],
    [],
  );

  return (
    <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-transparent p-6">
      <h3 className="glow-text mb-4 text-xl font-semibold text-cyan-100">
        Renowned Judges
      </h3>
      <InfiniteMovingJudges
        items={judgeItems}
        direction="right"
        speed="slow"
        pauseOnHover={true}
        className="max-w-full"
      />
    </div>
  );
};
