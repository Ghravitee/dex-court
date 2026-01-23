/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

import {
  LoginTelegramRequest,
  LoginWalletNonceRequest,
  LoginWalletVerifyNonceRequest,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Link<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * @description Link Telegram account to the authenticated user. **Deterministic and safe linking flow** 1. Validates the provided OTP (issued by the Telegram bot). - The OTP itself ensures the Telegram user exists and was verified off-chain. 2. If the Telegram ID already belongs to this authenticated account → idempotent (returns 200 OK). 3. Otherwise, merges the Telegram-only account into the current wallet-only account. - All ownership and references are migrated. 4. Merge is strictly validated: - Only wallet-only <-> telegram-only accounts are allowed. - Any shared agreement/dispute/witness relation triggers a **Forbidden** error. 5. The OTP is always marked as used (cannot be reused), even if the merge fails. There is **no fallback “create” path** — the Telegram account must exist, since OTP issuance already creates the account entry. ---
   *
   * @tags Link
   * @name TelegramCreate
   * @request POST:/link/telegram
   * @secure
   */
  telegramCreate = (data: LoginTelegramRequest, params: RequestParams = {}) =>
    this.request<void, void>({
      path: `/link/telegram`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
  /**
   * @description Issue a wallet nonce for proof-of-ownership (linking scope). **Deterministic and safe flow** 1. Validates the provided wallet address format. 2. If a valid, unused nonce already exists → reuses it (idempotent). 3. Otherwise, generates a new one-time nonce, valid for 5 minutes. 4. This nonce must be signed client-side and verified at `/link/wallet/verify`. There is **no account creation** here — the nonce is tied to an existing wallet identity. ---
   *
   * @tags Link
   * @name WalletNonceCreate
   * @request POST:/link/wallet/nonce
   * @secure
   */
  walletNonceCreate = (
    data: LoginWalletNonceRequest,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/link/wallet/nonce`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
  /**
   * @description Verify a signed wallet nonce and link it to the authenticated account. **Deterministic and secure verification flow** 1. Validates the provided `walletAddress` and its corresponding signed `nonce`. 2. Confirms the signature using EIP-191 `personal_sign` standard. 3. Marks the nonce as used (cannot be replayed). 4. If another account already owns the wallet → performs a safe 1:1 merge (wallet-only ↔ telegram-only). 5. If the authenticated account already owns this wallet → idempotent (returns 200 OK). 6. Otherwise, links the verified wallet address to the authenticated account. Merges are strictly validated: - Only wallet-only <-> telegram-only merges are allowed. - Any shared agreement/dispute/witness relation triggers a **Forbidden** error. ---
   *
   * @tags Link
   * @name WalletVerifyCreate
   * @request POST:/link/wallet/verify
   * @secure
   */
  walletVerifyCreate = (
    data: LoginWalletVerifyNonceRequest,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/link/wallet/verify`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
}
