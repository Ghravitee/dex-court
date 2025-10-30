/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/apiClient.ts
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "https://dev-api.dexcourt.com";

// Create axios instance with optimized defaults
export const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000, // 10 second timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request deduplication cache
const pendingRequests = new Map<string, Promise<any>>();

// Request interceptor - optimized without excessive logging
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");

    // Only log in development for non-GET requests or important endpoints
    if (
      import.meta.env.DEV &&
      (config.method !== "get" || config.url?.includes("/mine"))
    ) {
      console.log(`🔐 [API] ${config.method?.toUpperCase()} ${config.url}`);
    }

    if (token) {
      config.headers.Authorization = token; // Raw token without "Bearer"
    }

    return config;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error("🔐 [API] Request error:", error);
    }
    return Promise.reject(error);
  },
);

// Response interceptor - optimized
api.interceptors.response.use(
  (response) => {
    // Only log in development for non-GET requests or important endpoints
    if (
      import.meta.env.DEV &&
      (response.config.method !== "get" ||
        response.config.url?.includes("/mine"))
    ) {
      console.log(`🔐 [API] ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error("🔐 [API] Response error:", {
        status: error.response?.status,
        url: error.config?.url,
        message: error.response?.data?.message || error.message,
      });
    }

    // Handle specific error cases
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      // Don't redirect here - let components handle it
    }

    return Promise.reject(error);
  },
);

// Enhanced API functions with caching and deduplication
export class ApiService {
  private cache = new Map();
  private readonly cacheDuration = 30000; // 30 seconds

  // Generic cached GET request with deduplication
  async cachedGet<T>(url: string, forceRefresh = false): Promise<T> {
    const now = Date.now();
    const cacheKey = `GET:${url}`;

    // Return cached data if available and not expired
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const { data, timestamp } = this.cache.get(cacheKey);
      if (now - timestamp < this.cacheDuration) {
        return data;
      }
    }

    // Check for pending requests to avoid duplicates
    if (pendingRequests.has(url)) {
      return pendingRequests.get(url);
    }

    // Make fresh request
    const request = api
      .get<T>(url)
      .then((response) => {
        this.cache.set(cacheKey, {
          data: response.data,
          timestamp: now,
        });
        return response.data;
      })
      .finally(() => {
        pendingRequests.delete(url);
      });

    pendingRequests.set(url, request);
    return request;
  }

  // Clear cache for specific URL or all cache
  clearCache(url?: string) {
    if (url) {
      const cacheKey = `GET:${url}`;
      this.cache.delete(cacheKey);
    } else {
      this.cache.clear();
    }
  }

  // Specialized methods for common endpoints
  async getAgreements(): Promise<any> {
    return this.cachedGet("/agreement", false);
  }

  async getMyAgreements(): Promise<any> {
    return this.cachedGet("/agreement/mine", false);
  }

  async getAgreementDetails(id: number): Promise<any> {
    return this.cachedGet(`/agreement/${id}`, false);
  }
}

export const apiService = new ApiService();

// Telegram Login
export async function loginTelegram(otp: string) {
  const response = await api.post(`/login/telegram`, { otp });
  return response.data;
}

// Telegram OTP
export async function getTelegramOtp(telegramId: string) {
  const response = await api.get(`/otp/telegram/${telegramId}`);
  return response.data;
}

// Telegram Register
export async function registerTelegram(telegramId: string, username: string) {
  const response = await api.post(`/register/telegram`, {
    telegramId,
    username,
  });
  return response.data;
}

// Wallet Login - Nonce
export async function requestWalletNonce(walletAddress: string) {
  const response = await api.post(`/login/wallet/nonce`, { walletAddress });
  return response.data;
}

// Wallet Login - Verify
export async function verifyWalletSignature(
  walletAddress: string,
  signature: string,
) {
  const response = await api.post(`/login/wallet/verify`, {
    walletAddress,
    signature,
  });
  return response.data;
}
