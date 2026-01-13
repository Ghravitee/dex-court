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

        // Filter for active/valid users only
        const activeUsers = Array.isArray(allUsers)
          ? allUsers.filter((user) => {
              // A user is considered active if they have EITHER:
              // 1. A Telegram username (not null/empty)
              // 2. A wallet address (not null/empty)

              const hasTelegramUsername =
                user.telegram?.username &&
                user.telegram.username.trim().length > 0;

              const hasWalletAddress =
                user.walletAddress && user.walletAddress.trim().length > 0;

              return hasTelegramUsername || hasWalletAddress;
            })
          : [];

        const count = activeUsers.length;
        setUsersCount(count);

        console.log(
          `✅ Active users count: ${count} (filtered from ${Array.isArray(allUsers) ? allUsers.length : 0} total)`,
        );

        // Optional: Detailed breakdown for debugging
        if (Array.isArray(allUsers)) {
          const telegramOnly = allUsers.filter(
            (u) => u.telegram?.username && !u.walletAddress,
          ).length;
          const walletOnly = allUsers.filter(
            (u) => u.walletAddress && !u.telegram?.username,
          ).length;
          const both = allUsers.filter(
            (u) => u.telegram?.username && u.walletAddress,
          ).length;
          const neither = allUsers.filter(
            (u) => !u.telegram?.username && !u.walletAddress,
          ).length;

          console.log("📊 User breakdown:", {
            telegramOnly,
            walletOnly,
            both,
            neither,
            total: allUsers.length,
          });
        }
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
