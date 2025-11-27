// src/contexts/AuthContext.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { loginTelegram, api } from "../lib/apiClient";
import { agreementService } from "../services/agreementServices";
import type { AccountSummaryDTO } from "../services/apiService";
import { walletLinkingService } from "../services/walletLinkingService";
import { authQueryKeys } from "../constants/auth";
import type { User, AuthContextType } from "../types/auth.types";
import { AuthContext } from "./AuthContext.context";

// Helper functions (not exported)
function isValidToken(token: string | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  if (token.length < 10) return false;
  return true;
}

function getAvatarUrl(
  userId: string,
  avatarId: number | null,
): string | undefined {
  if (!avatarId || !userId || userId === "unknown") return undefined;
  const timestamp = Date.now();
  return `https://dev-api.dexcourt.com/accounts/${userId}/file/${avatarId}?t=${timestamp}`;
}

function mapApiResponseToUser(apiUser: AccountSummaryDTO): User {
  function getRolesFromRoleNumber(role: number, isAdmin: boolean) {
    return {
      admin: isAdmin, // Use the new isAdmin field directly
      judge: role === 2, // 2 is judge
      community: role === 1, // 1 is community
      user: role >= 0, // Any non-negative role is a user
    };
  }

  const calculateTrustScore = (isVerified: boolean, role: number) => {
    let score = 50;
    if (isVerified) score += 20;
    if (role === 2 || role === 3) score += 15;
    if (role === 1 || role === 3) score += 10;
    return Math.min(score, 100);
  };

  const roles = getRolesFromRoleNumber(
    apiUser.role || 0,
    apiUser.isAdmin || false,
  );
  const trustScore = calculateTrustScore(apiUser.isVerified, apiUser.role || 0);

  const telegram = apiUser.telegram
    ? { username: apiUser.telegram.username, id: apiUser.telegram.id }
    : undefined;

  return {
    id: apiUser.id.toString(),
    username: apiUser.username || "",
    bio: apiUser.bio || null,
    isVerified: apiUser.isVerified,
    isAdmin: apiUser.isAdmin || false, //
    telegram,
    walletAddress: apiUser.walletAddress,
    role: apiUser.role || 0,
    avatarId: apiUser.avatarId || null,
    handle: `@${apiUser.username || "user"}`,
    wallet: apiUser.walletAddress
      ? `${apiUser.walletAddress.slice(0, 6)}…${apiUser.walletAddress.slice(-4)}`
      : "Not connected",
    trustScore,
    roles,
    stats: {
      deals: 0,
      agreements: 0,
      disputes: 0,
      revenue: { "7d": 0, "30d": 0, "90d": 0 },
    },
    joinedDate: new Date().toISOString().split("T")[0],
    verified: apiUser.isVerified,
    avatarUrl:
      apiUser.avatarUrl ||
      getAvatarUrl(apiUser.id.toString(), apiUser.avatarId || null),
  };
}

function createFallbackUser(): User {
  return {
    id: "unknown",
    username: "",
    bio: null,
    isVerified: false,
    isAdmin: false,
    walletAddress: null,
    role: 0,
    avatarId: null,
    handle: "@user",
    wallet: "Not connected",
    trustScore: 50,
    roles: { judge: false, community: false, admin: false, user: true },
    stats: {
      deals: 0,
      agreements: 0,
      disputes: 0,
      revenue: { "7d": 0, "30d": 0, "90d": 0 },
    },
    joinedDate: new Date().toISOString().split("T")[0],
  };
}

async function fetchCurrentUser(): Promise<User | null> {
  const token = localStorage.getItem("authToken");
  if (!token) return null;

  try {
    const response = await api.get("/accounts/mine");
    const apiUser = response.data;
    return mapApiResponseToUser(apiUser);
  } catch (error) {
    console.error("🔐 Failed to get user data from API:", error);

    if (
      error instanceof Error &&
      error.message.includes("Authentication failed")
    ) {
      console.warn("🔐 Authentication error, clearing token");
      localStorage.removeItem("authToken");
      agreementService.clearAuthToken();
    }

    return createFallbackUser();
  }
}

function storeAuthToken(token: string): void {
  localStorage.setItem("authToken", token);
  agreementService.setAuthToken(token);
}

function clearAuthToken(): void {
  localStorage.removeItem("authToken");
  agreementService.clearAuthToken();
}

// ONLY COMPONENT EXPORT - NO CONTEXT, NO HOOKS
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const initializedRef = useRef(false);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);

  const [loginMethod, setLoginMethod] = useState<"telegram" | "wallet" | null>(
    null,
  );

  const {
    data: userData,
    isLoading: userLoading,
    refetch: refetchUser,
  } = useQuery({
    queryKey: authQueryKeys.currentUser(),
    queryFn: fetchCurrentUser,
    enabled: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) return false;
      return failureCount < 2;
    },
  });

  const telegramLoginMutation = useMutation({
    mutationFn: loginTelegram,
    onSuccess: (response) => {
      const token = response.token?.trim();
      if (!token) throw new Error("No token received from server");
      storeAuthToken(token);
      setLoginMethod("telegram"); // Track that user logged in via Telegram
      queryClient.invalidateQueries({ queryKey: authQueryKeys.user });
      refetchUser();
    },
    onError: () => {
      clearAuthToken();
      setLoginMethod(null);
    },
  });

  const walletLoginMutation = useMutation({
    mutationFn: ({
      walletAddress,
      signature,
    }: {
      walletAddress: string;
      signature: string;
    }) => walletLinkingService.verifyWalletLogin({ walletAddress, signature }),
    onSuccess: (response) => {
      const token = response.token?.trim();
      if (!token) throw new Error("No token received from server");
      storeAuthToken(token);
      setLoginMethod("wallet"); // Track that user logged in via wallet
      queryClient.invalidateQueries({ queryKey: authQueryKeys.user });
      refetchUser();
    },
    onError: () => {
      clearAuthToken();
      setLoginMethod(null);
    },
  });

  const linkWalletMutation = useMutation({
    mutationFn: ({
      walletAddress,
      signature,
    }: {
      walletAddress: string;
      signature: string;
    }) =>
      walletLinkingService.verifyAndLinkWallet({ walletAddress, signature }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authQueryKeys.user });
      refetchUser();
    },
  });

  const linkTelegramMutation = useMutation({
    mutationFn: (otp: string) => walletLinkingService.linkTelegram(otp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authQueryKeys.user });
      refetchUser();
    },
  });

  const generateLinkingNonceMutation = useMutation({
    mutationFn: (walletAddress: string) =>
      walletLinkingService.generateLinkingNonce(walletAddress),
  });

  const generateLoginNonceMutation = useMutation({
    mutationFn: (walletAddress: string) =>
      walletLinkingService.generateLoginNonce(walletAddress),
  });

  useEffect(() => {
    if (userData) {
      setUser(userData);
      setIsAuthenticated(userData.id !== "unknown");
    }

    if (!userLoading) {
      setIsAuthInitialized(true);
    }
  }, [userData, userLoading]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initializeAuth = async () => {
      const token = localStorage.getItem("authToken");

      if (token && !isValidToken(token)) {
        clearAuthToken();
        setIsAuthInitialized(true);
        return;
      }

      if (token) {
        agreementService.setAuthToken(token);
        await refetchUser();
      }

      setIsAuthInitialized(true);
    };

    initializeAuth();
  }, [refetchUser]);

  const login = async (otp: string): Promise<void> => {
    try {
      console.log("🔐 [AuthContext] Starting Telegram login...");
      await telegramLoginMutation.mutateAsync(otp);
      console.log("🔐 [AuthContext] Telegram login completed successfully");
    } catch (error) {
      console.error("🔐 [AuthContext] Login failed:", error);
      throw error;
    }
  };

  const logout = (): void => {
    clearAuthToken();
    setLoginMethod(null);
    queryClient.removeQueries({ queryKey: authQueryKeys.user });
    setUser(null);
    setIsAuthenticated(false);
  };

  const generateLinkingNonce = async (
    walletAddress: string,
  ): Promise<string> => {
    const response =
      await generateLinkingNonceMutation.mutateAsync(walletAddress);
    if (!response.nonce) throw new Error("No nonce in response");
    return response.nonce;
  };

  const linkWallet = async (
    walletAddress: string,
    signature: string,
  ): Promise<void> => {
    if (user && user.walletAddress) {
      if (user.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error(
          `You can only connect your linked wallet: ${user.walletAddress.slice(0, 8)}...${user.walletAddress.slice(-6)}`,
        );
      }
    }
    await linkWalletMutation.mutateAsync({ walletAddress, signature });
  };

  const linkTelegram = async (otp: string): Promise<void> => {
    await linkTelegramMutation.mutateAsync(otp);
  };

  const generateLoginNonce = async (walletAddress: string): Promise<string> => {
    const response =
      await generateLoginNonceMutation.mutateAsync(walletAddress);
    if (!response.nonce) throw new Error("No login nonce in response");
    return response.nonce;
  };

  const loginWithWallet = async (
    walletAddress: string,
    signature: string,
  ): Promise<void> => {
    try {
      await walletLoginMutation.mutateAsync({ walletAddress, signature });
    } catch (error) {
      console.error("🔐 Wallet login failed:", error);
      throw error;
    }
  };

  const refreshUser = useCallback(async (): Promise<void> => {
    await refetchUser();
  }, [refetchUser]);

  const isLoading =
    userLoading ||
    telegramLoginMutation.isPending ||
    walletLoginMutation.isPending ||
    linkWalletMutation.isPending ||
    linkTelegramMutation.isPending;

  const contextValue: AuthContextType = {
    isAuthenticated,
    isAuthInitialized,
    isLoading,
    user,
    login,
    logout,
    refreshUser,
    linkWallet,
    linkTelegram,
    generateLinkingNonce,
    loginWithWallet,
    generateLoginNonce,
    loginMethod,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
