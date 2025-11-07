// hooks/useUsersCount.ts
import { useState, useEffect } from "react";
import { disputeService } from "../services/disputeServices";

export function useUsersCount() {
  const [usersCount, setUsersCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsersCount = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use the getAllUsers method from disputeService
        const allUsers = await disputeService.getAllUsers();

        // The count is the length of the users array
        const count = Array.isArray(allUsers) ? allUsers.length : 0;
        setUsersCount(count);

        console.log(`✅ Users count: ${count}`);
      } catch (err) {
        console.error("Failed to fetch users count:", err);
        setError("Failed to load users count");
        // Fallback to 0 if there's an error
        setUsersCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchUsersCount();
  }, []);

  return { usersCount, loading, error };
}
