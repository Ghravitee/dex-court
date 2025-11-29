import { useState, useEffect } from "react";
import { apiService } from "../services/apiService";

export function useJudgesCount() {
  const [judgesCount, setJudgesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJudgesCount = async () => {
      try {
        setLoading(true);
        // Use the same method as the admin page
        const allUsers = await apiService.getAdminUsers();

        // Filter users with role === 2 (judges)
        const judges = allUsers.filter((user) => user.role === 2);

        setJudgesCount(judges.length);
      } catch (error) {
        console.error("Error fetching judges count:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJudgesCount();
  }, []);

  return { judgesCount, loading };
}
