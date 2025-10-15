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

import { OtpTelegramDTO } from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

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
}
