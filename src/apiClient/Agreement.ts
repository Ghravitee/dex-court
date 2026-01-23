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
  AgreementCancelRespondRequest,
  AgreementCreationDTO,
  AgreementDetailsDTO,
  AgreementListDTO,
  AgreementListQueryResquest,
  AgreementMineListDTO,
  AgreementSignRequest,
  AgreementsEditRequest,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Agreement<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * @description Request Agreement Cancelation Initiates a cancelation request for an **Active** agreement. Only one of the parties can start it. Once started: - The agreement keeps `Status = Active`. - Flags are set (`CancelPending = true`, `CancelRequestedById`, `CancelRequestedAt`). - A Telegram notification is sent to the **other party** asking to confirm or reject. Rules: - Only a participant (FirstParty or CounterParty) can start it. - Agreement must be `Active`. - There cannot be another cancelation pending.
   *
   * @tags Agreement
   * @name CancelRequestPartialUpdate
   * @request PATCH:/agreement/{agreementId}/cancel/request
   * @secure
   */
  cancelRequestPartialUpdate = (
    agreementId: number,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/agreement/${agreementId}/cancel/request`,
      method: "PATCH",
      secure: true,
      ...params,
    });
  /**
   * @description Respond to Agreement Cancelation Allows the **non-requesting** party to confirm or reject a pending cancelation. - If **confirmed** → Status becomes `Cancelled`, flags are cleared, and both parties are notified. - If **rejected** → Status remains `Active`, flags are cleared, and both parties are notified.
   *
   * @tags Agreement
   * @name CancelResponsePartialUpdate
   * @request PATCH:/agreement/{agreementId}/cancel/response
   * @secure
   */
  cancelResponsePartialUpdate = (
    agreementId: number,
    data: AgreementCancelRespondRequest,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/agreement/${agreementId}/cancel/response`,
      method: "PATCH",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
  /**
   * @description Agreement This endpoint is used to create a new agreement between two parties. The creator provides the title, description, type, visibility, deadline, and the accounts of the first and counterparty (does not require to be users from the platform). If the agreement involves escrow, token and amount information can be included, and optionally a smart contract address if the token type is “custom”. The creator can also upload up to 10 files (such as attachments or documents) that will be linked to the agreement. The request requires authentication (JWT) and uses multipart form-data to handle file uploads. Upon success, it returns HTTP 201 (Created). If something is missing or invalid (for example, a wrong enum value, a past deadline, or a missing wallet for escrow), it returns 400 (Bad Request) with an appropriate error code from ErrorsEnum. If an unexpected issue occurs during database operations, it returns 500 (InternalServerError).
   *
   * @tags Agreement
   * @name AgreementCreate
   * @request POST:/agreement
   * @secure
   */
  agreementCreate = (
    data: AgreementListQueryResquest,
    params: RequestParams = {},
  ) =>
    this.request<AgreementCreationDTO, void>({
      path: `/agreement`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      format: "json",
      ...params,
    });
  /**
   * @description Get agreements list > Request (with all filters): GET /agreement?top=5&skip=0&status=1&sort=desc&search=banana This endpoint retrieves a paginated list of all public and auto-public agreements. It supports filters for status, sorting, pagination, and text search (which can match titles, usernames, Telegram usernames, or wallet addresses). Only non-deleted and publicly visible agreements are returned. The response contains the total number of agreements found and a list of simplified agreement summaries, each showing title, date created, status, amount, token, and both parties involved. Returns 200 (OK) on success or 500 (InternalServerError) if something fails during the query.
   *
   * @tags Agreement
   * @name AgreementList
   * @request GET:/agreement
   */
  agreementList = (
    query?: {
      /** Number of results per page (default: 10) */
      top?: number;
      /** Number of records to skip (default: 0) */
      skip?: number;
      /** Type of agreement > escrow or reputation > default it returns every agreement */
      type?: number;
      /** Filter by AgreementStatusEnum (PendingAcceptance = 1, Active = 2, Completed = 3, Disputed = 4, Cancelled = 5, Expired = 6, PartySubmittedDelivery = 7) */
      status?: number;
      /** Sort by creation date > enum > [asc, desc] (default: desc) */
      sort?: string;
      /** Search text (matches title or parties' usernames, telegram usernames, or wallet addresses) */
      search?: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<AgreementListDTO, void>({
      path: `/agreement`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * @description Soft delete an agreement This endpoint allows the creator to delete an agreement softly — meaning it’s marked as deleted instead of being permanently removed. All files linked to that agreement are also soft deleted. Deletion is only possible if the agreement is still pending and neither party has accepted or rejected it. Returns 200 (OK) when successful, 400 (Bad Request) if it’s invalid or forbidden, and 500 (InternalServerError) in case of failure
   *
   * @tags Agreement
   * @name AgreementDelete
   * @request DELETE:/agreement/{agreementId}
   * @secure
   */
  agreementDelete = (agreementId: number, params: RequestParams = {}) =>
    this.request<void, void>({
      path: `/agreement/${agreementId}`,
      method: "DELETE",
      secure: true,
      ...params,
    });
  /**
   * @description Get full details of an agreement This endpoint provides complete information about a specific agreement. It includes all key fields — title, description, type, visibility, status, amount, token symbol, deadline, creation date, and all participant details, - A list of attached files - A timeline of agreement events (Created = 1, Signed, Rejected, Delivered, DeliveryConfirmed, DeliveryRejected, CancelRequested, CancelConfirmed, CancelRejected, Expired, AutoCancelled) If the agreement is private, the requester must be one of the involved users; otherwise, access is forbidden. Authentication is optional: public agreements can be accessed by anyone, but private ones require a valid token. On success, returns 200 (OK) with a detailed JSON. If the user isn’t authorized or the agreement doesn’t exist, it returns 400 (Bad Request) with an appropriate error code, or 500 (InternalServerError) for unexpected errors.
   *
   * @tags Agreement
   * @name AgreementDetail
   * @request GET:/agreement/{agreementId}
   * @secure
   */
  agreementDetail = (agreementId: number, params: RequestParams = {}) =>
    this.request<AgreementDetailsDTO, void>({
      path: `/agreement/${agreementId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Edit an existing agreement This endpoint allows the creator to modify certain fields of an agreement — but only while it’s still Pending Acceptance. Editable fields include title, description, type, visibility, deadline, amount, token symbol, and contract address. The validator checks that enums are valid, deadlines are future dates, and token–amount combinations are consistent (e.g., you can’t define an amount without a token). If the token changes from “custom” to a standard token like “ETH” or “USDC”, the contract address is automatically cleared. If any party has already accepted or rejected, or if the status is no longer pending, the edit is blocked. On success, it returns 200 (OK). Validation issues return 400 (Bad Request) with the corresponding error (such as MissingData, InvalidEnum, or InvalidStatus). Any internal problem results in 500 (InternalServerError).
   *
   * @tags Agreement
   * @name AgreementPartialUpdate
   * @request PATCH:/agreement/{agreementId}
   * @secure
   */
  agreementPartialUpdate = (
    agreementId: number,
    data: AgreementsEditRequest,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/agreement/${agreementId}`,
      method: "PATCH",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
  /**
   * @description Mark Agreement as Delivered This endpoint allows some party to mark an agreement as *delivered* once all required terms have been completed. When the delivery is marked: - The agreement status changes to `PartySubmittedDelivery`, awaiting confirmation from the other party. - A Telegram notification is sent to the other party informing that the delivery has been made. Rules: - Any party can perform this action. - The agreement must currently be `Active`. - Once marked as delivered, the agreement transitions to `PartySubmittedDelivery`. Returns: - **200 (OK)** — When delivery is successfully marked. - **400 (Bad Request)** — If validation fails or the action is not allowed. - **500 (InternalServerError)** — For unexpected database or internal errors.
   *
   * @tags Agreement
   * @name DeliverySendPartialUpdate
   * @request PATCH:/agreement/{agreementId}/delivery/send
   * @secure
   */
  deliverySendPartialUpdate = (
    agreementId: number,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/agreement/${agreementId}/delivery/send`,
      method: "PATCH",
      secure: true,
      ...params,
    });
  /**
   * @description Confirm Agreement Delivery This endpoint allows the other party to confirm that the delivery was received successfully. When confirmed: - The agreement status changes to `Completed`. - Both parties are notified via Telegram. Rules: - Only the other party can perform this action. - The agreement must currently be in `PartySubmittedDelivery`.
   *
   * @tags Agreement
   * @name DeliveryConfirmPartialUpdate
   * @request PATCH:/agreement/{agreementId}/delivery/confirm
   * @secure
   */
  deliveryConfirmPartialUpdate = (
    agreementId: number,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/agreement/${agreementId}/delivery/confirm`,
      method: "PATCH",
      secure: true,
      ...params,
    });
  /**
   * @description Reject Agreement Delivery This endpoint allows to the other party to reject the delivery. When rejected: - The agreement status goes to `disputed`, opening a dispute. - Both parties are notified via Telegram. Rules: - Only the other party can perform this action. - The agreement must currently be in `PartySubmittedDelivery`.
   *
   * @tags Agreement
   * @name DeliveryRejectPartialUpdate
   * @request PATCH:/agreement/{agreementId}/delivery/reject
   * @secure
   */
  deliveryRejectPartialUpdate = (
    agreementId: number,
    data: AgreementListQueryResquest,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/agreement/${agreementId}/delivery/reject`,
      method: "PATCH",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
  /**
   * @description Get authenticated user’s agreements (creator, first or counter party) This route lists every agreement related to the authenticated user — whether they’re the creator, first party, or counterparty. It returns a compact view with each agreement’s ID, status, creation date, and both parties. The list is sorted by creation date (newest first). Authentication is required. Returns 200 (OK) on success or 500 (InternalServerError) if something unexpected happens.
   *
   * @tags Agreement
   * @name MineList
   * @request GET:/agreement/mine
   * @secure
   */
  mineList = (params: RequestParams = {}) =>
    this.request<AgreementMineListDTO, void>({
      path: `/agreement/mine`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Download a specific file from an agreement This route allows downloading a specific file attached to an agreement. It ensures the file belongs to the given agreement and that the user has access rights if the agreement is private. If everything is valid, it streams the file directly with proper headers and MIME type. Returns 200 (OK) for successful downloads, 400 (Bad Request) if the parameters are invalid, 404 (NotFound) if the file doesn’t exist, or 500 (InternalServerError) in case of unexpected failures.
   *
   * @tags Agreement
   * @name FileDetail
   * @request GET:/agreement/{agreementId}/file/{fileId}
   * @secure
   */
  fileDetail = (
    agreementId: number,
    fileId: number,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/agreement/${agreementId}/file/${fileId}`,
      method: "GET",
      secure: true,
      ...params,
    });
  /**
   * @description Soft delete a file from an agreement Removes a file from an agreement by marking it as deleted. To prevent breaking the agreement, the system ensures there’s always at least one remaining file. Only the creator can perform this action, and the agreement must still be in a pending state. If successful, returns 200 (OK). If it’s the last file, if the agreement can’t be modified, or if the file doesn’t exist, returns 400 (Bad Request). Unexpected errors return 500 (InternalServerError).
   *
   * @tags Agreement
   * @name FileDelete
   * @request DELETE:/agreement/{agreementId}/file/{fileId}
   * @secure
   */
  fileDelete = (
    agreementId: number,
    fileId: number,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/agreement/${agreementId}/file/${fileId}`,
      method: "DELETE",
      secure: true,
      ...params,
    });
  /**
   * @description Upload additional files to an agreement This route lets the creator upload additional files to an existing agreement, as long as it’s still editable. It accepts up to 10 files in multipart form-data and automatically links them to the specified agreement. If successful, it returns 201 (Created). If no files are provided or the agreement is locked, it returns 400 (Bad Request). Server errors return 500 (InternalServerError).
   *
   * @tags Agreement
   * @name FilesCreate
   * @request POST:/agreement/{agreementId}/files
   * @secure
   */
  filesCreate = (agreementId: number, data?: any, params: RequestParams = {}) =>
    this.request<void, void>({
      path: `/agreement/${agreementId}/files`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.FormData,
      ...params,
    });
  /**
   * @description Agreement This route lets each participant accept or reject an existing agreement. It expects a simple payload { "accepted": true | false }. The system verifies whether the user is one of the involved parties, whether the agreement is still pending, and whether it hasn’t expired. If both parties accept, the agreement is Signed. It becomes Signed immediately for non-escrow agreements, or after funds are deposited for escrow agreements. If any party rejects, it’s automatically Cancelled. A successful acceptance returns 202 (Accepted), while a successful rejection returns 200 (OK). Validation or permission problems return 400 (Bad Request), and any unexpected server issue results in 500 (InternalServerError).
   *
   * @tags Agreement
   * @name SignPartialUpdate
   * @request PATCH:/agreement/sign/{agreementId}
   * @secure
   */
  signPartialUpdate = (
    agreementId: string,
    data: AgreementSignRequest,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/agreement/sign/${agreementId}`,
      method: "PATCH",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
}
