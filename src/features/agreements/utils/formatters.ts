/* eslint-disable @typescript-eslint/no-explicit-any */
import { formatTelegramUsernameForDisplay } from "../../../lib/usernameUtils";
import type { Agreement } from "../../../types";
import {
  AgreementTypeEnum,
  AgreementVisibilityEnum,
  apiStatusToFrontend,
} from "../constants/enums";

// ─── Number formatting ────────────────────────────────────────────────────────

export const formatNumberWithCommas = (value: string): string => {
  if (!value) return "";
  const numericValue = value.replace(/[^\d.,]/g, "");
  if (!numericValue) return "";
  const parts = numericValue.split(".");
  let wholePart = parts[0];
  const decimalPart = parts[1] || "";
  if (wholePart) {
    wholePart = wholePart.replace(/,/g, "");
    if (wholePart.length > 0) {
      wholePart = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
  }
  if (decimalPart) return `${wholePart}.${decimalPart}`;
  if (numericValue.includes(".")) return `${wholePart}.`;
  return wholePart;
};

export const parseFormattedNumber = (formattedValue: string): string =>
  formattedValue.replace(/,/g, "");

// ─── Validation ───────────────────────────────────────────────────────────────

export const getValidationState = (
  field: string,
  value: string,
): { isValid: boolean; message: string } => {
  const trimmedValue = value.trim();
  if (!trimmedValue) return { isValid: false, message: "" };

  if (field === "title") {
    const isValid = trimmedValue.length >= 3;
    return {
      isValid,
      message: isValid
        ? "✓ Title looks good"
        : "Title must be at least 3 characters",
    };
  }

  if (field === "description") {
    const isValid = trimmedValue.length >= 10;
    return {
      isValid,
      message: isValid
        ? "✓ Description looks good"
        : "Description must be at least 10 characters",
    };
  }

  if (["counterparty", "partyA", "partyB"].includes(field)) {
    const username = trimmedValue.replace(/^@/, "");
    const isValid = username.length >= 2 && /^[a-zA-Z0-9_]+$/.test(username);
    return {
      isValid,
      message: isValid
        ? "✓ Valid username format"
        : username.length < 2
          ? "Username must be at least 2 characters"
          : "Only letters, numbers, and underscores allowed",
    };
  }

  if (field === "amount") {
    if (trimmedValue === "") return { isValid: true, message: "" };
    const numValue = parseFloat(trimmedValue.replace(/,/g, ""));
    const isValid = !isNaN(numValue) && numValue > 0;
    return {
      isValid,
      message: isValid ? "✓ Valid amount" : "Amount must be a positive number",
    };
  }

  return { isValid: false, message: "" };
};

export const isValidUserIdentity = (value?: string): boolean => {
  if (!value) return false;
  const v = value.trim();
  if (/^@?[a-zA-Z0-9_]{2,}$/.test(v)) return true;
  if (/^0x[a-fA-F0-9]{40}$/.test(v)) return true;
  return false;
};

// ─── Agreement transformer ────────────────────────────────────────────────────

const formatDateSafely = (dateString: string): string => {
  if (!dateString) return "No deadline";
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString();
  } catch {
    return "Invalid Date";
  }
};

const getAvatarIdFromParty = (party: any): number | null => {
  const avatarId = party?.avatarId || party?.avatar?.id;
  return avatarId ? Number(avatarId) : null;
};

const getTelegramUsernameFromParty = (party: any): string => {
  if (!party) return "Unknown";
  const telegramUsername = party?.telegramUsername || party?.username;
  if (!telegramUsername) return "Unknown";
  return telegramUsername.startsWith("@")
    ? telegramUsername
    : `@${telegramUsername}`;
};

const getVisibilityLabel = (visibility: number): "Public" | "Private" => {
  switch (visibility) {
    case AgreementVisibilityEnum.PRIVATE:
      return "Private";
    default:
      return "Public";
  }
};

export const transformApiAgreement = (apiAgreement: any): Agreement => {
  const useEscrow = apiAgreement.type === AgreementTypeEnum.ESCROW;
  const includesFunds = Boolean(
    apiAgreement.amount ||
      apiAgreement.tokenSymbol ||
      apiAgreement.type === AgreementTypeEnum.ESCROW,
  );

  const rawCreatedBy = getTelegramUsernameFromParty(apiAgreement.firstParty);
  const createdBy = formatTelegramUsernameForDisplay(rawCreatedBy);
  const createdByUserId =
    apiAgreement.firstParty?.id?.toString() ||
    apiAgreement.creator?.id?.toString();
  const createdByAvatarId =
    getAvatarIdFromParty(apiAgreement.firstParty) ||
    getAvatarIdFromParty(apiAgreement.creator);

  const rawCounterparty = getTelegramUsernameFromParty(
    apiAgreement.counterParty,
  );
  const counterparty = formatTelegramUsernameForDisplay(rawCounterparty);
  const counterpartyUserId = apiAgreement.counterParty?.id?.toString();
  const counterpartyAvatarId = getAvatarIdFromParty(apiAgreement.counterParty);

  let amountValue: string | undefined;
  if (includesFunds && apiAgreement.amount) {
    amountValue =
      typeof apiAgreement.amount === "string"
        ? parseFloat(apiAgreement.amount).toString()
        : apiAgreement.amount.toString();
  }

  return {
    id: apiAgreement.id,
    title: apiAgreement.title || "Untitled Agreement",
    description: apiAgreement.description || "",
    type: getVisibilityLabel(apiAgreement.visibility),
    counterparty,
    createdBy,
    status: apiStatusToFrontend(apiAgreement.status),
    dateCreated: formatDateSafely(
      apiAgreement.dateCreated || apiAgreement.createdAt,
    ),
    deadline: formatDateSafely(apiAgreement.deadline),
    amount: amountValue,
    token: apiAgreement.tokenSymbol || undefined,
    files: apiAgreement.files?.length || 0,
    includeFunds: includesFunds ? "yes" : "no",
    useEscrow,
    escrowAddress: apiAgreement.escrowContractAddress || undefined,
    createdByAvatarId,
    counterpartyAvatarId,
    createdByUserId,
    counterpartyUserId,
    cancelPending: apiAgreement.cancelPending || false,
    cancelRequestedById: apiAgreement.cancelRequestedById?.toString() || null,
  };
};
