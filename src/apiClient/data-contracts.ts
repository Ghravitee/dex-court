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

export interface LoginTelegramRequest {
  /** User’s OTP code */
  otp: string;
}

export interface LoginWalletNonceRequest {
  /** User's wallet address */
  walletAddress: string;
}

export interface LoginWalletVerifyNonceRequest {
  /** User's wallet address */
  walletAddress: string;
  /** User's wallet signature */
  signature: string;
}

export interface OtpTelegramRequest {
  telegramId: string;
}

export interface RegisterTelegramRequest {
  /** User's telegramId */
  telegramId: string;
  /** User's username */
  username: string;
}

export interface LoginDTO {
  /** Session token */
  token: string;
}

export interface OtpTelegramDTO {
  otp: string;
}
