/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  cleanTelegramUsername,
  formatTelegramUsernameForDisplay,
} from "../../../lib/usernameUtils";
import type { EvidenceFile, EvidenceItem } from "../../../types";

const API_BASE = import.meta.env.VITE_API_URL;

export const formatDisplayName = (username: string): string => {
  const cleaned = cleanTelegramUsername(username);
  if (cleaned.startsWith("0x") && cleaned.length === 42) {
    return `${cleaned.slice(0, 4)}...${cleaned.slice(-6)}`;
  }
  return formatTelegramUsernameForDisplay(username);
};

export const formatBigIntTimestamp = (
  bigIntTimestamp: bigint | string | number,
): string => {
  try {
    const timestamp = Number(bigIntTimestamp.toString());
    if (timestamp === 0) return "Not scheduled";
    if (timestamp < 10000000000) {
      return new Date(timestamp * 1000).toLocaleString();
    }
    return new Date(timestamp).toLocaleString();
  } catch {
    return "Invalid date";
  }
};

export const normalizeUsername = (username: string | undefined): string => {
  if (!username) return "";
  return username.replace(/^@/, "").toLowerCase().trim();
};

export const processEvidence = (
  evidenceList: EvidenceFile[],
  disputeId: string,
): EvidenceItem[] => {
  return evidenceList.map((evidence) => {
    const name = evidence.fileName;

    const getFileUrl = (file: EvidenceFile): string => {
      if (file.id) {
        return `${API_BASE}/dispute/${disputeId}/file/${file.id}`;
      }
      return `${API_BASE}/api/dispute/${disputeId}/file/${encodeURIComponent(name)}`;
    };

    const fileUrl = getFileUrl(evidence);

    if (name.includes("etherscan.io")) {
      return {
        name,
        type: "transaction",
        url: evidence.url || name,
        preview: "https://placehold.co/600x400/1e3a8a/white?text=Blockchain+Tx",
      };
    } else if (/\.(webp|jpg|jpeg|png|gif)$/i.test(name)) {
      return { name, type: "image", url: fileUrl, preview: fileUrl };
    } else if (/\.pdf($|\?)/i.test(name)) {
      return {
        name,
        type: "pdf",
        url: fileUrl,
        preview: "https://placehold.co/600x800/059669/white?text=PDF+Document",
      };
    } else if (name.match(/chat|screenshot|conversation/i)) {
      return {
        name,
        type: "chat",
        url: fileUrl,
        preview:
          "https://placehold.co/600x800/1f2937/white?text=Chat+Screenshot",
      };
    } else {
      return {
        name,
        type: "document",
        url: fileUrl,
        preview: "https://placehold.co/600x800/059669/white?text=Document",
      };
    }
  });
};

export const hasValidDefendantResponse = (defendantResponse: any): boolean => {
  if (!defendantResponse) return false;
  if (!defendantResponse.description) return false;
  const trimmedDesc = defendantResponse.description.trim();
  return trimmedDesc !== "" && trimmedDesc !== "No response description";
};
