// Create a new file: hooks/useSettledDisputesCount.ts
import { useState, useEffect } from "react";
import { disputeService } from "../services/disputeServices";

export function useSettledDisputesCount() {
  const [settledCount, setSettledCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettledDisputesCount = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch settled disputes
        const response = await disputeService.getSettledDisputes({
          top: 1000, // Get a large number to count all settled disputes
          sort: "desc",
        });

        // The count is the length of the results array
        const count = response?.results?.length || 0;
        setSettledCount(count);

        console.log(`✅ Settled disputes count: ${count}`);
      } catch (err) {
        console.error("Failed to fetch settled disputes count:", err);
        setError("Failed to load settled disputes count");
        // Fallback to 0 if there's an error
        setSettledCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchSettledDisputesCount();
  }, []);

  return { settledCount, loading, error };
}
