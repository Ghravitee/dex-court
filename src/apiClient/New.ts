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
  AccountListDTO,
  AccountSummaryDTO,
  AccountUpdateRequest,
  AgreementCancelRespondRequest,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class New<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * @description Requires authentication Returns full profile data for the account list, including username, bio, Telegram info, wallet address, and verification status.
   *
   * @tags Accounts
   * @name AccountsList
   * @request GET:[NEW]/accounts
   * @secure
   */
  accountsList = (params: RequestParams = {}) =>
    this.request<AccountListDTO, void>({
      path: `[NEW]/accounts`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Update authenticated account (username and bio) Allows the authenticated user to update their username and/or bio. Both fields are optional, but at least one must be provided. Validation rules: - Username: 3–50 characters, only letters/numbers/underscores - Bio: up to 400 characters
   *
   * @tags Accounts
   * @name AccountsPartialUpdate
   * @request PATCH:[NEW]/accounts
   * @secure
   */
  accountsPartialUpdate = (
    data: AccountUpdateRequest,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `[NEW]/accounts`,
      method: "PATCH",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
  /**
   * @description Retrieve authenticated account information Returns full profile data for the logged-in account, including username, bio, Telegram info, wallet address, and verification status.
   *
   * @tags Accounts
   * @name AccountsMineList
   * @request GET:[NEW]/accounts/mine
   * @secure
   */
  accountsMineList = (params: RequestParams = {}) =>
    this.request<AccountSummaryDTO, void>({
      path: `[NEW]/accounts/mine`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Upload account avatar (only JPEG/PNG allowed) Allows the authenticated user to upload a new avatar image. Only JPEG and PNG files are accepted, with a maximum size of 2MB. The uploaded file is stored and linked to the user's profile.
   *
   * @tags Accounts
   * @name AccountsAvatarPartialUpdate
   * @request PATCH:[NEW]/accounts/avatar
   * @secure
   */
  accountsAvatarPartialUpdate = (
    data: {
      /**
       * The avatar image (JPEG/PNG)
       * @format binary
       */
      avatar: File;
    },
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `[NEW]/accounts/avatar`,
      method: "PATCH",
      body: data,
      secure: true,
      type: ContentType.FormData,
      ...params,
    });
  /**
   * @description Download an account file (e.g. avatar) This endpoint allows downloading a file associated with an account (e.g., its avatar). It validates that both account and file exist and streams the file back with proper headers.
   *
   * @tags Accounts
   * @name AccountsFileDetail
   * @request GET:[NEW]/accounts/{accountId}/file/{fileId}
   * @secure
   */
  accountsFileDetail = (
    accountId: number,
    fileId: number,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `[NEW]/accounts/${accountId}/file/${fileId}`,
      method: "GET",
      secure: true,
      ...params,
    });
  /**
   * @description Get account profile by ID Returns information about an account, including username, bio, Telegram info, wallet address, verification status, and avatar ID.
   *
   * @tags Accounts
   * @name UpdatedAccountsIdDetail
   * @request GET:[NEW/UPDATED]/accounts/id/{accountId}
   * @secure
   */
  updatedAccountsIdDetail = (accountId: number, params: RequestParams = {}) =>
    this.request<AccountSummaryDTO, void>({
      path: `[NEW/UPDATED]/accounts/id/${accountId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Get account profile by username / telegram username / wallet address in case of not having neither telegram linked or change his username. Returns information about an account, including username, bio, Telegram info, wallet address, verification status, and avatar ID.
   *
   * @tags Accounts
   * @name AccountsUsernameDetail
   * @request GET:[NEW]/accounts/username/{username}
   * @secure
   */
  accountsUsernameDetail = (username: string, params: RequestParams = {}) =>
    this.request<AccountSummaryDTO, void>({
      path: `[NEW]/accounts/username/${username}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Mark Agreement as Delivered This endpoint allows the **FirstParty** to mark an agreement as *delivered* once all required terms have been completed. When the delivery is marked: - The agreement status changes to `PendingApproval`, awaiting confirmation from the CounterParty. - A Telegram notification is sent to the CounterParty informing that the delivery has been made. Rules: - Only the **FirstParty** can perform this action. - The agreement must currently be `Active`. - Once marked as delivered, the agreement transitions to `PendingApproval`. Returns: - **200 (OK)** — When delivery is successfully marked. - **400 (Bad Request)** — If validation fails or the action is not allowed. - **500 (InternalServerError)** — For unexpected database or internal errors.
   *
   * @tags Agreement
   * @name AgreementDeliverySendPartialUpdate
   * @request PATCH:[NEW]/agreement/{agreementId}/delivery/send
   * @secure
   */
  agreementDeliverySendPartialUpdate = (
    agreementId: number,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `[NEW]/agreement/${agreementId}/delivery/send`,
      method: "PATCH",
      secure: true,
      ...params,
    });
  /**
   * @description Confirm Agreement Delivery This endpoint allows the **CounterParty** to confirm that the delivery was received successfully. When confirmed: - The agreement status changes to `Completed`. - Both parties are notified via Telegram. Rules: - Only the **CounterParty** can perform this action. - The agreement must currently be in `PendingApproval`.
   *
   * @tags Agreement
   * @name AgreementDeliveryConfirmPartialUpdate
   * @request PATCH:[NEW]/agreement/{agreementId}/delivery/confirm
   * @secure
   */
  agreementDeliveryConfirmPartialUpdate = (
    agreementId: number,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `[NEW]/agreement/${agreementId}/delivery/confirm`,
      method: "PATCH",
      secure: true,
      ...params,
    });
  /**
   * @description Reject Agreement Delivery This endpoint allows the **CounterParty** to reject the delivery. When rejected: - The agreement status reverts to `Active`, allowing further discussion or dispute. - Both parties are notified via Telegram. Rules: - Only the **CounterParty** can perform this action. - The agreement must currently be in `PendingApproval`.
   *
   * @tags Agreement
   * @name AgreementDeliveryRejectPartialUpdate
   * @request PATCH:[NEW]/agreement/{agreementId}/delivery/reject
   * @secure
   */
  agreementDeliveryRejectPartialUpdate = (
    agreementId: number,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `[NEW]/agreement/${agreementId}/delivery/reject`,
      method: "PATCH",
      secure: true,
      ...params,
    });
  /**
   * @description Request Agreement Cancelation Initiates a cancelation request for an **Active** agreement. Only one of the parties can start it. Once started: - The agreement keeps `Status = Active`. - Flags are set (`CancelPending = true`, `CancelRequestedById`, `CancelRequestedAt`). - A Telegram notification is sent to the **other party** asking to confirm or reject. Rules: - Only a participant (FirstParty or CounterParty) can start it. - Agreement must be `Active`. - There cannot be another cancelation pending.
   *
   * @tags Agreement
   * @name AgreementCancelRequestPartialUpdate
   * @request PATCH:[NEW]/agreement/{agreementId}/cancel/request
   * @secure
   */
  agreementCancelRequestPartialUpdate = (
    agreementId: number,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `[NEW]/agreement/${agreementId}/cancel/request`,
      method: "PATCH",
      secure: true,
      ...params,
    });
  /**
   * @description Respond to Agreement Cancelation Allows the **non-requesting** party to confirm or reject a pending cancelation. - If **confirmed** → Status becomes `Cancelled`, flags are cleared, and both parties are notified. - If **rejected** → Status remains `Active`, flags are cleared, and both parties are notified.
   *
   * @tags Agreement
   * @name AgreementCancelResponsePartialUpdate
   * @request PATCH:[NEW]/agreement/{agreementId}/cancel/response
   * @secure
   */
  agreementCancelResponsePartialUpdate = (
    agreementId: number,
    data: AgreementCancelRespondRequest,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `[NEW]/agreement/${agreementId}/cancel/response`,
      method: "PATCH",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
}
