// hooks/useTrustScore.ts
import { useReputationHistory } from "./useReputation";

const useTrustScore = (accountId: string | null) => {
  const {
    data: reputationHistory,
    loading,
    error,
  } = useReputationHistory(accountId);

  // Calculate trust score from reputation data
  const trustScore = reputationHistory?.finalScore || 0;

  // Ensure the score is within 0-100 range for the TrustMeter
  const normalizedScore = Math.max(0, Math.min(100, trustScore));

  return {
    trustScore: normalizedScore,
    finalScore: trustScore, // The actual final score from API
    baseScore: reputationHistory?.baseScore || 0,
    loading,
    error,
    reputationHistory,
  };
};

export default useTrustScore;
