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

import { OtpTelegramDTO, OtpTelegramPatchRequest } from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Otp<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * @description Get one time password for login
   *
   * @tags OTP Telegram
   * @name TelegramTelegramIdList
   * @request GET:/otp/telegram/:telegramId
   */
  telegramTelegramIdList = (telegramId: string, params: RequestParams = {}) =>
    this.request<OtpTelegramDTO, void>({
      path: `/otp/telegram/${telegramId}`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * @description Update Telegram profile
   *
   * @tags OTP Telegram
   * @name TelegramTelegramIdPartialUpdate
   * @request PATCH:/otp/telegram/:telegramId
   */
  telegramTelegramIdPartialUpdate = (
    telegramId: string,
    data: OtpTelegramPatchRequest,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/otp/telegram/${telegramId}`,
      method: "PATCH",
      body: data,
      type: ContentType.Json,
      ...params,
    });
}
