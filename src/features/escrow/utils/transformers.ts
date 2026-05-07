/* eslint-disable @typescript-eslint/no-explicit-any */
import type { EscrowStatus, ExtendedEscrowWithOnChain } from "../types";
import { extractTxHashFromDescription } from "./formatters";

/** Map numeric API status → local EscrowStatus string */
export const mapAgreementStatusToEscrow = (status: number): EscrowStatus => {
  switch (status) {
    case 1:
      return "pending";
    case 2:
      return "signed";
    case 3:
      return "completed";
    case 4:
      return "disputed";
    case 5:
      return "cancelled";
    case 6:
      return "expired";
    case 7:
      return "pending_approval";
    default:
      return "pending";
  }
};

/** Convert a raw API agreement object into the app's ExtendedEscrowWithOnChain shape */
export const transformApiAgreementToEscrow = (
  apiAgreement: any,
): ExtendedEscrowWithOnChain => {
  const serviceProvider = apiAgreement.payeeWalletAddress?.toLowerCase() || "";
  const serviceRecipient = apiAgreement.payerWalletAddress?.toLowerCase() || "";

  let payerDetails, payeeDetails;

  if (serviceRecipient === apiAgreement.firstParty?.wallet?.toLowerCase()) {
    payerDetails = {
      id: apiAgreement.firstParty.id,
      telegramUsername: apiAgreement.firstParty.telegramUsername,
      username: apiAgreement.firstParty.username,
      avatarId: apiAgreement.firstParty.avatarId,
    };
    payeeDetails = {
      id: apiAgreement.counterParty?.id,
      telegramUsername: apiAgreement.counterParty?.telegramUsername,
      username: apiAgreement.counterParty?.username,
      avatarId: apiAgreement.counterParty?.avatarId,
    };
  } else {
    payerDetails = {
      id: apiAgreement.counterParty?.id,
      telegramUsername: apiAgreement.counterParty?.telegramUsername,
      username: apiAgreement.counterParty?.username,
      avatarId: apiAgreement.counterParty?.avatarId,
    };
    payeeDetails = {
      id: apiAgreement.firstParty.id,
      telegramUsername: apiAgreement.firstParty.telegramUsername,
      username: apiAgreement.firstParty.username,
      avatarId: apiAgreement.firstParty.avatarId,
    };
    
  }

  return {
    id: `${apiAgreement.id}`,
    title: apiAgreement.title,
    from: serviceRecipient,
    to: serviceProvider,
    chainId: apiAgreement.chainId,
    token: apiAgreement.tokenSymbol || "ETH",
    amount: apiAgreement.amount ? parseFloat(apiAgreement.amount) : 0,
    status: mapAgreementStatusToEscrow(apiAgreement.status),
    deadline: apiAgreement.deadline
      ? new Date(apiAgreement.deadline).toISOString().split("T")[0]
      : "No deadline",
    type: apiAgreement.visibility === 1 ? "private" : "public",
    description: apiAgreement.description || "",
    createdAt: new Date(
      apiAgreement.dateCreated || apiAgreement.createdAt,
    ).getTime(),
    txHash: extractTxHashFromDescription(apiAgreement.description),
    onChainId: apiAgreement.contractAgreementId,
    includeFunds: apiAgreement.includesFunds ? "yes" : "no",
    useEscrow: apiAgreement.hasSecuredFunds,
    escrowAddress: apiAgreement.escrowContractAddress,
    source: "direct API fields only",
    payerDetails,
    payeeDetails
  };
};
