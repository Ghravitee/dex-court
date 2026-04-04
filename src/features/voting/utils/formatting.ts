// Helper function to check if it's a wallet address
export const isWalletAddress = (address: string): boolean => {
  if (!address) return false;
  return address.startsWith("0x") && address.length > 10;
};

// Helper function to slice wallet addresses
export const sliceWalletAddress = (address: string): string => {
  if (!address) return "";

  if (isWalletAddress(address)) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  return address;
};

// Helper function to format display name with @ symbol only for usernames
export const formatDisplayName = (address: string): string => {
  if (!address) return "";

  const slicedAddress = sliceWalletAddress(address);

  if (isWalletAddress(address)) {
    return slicedAddress;
  } else {
    return `@${slicedAddress}`;
  }
};

export const formatUsername = (username: string): string => {
  return username.replace("@", "");
};
