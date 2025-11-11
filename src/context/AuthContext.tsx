// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { loginTelegram, apiService, api } from "../lib/apiClient";
import { agreementService } from "../services/agreementServices";
import type { AccountSummaryDTO } from "../services/apiService";
import { walletLinkingService } from "../services/walletLinkingService";

// Update User interface to match the actual API response
export interface User {
  id: string;
  username: string;
  bio: string | null;
  isVerified: boolean;
  telegram?: {
    username: string;
    id: string;
  };
  telegramUsername?: string;
  walletAddress: string | null;
  role: number;
  avatarId: number | null;
  // Optional fields for UI compatibility
  handle?: string;
  wallet?: string;
  trustScore?: number;
  roles?: {
    judge: boolean;
    community: boolean;
    user: boolean;
  };
  stats?: {
    deals: number;
    agreements: number;
    disputes: number;
    revenue: {
      "7d": number;
      "30d": number;
      "90d": number;
    };
  };
  joinedDate?: string;
  verified?: boolean;
  avatarUrl?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;

  login: (otp: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  // NEW: Wallet linking functionality
  linkWallet: (walletAddress: string, signature: string) => Promise<void>;
  linkTelegram: (otp: string) => Promise<void>;
  generateLinkingNonce: (walletAddress: string) => Promise<string>;

  loginWithWallet: (walletAddress: string, signature: string) => Promise<void>;
  generateLoginNonce: (walletAddress: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cache for user data to prevent duplicate fetches
let userDataCache: { user: User | null; timestamp: number } | null = null;
const USER_CACHE_DURATION = 60000; // 1 minute

// Helper function to validate token format (basic check)
function isValidToken(token: string | null): boolean {
  if (!token) return false;

  // Basic JWT format validation - should have 3 parts separated by dots
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  // Check if it's a reasonable length
  if (token.length < 10) return false;

  return true;
}

function getAvatarUrl(
  userId: string,
  avatarId: number | null,
): string | undefined {
  if (!avatarId || !userId || userId === "unknown") return undefined;

  // Add timestamp to avoid caching issues
  const timestamp = new Date().getTime();
  return `https://dev-api.dexcourt.com/accounts/${userId}/file/${avatarId}?t=${timestamp}`;
}

// AuthContext.tsx - Fix the telegram mapping
function mapApiResponseToUser(apiUser: AccountSummaryDTO): User {
  // Determine roles based on the role number from API
  function getRolesFromRoleNumber(role: number) {
    // Based on typical role number patterns:
    // 0 = Basic User
    // 1 = Community Member
    // 2 = Judge
    // 3 = Admin (has both community and judge privileges)
    return {
      judge: role === 2 || role === 3,
      community: role === 1 || role === 3,
      user: role >= 0, // All authenticated users are basic users
    };
  }

  // Calculate trust score based on verification and other factors
  const calculateTrustScore = (isVerified: boolean, role: number) => {
    let score = 50; // Base score

    if (isVerified) score += 20;
    if (role === 2 || role === 3) score += 15; // Judges get bonus
    if (role === 1 || role === 3) score += 10; // Community members get bonus

    return Math.min(score, 100); // Cap at 100
  };

  const roles = getRolesFromRoleNumber(apiUser.role || 0);
  const trustScore = calculateTrustScore(apiUser.isVerified, apiUser.role || 0);

  const telegram = apiUser.telegram
    ? {
        username: apiUser.telegram.username,
        id: apiUser.telegram.id,
      }
    : undefined;

  return {
    id: apiUser.id.toString(),
    username: apiUser.username || "",
    bio: apiUser.bio || null,
    isVerified: apiUser.isVerified,
    telegram: telegram, // Use the corrected telegram data
    walletAddress: apiUser.walletAddress,
    role: apiUser.role || 0,
    avatarId: apiUser.avatarId || null,
    // UI compatibility fields
    handle: `@${apiUser.username || "user"}`,
    wallet: apiUser.walletAddress
      ? `${apiUser.walletAddress.slice(0, 6)}…${apiUser.walletAddress.slice(-4)}`
      : "Not connected",
    trustScore,
    roles,
    stats: {
      deals: 0, // These will come from separate API calls
      agreements: 0,
      disputes: 0,
      revenue: { "7d": 0, "30d": 0, "90d": 0 },
    },
    joinedDate: new Date().toISOString().split("T")[0], // You might want to get this from API
    verified: apiUser.isVerified,
    avatarUrl:
      apiUser.avatarUrl ||
      getAvatarUrl(apiUser.id.toString(), apiUser.avatarId || null),
  };
}

// Debounced user fetch to prevent rapid consecutive calls
let pendingUserFetch: Promise<User | null> | null = null;

async function getCurrentUser(): Promise<User | null> {
  const token = localStorage.getItem("authToken");

  if (!token) {
    return null;
  }

  // Return cached data if available and not expired
  const now = Date.now();
  if (userDataCache && now - userDataCache.timestamp < USER_CACHE_DURATION) {
    return userDataCache.user;
  }

  // If there's already a pending request, return that instead of making a new one
  if (pendingUserFetch) {
    return pendingUserFetch;
  }

  pendingUserFetch = (async () => {
    try {
      // You'll need to implement this method in your apiService or use the cachedGet
      // Replace the fetch call with:
      const response = await api.get("/accounts/mine", {
        headers: {
          Authorization: token,
        },
      });
      const apiUser = response.data;
      const user = mapApiResponseToUser(apiUser);

      // Cache the successful response
      userDataCache = {
        user,
        timestamp: now,
      };

      return user;
    } catch (error) {
      console.error("🔐 Failed to get user data from API:", error);

      // Don't clear token immediately on 500 errors - might be server issue
      if (
        error instanceof Error &&
        error.message.includes("Authentication failed")
      ) {
        console.warn("🔐 Authentication error, clearing token");
        localStorage.removeItem("authToken");
        agreementService.clearAuthToken();
        userDataCache = null; // Clear cache on auth failure
      }

      // Return minimal user data for UI continuity
      return {
        id: "unknown",
        username: "",
        bio: null,
        isVerified: false,
        walletAddress: null,
        role: 0,
        avatarId: null,
        handle: "@user",
        wallet: "Not connected",
        trustScore: 50,
        roles: { judge: false, community: false, user: true },
        stats: {
          deals: 0,
          agreements: 0,
          disputes: 0,
          revenue: { "7d": 0, "30d": 0, "90d": 0 },
        },
        joinedDate: new Date().toISOString().split("T")[0],
      };
    } finally {
      pendingUserFetch = null;
    }
  })();

  return pendingUserFetch;
}

// Clear user cache
function clearUserCache() {
  userDataCache = null;
  apiService.clearCache("/accounts/mine");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const initializedRef = useRef(false);

  const refreshUser = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        clearUserCache();
      }

      const userData = await getCurrentUser();

      // If we have an avatarId but no URL, try to get the avatar
      if (userData && userData.avatarId && !userData.avatarUrl) {
        try {
          const avatarUrl = getAvatarUrl(userData.id, userData.avatarId);
          setUser({ ...userData, avatarUrl });
        } catch (error) {
          console.error("🔐 Failed to load avatar, using default", error);
          setUser(userData);
        }
      } else {
        setUser(userData);
      }

      setIsAuthenticated(!!userData && userData.id !== "unknown");
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    // Prevent double initialization in React 18 strict mode
    if (initializedRef.current) {
      return;
    }
    initializedRef.current = true;

    const initializeAuth = async () => {
      const token = localStorage.getItem("authToken");

      // Clear obviously invalid tokens immediately
      if (token && !isValidToken(token)) {
        console.warn("Clearing invalid token on app startup");
        localStorage.removeItem("authToken");
        agreementService.clearAuthToken();
        setIsLoading(false);
        return;
      }

      if (token) {
        try {
          agreementService.setAuthToken(token);
          await refreshUser(true); // Force refresh on initial load
        } catch (error) {
          console.error("Failed to get user data:", error);
          // Clear invalid token on error
          localStorage.removeItem("authToken");
          agreementService.clearAuthToken();
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (otp: string) => {
    setIsLoading(true);
    try {
      const response = await loginTelegram(otp);
      const token = response.token?.trim();

      if (!token) {
        throw new Error("No token received from server");
      }

      // Store the token
      localStorage.setItem("authToken", token);
      agreementService.setAuthToken(token);

      // Clear cache and force refresh
      clearUserCache();
      await refreshUser(true);
    } catch (error) {
      console.error("🔐 Login failed:", error);
      localStorage.removeItem("authToken");
      agreementService.clearAuthToken();
      clearUserCache();
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    agreementService.clearAuthToken();
    clearUserCache();
    setUser(null);
    setIsAuthenticated(false);
  };

  // In AuthContext.tsx - Verify the generateLinkingNonce function
  const generateLinkingNonce = async (
    walletAddress: string,
  ): Promise<string> => {
    try {
      const response =
        await walletLinkingService.generateLinkingNonce(walletAddress);

      // The service returns WalletNonceResponse, but we need to extract the nonce string
      console.log("🔐 [AuthContext] Nonce service response:", response);

      if (!response.nonce) {
        throw new Error("No nonce in response");
      }

      return response.nonce; // This should be a string
    } catch (error) {
      console.error("Failed to generate linking nonce:", error);
      throw error;
    }
  };

  const linkWallet = async (
    walletAddress: string,
    signature: string,
  ): Promise<void> => {
    try {
      await walletLinkingService.verifyAndLinkWallet({
        walletAddress,
        signature,
      });
      // Refresh user data to get updated wallet address
      await refreshUser(true);
    } catch (error) {
      console.error("Failed to link wallet:", error);
      throw error;
    }
  };

  const linkTelegramAccount = async (otp: string): Promise<void> => {
    try {
      await walletLinkingService.linkTelegram(otp);
      // Refresh user data to get updated telegram info
      await refreshUser(true);
    } catch (error) {
      console.error("Failed to link Telegram:", error);
      throw error;
    }
  };

  const generateLoginNonce = async (walletAddress: string): Promise<string> => {
    try {
      const response =
        await walletLinkingService.generateLoginNonce(walletAddress);
      console.log("🔐 [AuthContext] Login nonce response:", response);

      if (!response.nonce) {
        throw new Error("No login nonce in response");
      }

      return response.nonce;
    } catch (error) {
      console.error("Failed to generate login nonce:", error);
      throw error;
    }
  };

  const loginWithWallet = async (
    walletAddress: string,
    signature: string,
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await walletLinkingService.verifyWalletLogin({
        walletAddress,
        signature,
      });

      const token = response.token?.trim();

      if (!token) {
        throw new Error("No token received from server");
      }

      // Store the token
      localStorage.setItem("authToken", token);
      agreementService.setAuthToken(token);

      // Clear cache and force refresh
      clearUserCache();
      await refreshUser(true);
    } catch (error) {
      console.error("🔐 Wallet login failed:", error);
      localStorage.removeItem("authToken");
      agreementService.clearAuthToken();
      clearUserCache();
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login,
        logout,
        refreshUser: () => refreshUser(true),
        // NEW methods
        linkWallet,
        linkTelegram: linkTelegramAccount,
        generateLinkingNonce,
        // NEW: Wallet login methods
        loginWithWallet,
        generateLoginNonce,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
