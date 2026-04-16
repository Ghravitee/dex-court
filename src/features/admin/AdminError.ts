// src/features/admin/AdminError.ts
import type { AdminErrorCode } from "./constants";

export class AdminError extends Error {
  code?: AdminErrorCode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(message: string, code?: AdminErrorCode, details?: any) {
    super(message);
    this.name = "AdminError";
    this.code = code;
    this.details = details;
  }
}

/** Resolves a thrown value into a human-readable string. */
export function resolveErrorMessage(error: unknown): string {
  if (error instanceof AdminError) return error.message;
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}
