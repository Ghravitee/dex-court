import { formatTelegramUsernameForDisplay } from "../../../lib/usernameUtils";
import type { UploadedFile } from "../types/form";

// ─── Formatters ───────────────────────────────────────────────────────────────

export const formatPartyDisplay = (username: string): string => {
  if (username.startsWith("0x") && username.length === 42) {
    return `${username.slice(0, 4)}...${username.slice(-6)}`;
  }
  return formatTelegramUsernameForDisplay(username);
};

export const getTotalFileSize = (files: UploadedFile[]): string => {
  const totalBytes = files.reduce((total, file) => total + file.file.size, 0);
  const mb = totalBytes / 1024 / 1024;
  return `${mb.toFixed(2)} MB`;
};

// ─── Validators ───────────────────────────────────────────────────────────────

export const isValidWalletAddress = (value: string): boolean =>
  /^0x[a-fA-F0-9]{40}$/.test(value);
