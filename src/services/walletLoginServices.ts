// src/services/walletLoginService.ts
import { api } from "../lib/apiClient";

const BASE_URL = import.meta.env.VITE_API_URL || "https://dev-api.dexcourt.com";

export interface WalletNonceResponse {
  nonce: string;
}

export interface WalletLoginVerifyRequest {
  walletAddress: string;
  signature: string;
}

export const walletLoginService = {
  async getNonce(walletAddress: string): Promise<string> {
    const response = await api.post<WalletNonceResponse>(
      `${BASE_URL}/login/wallet/nonce`,
      { walletAddress },
    );
    return response.data.nonce;
  },

  async verifySignature(
    payload: WalletLoginVerifyRequest,
  ): Promise<{ token: string }> {
    const response = await api.post(`${BASE_URL}/login/wallet/verify`, payload);
    return response.data;
  },
};
