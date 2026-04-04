/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from "react";
import { extractRolesFromDescription } from "../utils/statusMapping";

export const useRoleLogic = () => {
  const getUserRoleInAgreement = useCallback(
    (
      agreement: any,
      userId: string | undefined,
      userWalletAddress: string | undefined,
      isEscrow: boolean = false,
    ): string => {
      if (!userId && !userWalletAddress) return "Unknown";

      if (isEscrow) {
        const payeeWallet = agreement.payeeWalletAddress?.toLowerCase();
        const payerWallet = agreement.payerWalletAddress?.toLowerCase();
        const userWallet = userWalletAddress?.toLowerCase();

        if (userWallet) {
          if (payeeWallet && payeeWallet === userWallet) {
            return "Service Provider";
          }
          if (payerWallet && payerWallet === userWallet) {
            return "Service Recipient";
          }
        }

        const userIdNum = userId ? Number(userId) : null;
        const firstPartyId = agreement.firstParty
          ? Number(agreement.firstParty.id)
          : null;
        const counterPartyId = agreement.counterParty
          ? Number(agreement.counterParty.id)
          : null;

        if (userIdNum) {
          if (firstPartyId === userIdNum) return "Service Provider";
          if (counterPartyId === userIdNum) return "Service Recipient";
        }

        const roles = extractRolesFromDescription(agreement.description || "");

        if (userWallet) {
          const provider = roles.serviceProvider?.toLowerCase();
          const recipient = roles.serviceRecipient?.toLowerCase();

          if (provider && provider === userWallet) {
            return "Service Provider";
          }
          if (recipient && recipient === userWallet) {
            return "Service Recipient";
          }
        }

        const userTelegram = userId ? `@user${userId}` : null;
        if (userTelegram) {
          if (
            roles.serviceProvider &&
            roles.serviceProvider.toLowerCase() === userTelegram.toLowerCase()
          ) {
            return "Service Provider";
          }
          if (
            roles.serviceRecipient &&
            roles.serviceRecipient.toLowerCase() === userTelegram.toLowerCase()
          ) {
            return "Service Recipient";
          }
        }
      }

      const userIdNum = userId ? Number(userId) : null;
      const firstPartyId = agreement.firstParty
        ? Number(agreement.firstParty.id)
        : null;
      const counterPartyId = agreement.counterParty
        ? Number(agreement.counterParty.id)
        : null;

      if (userIdNum) {
        if (firstPartyId === userIdNum) return "First Party";
        if (counterPartyId === userIdNum) return "Counter Party";
      }

      return "Creator";
    },
    [],
  );

  const getUserRoleInDispute = useCallback(
    (dispute: any, userId: string | undefined) => {
      if (!userId) return "Unknown";

      if (dispute.plaintiffData?.userId === userId) return "Plaintiff";
      if (dispute.defendantData?.userId === userId) return "Defendant";

      let isPlaintiffWitness = false;
      let isDefendantWitness = false;

      if (dispute.witnesses && typeof dispute.witnesses === "object") {
        const plaintiffWitnesses = dispute.witnesses.plaintiff || [];
        const defendantWitnesses = dispute.witnesses.defendant || [];

        isPlaintiffWitness = plaintiffWitnesses.some(
          (w: any) => w.id?.toString() === userId,
        );
        isDefendantWitness = defendantWitnesses.some(
          (w: any) => w.id?.toString() === userId,
        );
      }

      if (isPlaintiffWitness) return "Witness (Plaintiff)";
      if (isDefendantWitness) return "Witness (Defendant)";

      return "Observer";
    },
    [],
  );

  return {
    getUserRoleInAgreement,
    getUserRoleInDispute,
  };
};
