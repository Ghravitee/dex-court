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
  LoginDTO,
  LoginTelegramRequest,
  LoginWalletNonceRequest,
  LoginWalletVerifyNonceRequest,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Login<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * @description Login
   *
   * @tags Login Telegram
   * @name TelegramCreate
   * @request POST:/login/telegram
   */
  telegramCreate = (data: LoginTelegramRequest, params: RequestParams = {}) =>
    this.request<LoginDTO, void>({
      path: `/login/telegram`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Login
   *
   * @tags Login Wallet
   * @name WalletNonceCreate
   * @request POST:/login/wallet/nonce
   */
  walletNonceCreate = (
    data: LoginWalletNonceRequest,
    params: RequestParams = {},
  ) =>
    this.request<LoginDTO, void>({
      path: `/login/wallet/nonce`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Login
   *
   * @tags Login Wallet
   * @name WalletVerifyCreate
   * @request POST:/login/wallet/verify
   */
  walletVerifyCreate = (
    data: LoginWalletVerifyNonceRequest,
    params: RequestParams = {},
  ) =>
    this.request<LoginDTO, void>({
      path: `/login/wallet/verify`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
}
