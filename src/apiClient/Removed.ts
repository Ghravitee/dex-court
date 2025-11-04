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

import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Removed<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * @description Add a message (reply) by the Plaintiff or one of the Witnesses This endpoint allows: - The **Plaintiff** (dispute creator) - Any **Witness** of the Plaintiff side to post a message within a dispute. The message content is stored in Meilisearch for fast retrieval, and the metadata + file uploads are stored in MySQL. Validation rules: - The dispute must exist and not be deleted. - The content must be string. - The user must be the dispute creator or a valid witness. - The dispute must be pending (not settled/dismissed). - The field `content` is required.
   *
   * @tags Dispute
   * @name DisputeMessagePlaintiffCreate
   * @request POST:[REMOVED]/dispute/{disputeId}/message/plaintiff
   * @secure
   */
  disputeMessagePlaintiffCreate = (
    disputeId: number,
    data: {
      /** Optional attached files (max 10) */
      files?: any[];
    },
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `[REMOVED]/dispute/${disputeId}/message/plaintiff`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.FormData,
      ...params,
    });
  /**
   * @description Add a message (reply) by the Defendant or one of the Witnesses This endpoint allows: - The **Defendant** (dispute againstId) - Any **Witness** of the Defendant side to post a message within a dispute. The message content is stored in Meilisearch for fast retrieval, and the metadata + file uploads are stored in MySQL. Validation rules: - The dispute must exist and not be deleted. - The content must be string. - The user must be the dispute defendant or a valid witness. - The dispute must be pending (not settled/dismissed). - The field `content` is required.
   *
   * @tags Dispute
   * @name DisputeMessageDefendantCreate
   * @request POST:[REMOVED]/dispute/{disputeId}/message/defendant
   * @secure
   */
  disputeMessageDefendantCreate = (
    disputeId: number,
    data: {
      /** Optional attached files (max 10) */
      files?: any[];
    },
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `[REMOVED]/dispute/${disputeId}/message/defendant`,
      method: "POST",
      body: data,
      secure: true,
      type: ContentType.FormData,
      ...params,
    });
  /**
   * @description Edit an existing message Allows to: - Edit the message content - Attach new files Validation rules: - Dispute must exist and be Pending. - User must be the creator of the message. - `content` required.
   *
   * @tags Dispute
   * @name DisputeMessagePartialUpdate
   * @request PATCH:[REMOVED]/dispute/{disputeId}/message/{messageId}
   * @secure
   */
  disputeMessagePartialUpdate = (
    disputeId: number,
    messageId: number,
    data: {
      /** Optional new attachments */
      files?: any[];
    },
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `[REMOVED]/dispute/${disputeId}/message/${messageId}`,
      method: "PATCH",
      body: data,
      secure: true,
      type: ContentType.FormData,
      ...params,
    });
  /**
   * @description Soft delete a dispute message (and its files) Allows the message author to remove their own message and any attached files. Validation: - Dispute must exist and be in Pending status - Message must belong to the user - All attached files are also soft deleted - Meilisearch entry is updated with isDeleted = true
   *
   * @tags Dispute
   * @name DisputeMessageDelete
   * @request DELETE:[REMOVED]/dispute/{disputeId}/message/{messageId}
   * @secure
   */
  disputeMessageDelete = (
    disputeId: number,
    messageId: number,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `[REMOVED]/dispute/${disputeId}/message/${messageId}`,
      method: "DELETE",
      secure: true,
      ...params,
    });
}
