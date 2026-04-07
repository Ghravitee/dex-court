/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/apiClient.ts
//
// Single source of truth for the configured axios instance.
// All auth header injection and error normalisation lives here.
// Do NOT add caching or deduplication here — TanStack Query handles that.

import axios from "axios";
import { devError, devLog } from "../utils/logger";

const API_BASE = import.meta.env.VITE_API_URL;

// ─── Axios instance ────────────────────────────────────────────────────────────

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

// ─── Request interceptor ───────────────────────────────────────────────────────
// Attaches the auth token to every outgoing request.

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      // API expects a raw token, not a "Bearer <token>" string
      config.headers.Authorization = token;
    }

    if (import.meta.env.DEV && config.method !== "get") {
      devLog(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    devError("[API] Request setup error:", error);
    return Promise.reject(error);
  },
);

// ─── Response interceptor ──────────────────────────────────────────────────────
// Handles global error cases (e.g. expired token) so individual callers
// don't have to repeat the same logic.

api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV && response.config.method !== "get") {
      devLog(`[API] ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const message = error.response?.data?.message ?? error.message;

    devError("[API] Response error:", { status, url, message });

    // Clear stale token on 401 — components decide whether to redirect
    if (status === 401) {
      localStorage.removeItem("authToken");
    }

    return Promise.reject(error);
  },
);

// ─── Auth API calls ────────────────────────────────────────────────────────────
// These are plain async functions, not hooks.
// They are intentionally NOT wrapped with TanStack Query because they are
// one-shot mutations triggered by user actions (login, register), not
// cacheable queries.

export async function loginTelegram(otp: string) {
  try {
    const response = await api.post("/login/telegram", { otp });

    if (!response.data.token) {
      throw new Error("No authentication token received from server");
    }

    return response.data;
  } catch (error: any) {
    devError("[API] Telegram login failed:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    const { status, data } = error.response ?? {};
    if (data?.message) throw new Error(data.message);
    if (status === 401) throw new Error("Invalid OTP or authentication failed");
    if (status === 404)
      throw new Error("Telegram authentication service unavailable");

    throw error;
  }
}

export async function getTelegramOtp(telegramId: string) {
  const response = await api.get(`/otp/telegram/${telegramId}`);
  return response.data;
}

export async function registerTelegram(telegramId: string, username: string) {
  const response = await api.post("/register/telegram", {
    telegramId,
    username,
  });
  return response.data;
}

export async function requestWalletNonce(walletAddress: string) {
  const response = await api.post("/login/wallet/nonce", { walletAddress });
  return response.data;
}

export async function verifyWalletSignature(
  walletAddress: string,
  signature: string,
) {
  const response = await api.post("/login/wallet/verify", {
    walletAddress,
    signature,
  });
  return response.data;
}
