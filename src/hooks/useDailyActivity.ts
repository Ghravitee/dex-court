// hooks/useDailyActivity.ts
import { useState, useEffect } from "react";
import { usePublicAgreements } from "./usePublicAgreements";

interface DailyActivity {
  date: string; // YYYY-MM-DD
  newAgreements: number;
}

export function useDailyActivity() {
  const { agreements, loading } = usePublicAgreements();
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);

  useEffect(() => {
    if (!loading && agreements.length > 0) {
      // Group agreements by creation date
      const activityByDate = new Map<string, number>();

      agreements.forEach((agreement) => {
        // Extract just the date part (YYYY-MM-DD)
        const date = agreement.dateCreated.split("T")[0];
        activityByDate.set(date, (activityByDate.get(date) || 0) + 1);
      });

      // Convert to array and sort
      const activityArray = Array.from(activityByDate.entries())
        .map(([date, count]) => ({ date, newAgreements: count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setDailyActivity(activityArray);
    }
  }, [agreements, loading]);

  return { data: dailyActivity, loading };
}
