// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { loginTelegram } from "../lib/apiClient";

// Add user interface
interface User {
  id: string;
  handle: string;
  wallet: string;
  trustScore: number;
  roles: {
    judge: boolean;
    community: boolean;
    user: boolean;
  };
  stats: {
    deals: number;
    agreements: number;
    disputes: number;
    revenue: {
      "7d": number;
      "30d": number;
      "90d": number;
    };
  };
  joinedDate: string;
  verified: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (otp: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock function to get current user data - you'll want to replace this with actual API
async function getCurrentUser(): Promise<User | null> {
  const token = localStorage.getItem("authToken");
  if (!token) return null;

  // Simulate API call to get user data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: "1",
        handle: "@you",
        wallet: "0xABCD…1234",
        trustScore: 72,
        roles: {
          judge: true,
          community: true,
          user: true,
        },
        stats: {
          deals: 24,
          agreements: 19,
          disputes: 2,
          revenue: { "7d": 420, "30d": 1760, "90d": 5030 },
        },
        joinedDate: "2024-01-15",
        verified: true,
      });
    }, 300);
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("authToken");
      if (token) {
        try {
          const userData = await getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Failed to get user data:", error);
          localStorage.removeItem("authToken");
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (otp: string) => {
    setIsLoading(true);
    try {
      const { token } = await loginTelegram(otp);
      localStorage.setItem("authToken", token);

      // Get user data after successful login
      const userData = await getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, user, login, logout }}
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
