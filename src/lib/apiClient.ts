// lib/apiClient.ts
import axios from "axios";

const API_BASE = "https://dev-api.dexcourt.com";

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// lib/apiClient.ts - Fix the interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    console.log(
      "🔐 [Interceptor] Adding token to request:",
      token ? `Raw token (no Bearer)` : "No token",
    );

    if (token) {
      // Remove the "Bearer" prefix - server expects raw token!
      config.headers.Authorization = token; // Just the token, no "Bearer"
      console.log(
        "🔐 [Interceptor] Authorization header set:",
        config.headers.Authorization.substring(0, 20) + "...",
      );
    }
    return config;
  },
  (error) => {
    console.error("🔐 [Interceptor] Request error:", error);
    return Promise.reject(error);
  },
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log(
      "🔐 [Interceptor] Response success:",
      response.status,
      response.config.url,
    );
    return response;
  },
  (error) => {
    console.error("🔐 [Interceptor] Response error:", {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      headers: error.config?.headers,
    });

    if (error.response?.status === 401) {
      console.warn("🔐 [Interceptor] Authentication failed, clearing token");
      localStorage.removeItem("authToken");
    }

    if (error.response?.status === 500) {
      console.error("🔐 [Interceptor] Server error - check token format");
    }

    return Promise.reject(error);
  },
);

// 🧩 Telegram Login - Enhanced with better logging
export async function loginTelegram(otp: string) {
  console.log("🔐 [loginTelegram] Sending OTP to server");
  try {
    const res = await api.post(`/login/telegram`, { otp });
    console.log("🔐 [loginTelegram] Server response:", res.data);
    return res.data;
  } catch (error) {
    console.error("🔐 [loginTelegram] Failed:", error);
    throw error;
  }
}

// 🧩 Telegram OTP
export async function getTelegramOtp(telegramId: string) {
  const res = await api.get(`/otp/telegram/${telegramId}`);
  return res.data;
}

// 🧩 Telegram Register
export async function registerTelegram(telegramId: string, username: string) {
  const res = await api.post(`/register/telegram`, {
    telegramId,
    username,
  });
  return res.data;
}

// 🧩 Telegram Login

// 🧩 Wallet Login - Nonce
export async function requestWalletNonce(walletAddress: string) {
  const res = await api.post(`/login/wallet/nonce`, { walletAddress });
  return res.data;
}

// 🧩 Wallet Login - Verify
export async function verifyWalletSignature(
  walletAddress: string,
  signature: string,
) {
  const res = await api.post(`/login/wallet/verify`, {
    walletAddress,
    signature,
  });
  return res.data;
}
