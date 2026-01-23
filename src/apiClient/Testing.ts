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

import { TestingRequest } from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Testing<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * @description Manually escalate disputes from Pending to VoteInProgress This endpoint performs the same logic as the CRON job to check pending disputes. It updates the status of specified disputes to VoteInProgress and notifies all participants (plaintiff, defendant, witnesses, and judges).
   *
   * @tags Dispute
   * @name TestingEscalateVotesPartialUpdate
   * @request PATCH:[TESTING]/testing/escalate-votes
   * @secure
   */
  testingEscalateVotesPartialUpdate = (
    data: TestingRequest,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `[TESTING]/testing/escalate-votes`,
      method: "PATCH",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
  /**
   * @description Manually finalize voting disputes This endpoint allows to manually close disputes that are currently in `VoteInProgress` status (same logic as the cron job). It will: - Calculate weighted voting results - Update dispute status (`Settled` or `Dismissed`) - Save judge/community votes - Notify all participants (plaintiff, defendant, witnesses, judges)
   *
   * @tags Dispute
   * @name TestingFinalizeVotesPartialUpdate
   * @request PATCH:[TESTING]/testing/finalize-votes
   * @secure
   */
  testingFinalizeVotesPartialUpdate = (
    data: TestingRequest,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `[TESTING]/testing/finalize-votes`,
      method: "PATCH",
      body: data,
      secure: true,
      type: ContentType.Json,
      ...params,
    });
}
