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
  AgreementListQueryResquest,
  DisputeDetailsDTO,
  DisputeListDTO,
  DisputesByAgreementRequest,
  DisputesDefendantClaimRequest,
  DisputesEditDefendantClaimRequest,
  DisputesRequest,
  DisputeVoteInProgressResultListDTO,
  DisputeVoteRequest,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Dispute<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * @description Create Dispute This endpoint is used to create a new dispute manually between two parties (plaintiff and defendant). The creator provides the claim text, title, description, dispute type (ProBono or Paid), and optionally witnesses. The dispute can include up to 10 attached files, uploaded using multipart/form-data. Validation rules: - All required fields must be provided: `claim`, `title`, `requestKind`, `description`, `defendant`, and at least one file. - `requestKind` must be a valid value from `DisputeTypeEnum`. - If the type is `Paid`, the creator must have a valid wallet address. - Witnesses (if provided) must exist and not be deleted. - The defendant account must exist and not be deleted. Upon success, the dispute is created and notifications are sent via Telegram to the defendant and witnesses (if any).
   *
   * @tags Dispute
   * @name DisputeCreate
   * @request POST:/dispute
   * @secure
   */
  disputeCreate = (data: DisputesRequest, params: RequestParams = {}) =>
    this.request<void, void>({
      path: `/dispute`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
  /**
   * @description This endpoint provides a list of disputes with pagination, filtering, and search - Use VotePendingAt, VoteStartedAt, and VoteEndedAt to track voting phases
   *
   * @tags Dispute
   * @name DisputeList
   * @request GET:/dispute
   */
  disputeList = (
    query?: {
      /** Number of results per page (default: 10) */
      top?: number;
      /** Number of records to skip (default: 0) */
      skip?: number;
      /** Filter by DisputeStatusEnum (Pending = 1, VoteInProgress = 2, Settled = 3, Dismissed = 4) */
      status?: number;
      /** Sort by creation date > enum > [asc, desc] (default: desc) */
      sort?: string;
      /** Search text (matches title, claim, or usernames) */
      search?: string;
      /** Time filter: all|last7d|last30d (default: all) */
      range?: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<DisputeListDTO, void>({
      path: `/dispute`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * @description Create Dispute by Agreement This endpoint allows creating a dispute directly linked to an existing agreement. It is typically used when a conflict arises from a specific agreement, such as a breach of terms. The creator must provide the claim, title, description, dispute type, defendant, and optionally witnesses. The endpoint also supports file uploads (up to 10 files). Validation rules: - The `agreementId` path parameter must be valid and refer to an existing non-deleted agreement. - All required fields must be present: `claim`, `title`, `requestKind`, `description`, and at least one file. - `requestKind` must be a valid value from `DisputeTypeEnum`. - If the type is `Paid`, the creator must have a valid wallet address. - Defendant and witnesses must exist and not be deleted. Upon success: - The dispute is created and linked to the given agreement. - The agreement status automatically changes to `Disputed`. - Telegram notifications are sent to the defendant and witnesses (if any).
   *
   * @tags Dispute
   * @name DisputeCreate2
   * @request POST:/dispute/{agreementId}
   * @originalName disputeCreate
   * @duplicate
   * @secure
   */
  disputeCreate2 = (
    agreementId: number,
    data: DisputesByAgreementRequest,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/dispute/${agreementId}`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
  /**
   * @description Submit a claim/defense by the defendant in a pending dispute This endpoint allows the **defendant** of a dispute to submit their defense statement (`defendantClaim`), optionally attaching supporting evidence files and/or listing witnesses. This is used as the counterpart to the plaintiff’s initial claim, during the **Pending** stage of the dispute lifecycle. Once the defense is submitted, the information becomes part of the case record and will be visible to judges when the voting phase begins. Validation rules: - Only the **defendant** (account matching `AgainstId`) can submit a defense. - The dispute must currently have status `Pending`. - The dispute cannot have been deleted or already moved to voting. - The field `defendantClaim` is required. - Witnesses (if provided) must correspond to valid, active accounts. - Files (if attached) are uploaded via `multipart/form-data`. Upon success: - The defendant’s formal claim (`FormalClainDefendant`) is stored. - Any provided witnesses and evidence files are linked to the dispute.
   *
   * @tags Dispute
   * @name DefendantClaimCreate
   * @request POST:/dispute/{disputeId}/defendant-claim
   * @secure
   */
  defendantClaimCreate = (
    disputeId: number,
    data: DisputesDefendantClaimRequest,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/dispute/${disputeId}/defendant-claim`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.FormData,
      ...params,
    });
  /**
   * @description Edit the defendant's claim of a Pending dispute Allows the defendant (AgainstId) to partially update their claim: - Update `defendantClaim` text - Replace witnesses (if provided, previous defendant witnesses are deleted) - Upload up to 10 new files (added; deletion is a separate endpoint) Validation: - Only the defendant can edit - Dispute must be `Pending` - If witnesses are provided, they must exist and be active accounts - At least one field must be provided (claim, witnesses, or files)
   *
   * @tags Dispute
   * @name DefendantClaimPartialUpdate
   * @request PATCH:/dispute/{disputeId}/defendant-claim
   * @secure
   */
  defendantClaimPartialUpdate = (
    disputeId: number,
    data: DisputesEditDefendantClaimRequest,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/dispute/${disputeId}/defendant-claim`,
      method: "PATCH",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
  /**
   * @description Get full details of a dispute This endpoint provides a **complete overview of a specific dispute**, including: - Core dispute data (title, description, type, status, result) - Plaintiff and Defendant account information - Witnesses for both sides - All attached files (both dispute-level and message-level) - Messages and their associated file attachments - Use VotePendingAt, VoteStartedAt, and VoteEndedAt to track voting phases Returns 200 (OK) with a detailed JSON on success, or an error code if the dispute cannot be accessed.
   *
   * @tags Dispute
   * @name DisputeDetail
   * @request GET:/dispute/{disputeId}
   */
  disputeDetail = (disputeId: number, params: RequestParams = {}) =>
    this.request<DisputeDetailsDTO, void>({
      path: `/dispute/${disputeId}`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * @description Get full voting outcome for a single dispute Returns the same structure as /vote-settled but only for one dispute. Includes: - Weighted percentages - Raw votes per group (judges, community tiers) - Percentages per group - Judge comments - Use VotePendingAt, VoteStartedAt, and VoteEndedAt to track voting phases - Parties info
   *
   * @tags Dispute
   * @name VoteOutcomeList
   * @request GET:/dispute/{disputeId}/vote-outcome
   */
  voteOutcomeList = (disputeId: number, params: RequestParams = {}) =>
    this.request<AgreementListQueryResquest, void>({
      path: `/dispute/${disputeId}/vote-outcome`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * @description Edit an existing dispute This endpoint allows the creator of a dispute to edit its fields - as long as the dispute is still **Pending**. Editable fields include `title`, `description`, `claim`, `requestKind`, and witnesses. The `defendant` cannot be changed once the dispute is created. It also allows uploading up to 10 additional files (for example, evidence documents). Validation rules: - Only the creator of the dispute can edit it. - The dispute must currently have status `Pending`. - `requestKind` must be a valid enum value (`DisputeTypeEnum`). - If the dispute type is `Paid`, the creator must have a wallet. - At least one field must be provided for update. - If defendant has already answered, can't be changed. - If provided witnesses, the previous ones will be deleted, so make sure that if you provide new witnesses, provide everyone. On success, the dispute is updated and new files are stored.
   *
   * @tags Dispute
   * @name PlaintiffClaimPartialUpdate
   * @request PATCH:/dispute/{disputeId}/plaintiff-claim
   * @secure
   */
  plaintiffClaimPartialUpdate = (
    disputeId: number,
    data: DisputesRequest,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/dispute/${disputeId}/plaintiff-claim`,
      method: "PATCH",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
  /**
   * @description Manually settle a pending dispute (without voting) This endpoint allows the **creator (plaintiff)** of a dispute to manually settle it — for example, if both parties reached an agreement outside the platform — as long as the dispute is still in the **Pending** state. When settled manually: - The dispute `Status` is updated to `Settled` - The `Result` is set to `Cancelled` - No voting process takes place Validation rules: - Only the **creator** of the dispute can perform this action. - The dispute must currently have status `Pending`. - The dispute cannot have been deleted or already settled/voted. Upon success: - The dispute is finalized immediately. - Future voting or edits are disabled.
   *
   * @tags Dispute
   * @name SettledPartialUpdate
   * @request PATCH:/dispute/{disputeId}/settled
   * @secure
   */
  settledPartialUpdate = (disputeId: number, params: RequestParams = {}) =>
    this.request<void, void>({
      path: `/dispute/${disputeId}/settled`,
      method: "PATCH",
      secure: true,
      ...params,
    });
  /**
   * @description Download a specific file from a dispute This endpoint allows downloading any file that belongs to a given dispute or one of its messages. It validates that the dispute exists and that the user has access rights (must be a participant in the dispute). Returns: - 200 (OK) → File stream - 400 (Bad Request) → Invalid parameters - 404 (Not Found) → File or dispute not found - 500 (InternalServerError) → Unexpected error
   *
   * @tags Dispute
   * @name FileDetail
   * @request GET:/dispute/{disputeId}/file/{fileId}
   */
  fileDetail = (
    disputeId: number,
    fileId: number,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/dispute/${disputeId}/file/${fileId}`,
      method: "GET",
      ...params,
    });
  /**
   * @description Soft delete a file from the claim/message Allows to remove a specific file they uploaded in their claim/message The dispute must still be in `Pending` status.
   *
   * @tags Dispute
   * @name FileDelete
   * @request DELETE:/dispute/{disputeId}/file/{fileId}
   * @secure
   */
  fileDelete = (
    disputeId: number,
    fileId: number,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/dispute/${disputeId}/file/${fileId}`,
      method: "DELETE",
      secure: true,
      ...params,
    });
  /**
   * @description Get all disputes currently in VoteInProgress (no pagination) Returns all ongoing disputes where voting is still active. Typically used for the Voting Hub view in the app.
   *
   * @tags Dispute
   * @name VoteInProgressList
   * @request GET:/dispute/vote-in-progress
   */
  voteInProgressList = (params: RequestParams = {}) =>
    this.request<DisputeVoteInProgressResultListDTO, void>({
      path: `/dispute/vote-in-progress`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * @description This endpoint provides a list of disputes with pagination, filtering, and search Get all settled disputes (with weighted voting results) Returns full voting analytics and outcome for all disputes that have finished the voting phase (Status = Settled or Dismissed). Each dispute includes: - Weighted percentage summary (plaintiff/defendant/dismiss) - Raw vote counts per group (judges, tier1, tier2) - Applied weight distribution - Dispute participants (plaintiff & defendant)
   *
   * @tags Dispute
   * @name VoteSettledList
   * @request GET:/dispute/vote-settled
   */
  voteSettledList = (
    query?: {
      /** Number of results per page (default: 10) */
      top?: number;
      /** Number of records to skip (default: 0) */
      skip?: number;
      /** Sort by creation date > enum > [asc, desc] (default: desc) */
      sort?: string;
      /** Search text (matches title, claim, or usernames) */
      search?: string;
      /** Time filter: all|last7d|last30d (default: all) */
      range?: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/dispute/vote-settled`,
      method: "GET",
      query: query,
      ...params,
    });
  /**
   * @description Cast a vote in a dispute Judges and community members with tier holding tokens can cast their votes for Plaintiff, Defendant, or DismissCase. TODO: MISSING > RASGNUR > Add tier logic to the vote Witnesses, plaintiffs, and defendants cannot vote.
   *
   * @tags Dispute
   * @name VoteCreate
   * @request POST:/dispute/{disputeId}/vote
   * @secure
   */
  voteCreate = (
    disputeId: number,
    data: DisputeVoteRequest,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/dispute/${disputeId}/vote`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
}
