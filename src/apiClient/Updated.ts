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

import { AgreementDetailsDTO } from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class Updated<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * @description Get full details of an agreement This endpoint provides complete information about a specific agreement. It includes all key fields — title, description, type, visibility, status, amount, token symbol, deadline, creation date, and all participant details, - A list of attached files - A timeline of agreement events (Created = 1, Signed, Rejected, Delivered, DeliveryConfirmed, DeliveryRejected, CancelRequested, CancelConfirmed, CancelRejected, Expired, AutoCancelled) If the agreement is private, the requester must be one of the involved users; otherwise, access is forbidden. Authentication is optional: public agreements can be accessed by anyone, but private ones require a valid token. On success, returns 200 (OK) with a detailed JSON. If the user isn’t authorized or the agreement doesn’t exist, it returns 400 (Bad Request) with an appropriate error code, or 500 (InternalServerError) for unexpected errors.
   *
   * @tags Agreement
   * @name AgreementDetail
   * @request GET:[UPDATED]/agreement/{agreementId}
   * @secure
   */
  agreementDetail = (agreementId: number, params: RequestParams = {}) =>
    this.request<AgreementDetailsDTO, void>({
      path: `[UPDATED]/agreement/${agreementId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
}
