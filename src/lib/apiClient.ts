import axios from "axios";

const API_BASE = "https://dev-api.dexcourt.com";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// 🧩 Telegram OTP
export async function getTelegramOtp(telegramId: string) {
  const res = await api.get(`/otp/telegram/${telegramId}`);
  return res.data; // { otp: "123456" }
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
export async function loginTelegram(otp: string) {
  const res = await api.post(`/login/telegram`, { otp });
  return res.data; // { token: "..." }
}

// 🧩 Wallet Login - Nonce
export async function requestWalletNonce(walletAddress: string) {
  const res = await api.post(`/login/wallet/nonce`, { walletAddress });
  return res.data; // expected to return { nonce: "..." } or token placeholder
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
  return res.data; // { token: "..." }
}
