/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "../lib/apiClient";

export interface WalletNonceResponse {
  nonce: string;
  expiresAt: string;
}

export interface WalletVerifyRequest {
  walletAddress: string;
  signature: string;
}

class WalletLinkingService {
  /* ------------------------------------------------------------------ */
  /* ---------------------- WALLET LINKING ----------------------------- */
  /* ------------------------------------------------------------------ */

  /**
   * Generate nonce for linking wallet to an existing account
   */
  async generateLinkingNonce(
    walletAddress: string,
  ): Promise<WalletNonceResponse> {
    try {
      const response = await api.post("/link/wallet/nonce", {
        walletAddress,
      });
      return response.data;
    } catch (error: any) {
      console.error("🔐 Wallet linking nonce error:", error);

      throw new Error(
        error.response?.data?.message ||
          "Failed to generate wallet linking nonce",
      );
    }
  }

  /**
   * Verify signed nonce and link wallet
   */
  async verifyAndLinkWallet(verifyData: WalletVerifyRequest): Promise<void> {
    try {
      await api.post("/link/wallet/verify", verifyData);
    } catch (error: any) {
      console.error("🔐 Wallet linking verification error:", {
        response: error.response?.data,
        message: error.message,
      });

      throw new Error(error.response?.data?.message || "Failed to link wallet");
    }
  }

  /* ------------------------------------------------------------------ */
  /* ------------------------- WALLET LOGIN ---------------------------- */
  /* ------------------------------------------------------------------ */

  /**
   * Generate login nonce (NO AUTH HEADER)
   */
  async generateLoginNonce(
    walletAddress: string,
  ): Promise<WalletNonceResponse> {
    try {
      const response = await api.post(
        "/login/wallet/nonce",
        { walletAddress },
        { timeout: 20000 }, // nonce-safe retry window
      );
      return response.data;
    } catch (error: any) {
      console.error("🔐 Wallet login nonce error:", error);

      throw new Error(
        error.response?.data?.message || "Failed to generate login nonce",
      );
    }
  }

  /**
   * Verify wallet login signature
   */
  async verifyWalletLogin(
    verifyData: WalletVerifyRequest,
  ): Promise<{ token: string }> {
    try {
      const response = await api.post("/login/wallet/verify", verifyData);
      return response.data;
    } catch (error: any) {
      console.error("🔐 Wallet login verification error:", {
        response: error.response?.data,
        message: error.message,
      });

      throw new Error(
        error.response?.data?.message || "Failed to verify wallet login",
      );
    }
  }

  /* ------------------------------------------------------------------ */
  /* ----------------------- TELEGRAM LINKING -------------------------- */
  /* ------------------------------------------------------------------ */

  async linkTelegram(otp: string): Promise<void> {
    try {
      await api.post("/link/telegram", { otp });
    } catch (error: any) {
      console.error("🔐 Telegram linking error:", error);

      throw new Error(
        error.response?.data?.message || "Failed to link Telegram account",
      );
    }
  }
}

export const walletLinkingService = new WalletLinkingService();
