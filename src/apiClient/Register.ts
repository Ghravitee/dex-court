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

import { RegisterTelegramRequest } from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Register<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * @description Register
   *
   * @tags Register Telegram
   * @name TelegramCreate
   * @request POST:/register/telegram
   */
  telegramCreate = (
    data: RegisterTelegramRequest,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/register/telegram`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      ...params,
    });
}
