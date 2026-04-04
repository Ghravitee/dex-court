import { toast } from "sonner";
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  MAX_IMAGE_SIZE,
  MAX_DOCUMENT_SIZE,
  MAX_TOTAL_SIZE,
  CONTRACT_ERRORS,
} from "../constants";
import type { UploadedFile } from "../types";

/** Validate a single file and return an error string, or null if valid */
export const validateFile = (
  file: File,
  existingFiles: UploadedFile[],
): string | null => {
  const fileType = file.type.startsWith("image/") ? "image" : "document";
  const totalSize = existingFiles.reduce((t, f) => t + f.file.size, 0);

  if (fileType === "image" && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `Image "${file.name}" has unsupported type. Allowed: JPEG, PNG, GIF, WebP`;
  }

  if (fileType === "document" && !ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    return `Document "${file.name}" has unsupported type. Allowed: PDF, DOC, DOCX, TXT`;
  }

  if (fileType === "image" && file.size > MAX_IMAGE_SIZE) {
    return `Image "${file.name}" exceeds 2MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`;
  }

  if (fileType === "document" && file.size > MAX_DOCUMENT_SIZE) {
    return `Document "${file.name}" exceeds 3MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`;
  }

  if (totalSize + file.size > MAX_TOTAL_SIZE) {
    return `Adding "${file.name}" would exceed total 50MB limit. Current total: ${(totalSize / 1024 / 1024).toFixed(2)}MB`;
  }

  return null;
};

/** Extract a human-readable message from a contract/wagmi error */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const extractContractErrorMessage = (error: any): string => {
  if (!error) return "Unknown error occurred";

  const msg = error.message || error.toString();

  if (msg.includes(CONTRACT_ERRORS.NOT_PARTY))
    return "You are not a party in this agreement";
  if (msg.includes(CONTRACT_ERRORS.NOT_ACTIVE))
    return "Agreement is not active or already completed";
  if (msg.includes(CONTRACT_ERRORS.INVALID_AMOUNT))
    return "Invalid amount provided";
  if (msg.includes(CONTRACT_ERRORS.CANNOT_BE_SAME))
    return "Service provider and recipient cannot be the same address";
  if (msg.includes(CONTRACT_ERRORS.ZERO_ADDRESS))
    return "Zero address is not allowed";
  if (msg.includes("user rejected") || msg.includes("denied transaction"))
    return "Transaction was rejected by user";
  if (msg.includes("insufficient funds"))
    return "Insufficient funds for transaction";
  if (msg.includes("execution reverted")) {
    const revertMatch = msg.match(/execution reverted: (.+?)(?="|$)/);
    if (revertMatch?.[1]) return `Contract reverted: ${revertMatch[1]}`;
    return "Transaction reverted by contract";
  }

  return `Blockchain error: ${msg}...`;
};

/** Show a toast for a file validation error and return false, or return true if valid */
export const toastFileError = (msg: string | null): boolean => {
  if (msg) {
    toast.error(msg);
    return false;
  }
  return true;
};
