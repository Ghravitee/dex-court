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

import { AccountsRoleRequest } from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Admin<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * @description This endpoint allows admins to update accounts to be judges.
   *
   * @tags Admin
   * @name AccountsRoleJudgePartialUpdate
   * @request PATCH:/admin/accounts-role/judge
   * @secure
   */
  accountsRoleJudgePartialUpdate = (
    data: AccountsRoleRequest,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/admin/accounts-role/judge`,
      method: "PATCH",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
  /**
   * @description This endpoint allows admins to update accounts to be community members.
   *
   * @tags Admin
   * @name AccountsRoleCommunityPartialUpdate
   * @request PATCH:/admin/accounts-role/community
   * @secure
   */
  accountsRoleCommunityPartialUpdate = (
    data: AccountsRoleRequest,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/admin/accounts-role/community`,
      method: "PATCH",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
}
