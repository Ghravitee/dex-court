/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "../../../hooks/useAuth";
import { agreementService } from "../../../services/agreementServices";
import {
  cleanTelegramUsername,
  getCurrentUserTelegram,
} from "../../../lib/usernameUtils";
import { AgreementTypeEnum, AgreementVisibilityEnum } from "../constants/enums";
import { isValidUserIdentity } from "../utils/formatters";
import type { AgreementFormState, AgreementType } from "../types/form";

interface SubmitOptions {
  form: AgreementFormState;
  agreementType: AgreementType;
  typeValue: "Public" | "Private" | "";
  deadline: Date | null;
  includeFunds: "yes" | "no" | "";
  secureWithEscrow: "yes" | "no" | "";
  selectedToken: string;
  customTokenAddress: string;
  fundsWithoutEscrow: {
    token: string;
    amount: string;
    customTokenAddress: string;
  };
  onSuccess: () => void;
}

export function useAgreementSubmit() {
  const { isAuthenticated, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent, options: SubmitOptions) => {
      e.preventDefault();

      const {
        form,
        agreementType,
        typeValue,
        deadline,
        includeFunds,
        secureWithEscrow,
        selectedToken,
        customTokenAddress,
        fundsWithoutEscrow,
        onSuccess,
      } = options;

      if (!isAuthenticated) {
        toast.error("Please log in to create agreements");
        return;
      }

      // ─── Validation ────────────────────────────────────────────────────────
      if (!form.title.trim()) {
        toast.error("Please enter a title");
        return;
      }
      if (!typeValue) {
        toast.error("Please select agreement type");
        return;
      }
      if (agreementType === "myself" && !form.counterparty.trim()) {
        toast.error("Please enter counterparty information");
        return;
      }
      if (
        agreementType === "others" &&
        (!form.partyA.trim() || !form.partyB.trim())
      ) {
        toast.error("Please enter both parties' information");
        return;
      }
      if (!form.description.trim()) {
        toast.error("Please enter a description");
        return;
      }

      const cleanCounterparty = cleanTelegramUsername(form.counterparty);
      const cleanPartyA = cleanTelegramUsername(form.partyA);
      const cleanPartyB = cleanTelegramUsername(form.partyB);
      const currentUserTelegram = getCurrentUserTelegram(user);

      if (
        agreementType === "myself" &&
        !currentUserTelegram &&
        !user?.walletAddress
      ) {
        toast.error(
          "Unable to identify your account. Please connect a wallet or Telegram.",
        );
        return;
      }
      if (
        agreementType === "myself" &&
        !isValidUserIdentity(form.counterparty)
      ) {
        toast.error("Please enter a valid counterparty (Telegram or wallet)");
        return;
      }
      if (
        agreementType === "others" &&
        (!isValidUserIdentity(form.partyA) || !isValidUserIdentity(form.partyB))
      ) {
        toast.error("Please enter valid identities for both parties");
        return;
      }
      if (
        agreementType === "myself" &&
        cleanCounterparty === currentUserTelegram
      ) {
        toast.error("Counterparty cannot be yourself");
        return;
      }
      if (agreementType === "others" && cleanPartyA === cleanPartyB) {
        toast.error("First party and second party cannot be the same");
        return;
      }

      setIsSubmitting(true);

      try {
        // ─── Build payload ──────────────────────────────────────────────────
        const agreementData: any = {
          title: form.title,
          description: form.description,
          type: AgreementTypeEnum.REPUTATION,
          visibility:
            typeValue === "Public"
              ? AgreementVisibilityEnum.PUBLIC
              : AgreementVisibilityEnum.PRIVATE,
          firstParty:
            agreementType === "myself"
              ? currentUserTelegram || user?.walletAddress || ""
              : cleanPartyA,
          counterParty:
            agreementType === "myself" ? cleanCounterparty : cleanPartyB,
        };

        if (deadline) agreementData.deadline = deadline.toISOString();

        if (includeFunds === "yes") {
          agreementData.includesFunds = true;

          if (secureWithEscrow === "yes") {
            agreementData.secureTheFunds = true;
            agreementData.type = AgreementTypeEnum.ESCROW;
          } else {
            agreementData.secureTheFunds = false;
          }

          // Resolve the token/amount source based on escrow choice
          const token =
            secureWithEscrow === "yes"
              ? selectedToken
              : fundsWithoutEscrow.token;
          const amount =
            secureWithEscrow === "yes"
              ? form.amount
              : fundsWithoutEscrow.amount;
          const contractAddress =
            secureWithEscrow === "yes"
              ? customTokenAddress
              : fundsWithoutEscrow.customTokenAddress;

          if (token && token !== "custom") agreementData.tokenSymbol = token;
          if (token === "custom" && contractAddress)
            agreementData.contractAddress = contractAddress;
          if (amount) agreementData.amount = parseFloat(amount);
        } else {
          agreementData.includesFunds = false;
          agreementData.secureTheFunds = false;
        }

        await agreementService.createAgreement(
          agreementData,
          form.images.length > 0 ? form.images.map((f) => f.file) : [],
        );

        const successMessage =
          agreementType === "myself"
            ? `Agreement created between you and ${form.counterparty}`
            : `Agreement created between ${form.partyA} and ${form.partyB}`;

        toast.success("Agreement created successfully", {
          description: `${successMessage} • ${typeValue} • ${form.images.length} files uploaded`,
        });

        onSuccess();
      } catch (error: any) {
        const errorCode = error.response?.data?.error;
        const errorMessage = error.response?.data?.message;

        const errorMap: Record<number, { title: string; desc: string }> = {
          1: {
            title: "Missing required information",
            desc: "Please check all required fields",
          },
          5: {
            title: "Invalid deadline",
            desc: "Deadline must be a future date",
          },
          7: {
            title: "User not found",
            desc: "One or both parties could not be found. Try different formats (with or without @).",
          },
          10: {
            title: "Server error",
            desc: "An unexpected error occurred. Please try again later.",
          },
          11: {
            title: "Same user error",
            desc: "First party and counterparty cannot be the same user",
          },
          12: {
            title: "Wallet required",
            desc: "You need a connected wallet to create escrow agreements",
          },
          13: {
            title: "Invalid agreement settings",
            desc: "Please check agreement type and visibility settings",
          },
          17: {
            title: "Account restricted",
            desc: "Your account is currently restricted from creating new agreements",
          },
        };

        if (errorCode && errorMap[errorCode]) {
          toast.error(errorMap[errorCode].title, {
            description: errorMap[errorCode].desc,
          });
        } else if (error.message?.includes("Network Error")) {
          toast.error("Network error", {
            description:
              "Unable to connect to server. Please check your internet connection.",
          });
        } else if (errorMessage) {
          toast.error("Creation failed", { description: errorMessage });
        } else {
          toast.error("Failed to create agreement", {
            description: "Please check your information and try again.",
          });
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [isAuthenticated, user],
  );

  return { handleSubmit, isSubmitting };
}
