import { type EscrowStatus, STATUS_CONFIG } from "../constants";

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

export const getStatusConfig = (status: string) => {
  return (
    STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || {
      label: status,
      color: "bg-pink-500/20 text-gray-300 border-gray-400/30",
    }
  );
};

export const extractRolesFromDescription = (description: string) => {
  if (!description) return { serviceProvider: null, serviceRecipient: null };

  const serviceProviderMatch = description.match(
    /Service Provider:\s*(0x[a-fA-F0-9]{40}|@[a-zA-Z0-9_]+)/i,
  );
  const serviceRecipientMatch = description.match(
    /Service Recipient:\s*(0x[a-fA-F0-9]{40}|@[a-zA-Z0-9_]+)/i,
  );

  const alternativeProviderMatch = description.match(
    /Provider:\s*(0x[a-fA-F0-9]{40}|@[a-zA-Z0-9_]+)/i,
  );
  const alternativeRecipientMatch = description.match(
    /Recipient:\s*(0x[a-fA-F0-9]{40}|@[a-zA-Z0-9_]+)/i,
  );

  return {
    serviceProvider:
      serviceProviderMatch?.[1] || alternativeProviderMatch?.[1] || null,
    serviceRecipient:
      serviceRecipientMatch?.[1] || alternativeRecipientMatch?.[1] || null,
  };
};
