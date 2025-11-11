/* eslint-disable @typescript-eslint/no-explicit-any */
// services/walletLinkingService.ts
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
  private baseURL =
    import.meta.env.VITE_API_URL || "https://dev-api.dexcourt.com";

  /**
   * NEW: Generate nonce for wallet linking (different from login nonce)
   */
  async generateLinkingNonce(
    walletAddress: string,
  ): Promise<WalletNonceResponse> {
    try {
      const response = await api({
        method: "POST",
        url: `${this.baseURL}/link/wallet/nonce`,
        data: { walletAddress },
      });
      return response.data;
    } catch (error: any) {
      console.error("🔐 Wallet linking nonce error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to generate wallet nonce",
      );
    }
  }

  /**
   * NEW: Verify signed nonce and link wallet to account
   */
  // Update walletLinkingService.ts to log the actual error
  async verifyAndLinkWallet(verifyData: WalletVerifyRequest): Promise<void> {
    try {
      const response = await api({
        method: "POST",
        url: `${this.baseURL}/link/wallet/verify`,
        data: verifyData,
      });
      return response.data;
    } catch (error: any) {
      console.error("🔐 Wallet linking verification error:", error);

      // Log the actual response data for debugging
      if (error.response?.data) {
        console.error("🔐 Server response:", error.response.data);
      }

      throw new Error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to link wallet",
      );
    }
  }

  /**
   * NEW: Link Telegram account using OTP
   */
  async linkTelegram(otp: string): Promise<void> {
    try {
      await api({
        method: "POST",
        url: `${this.baseURL}/link/telegram`,
        data: { otp },
      });
    } catch (error: any) {
      console.error("🔐 Telegram linking error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to link Telegram account",
      );
    }
  }

  /**
   * OLD: Wallet login nonce (keep this separate from linking)
   */
  async generateLoginNonce(
    walletAddress: string,
  ): Promise<WalletNonceResponse> {
    try {
      const response = await api({
        method: "POST",
        url: `${this.baseURL}/login/wallet/nonce`,
        data: { walletAddress },
      });
      return response.data;
    } catch (error: any) {
      console.error("🔐 Wallet login nonce error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to generate login nonce",
      );
    }
  }

  /**
   * OLD: Wallet login verification (keep this separate from linking)
   */
  async verifyWalletLogin(
    verifyData: WalletVerifyRequest,
  ): Promise<{ token: string }> {
    try {
      const response = await api({
        method: "POST",
        url: `${this.baseURL}/login/wallet/verify`,
        data: verifyData,
      });
      return response.data;
    } catch (error: any) {
      console.error("🔐 Wallet login verification error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to verify wallet login",
      );
    }
  }
}

export const walletLinkingService = new WalletLinkingService();
