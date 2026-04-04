export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatWalletAddress = (address: string | undefined): string => {
  if (!address) return "Not connected";
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
};

export const formatShortWallet = (address: string | undefined): string => {
  if (!address) return "Unknown";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
};

export const formatHandle = (handle: string | null | undefined): string => {
  if (!handle) return "Unknown User";

  const cleanHandle = handle.replace(/^@/, "");

  if (/^0x[a-fA-F0-9]{40}$/.test(cleanHandle)) {
    return formatShortWallet(cleanHandle);
  }

  return handle.startsWith("@") ? handle : `@${handle}`;
};

export const formatDisputeParty = (party: string): string => {
  if (!party) return "Unknown";

  const cleaned = party.replace(/^@/, "");

  if (/^0x[a-fA-F0-9]{40}$/.test(cleaned)) {
    return `${cleaned.slice(0, 6)}…${cleaned.slice(-4)}`;
  }

  return `@${cleaned}`;
};
