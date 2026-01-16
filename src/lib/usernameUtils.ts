// lib/usernameUtils.ts
/**
 * Standardizes Telegram usernames for database lookup
 * Tries both formats: with @ and without @
 */
export const cleanTelegramUsername = (username: string): string => {
  if (!username) return "";

  // Remove @ symbol for processing
  return username.replace(/^@/, "").trim();
};

/**
 * Gets both possible formats for database lookup
 */
export const getTelegramUsernameVariants = (
  username: string | undefined | null,
): string[] => {
  if (!username) return [];

  const cleaned = cleanTelegramUsername(username);
  const withAt = `@${cleaned}`;

  return [cleaned, withAt];
};

/**
 * Validates if a Telegram username exists and is properly formatted
 */
export const isValidTelegramUsername = (
  username: string | undefined | null,
): boolean => {
  if (!username) return false;

  const cleanUsername = cleanTelegramUsername(username);

  // Telegram username validation rules (case insensitive):
  // - 5-32 characters after @
  // - Can contain a-z, 0-9, and underscores
  // - Cannot start with a number or underscore
  // - Cannot end with underscore
  // - No consecutive underscores
  const telegramRegex = /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/i; // Added 'i' flag for case insensitive

  return telegramRegex.test(cleanUsername) && cleanUsername.length >= 1;
};

/**
 * Gets the current user's Telegram username with consistent formatting
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getCurrentUserTelegram = (user: any): string => {
  if (!user) return "";

  return cleanTelegramUsername(
    user.telegramUsername || user.telegram?.username || user.telegramInfo,
  );
};

/**
 * Formats usernames for display - keeps @ for Telegram, slices wallet addresses
 */
export const formatTelegramUsernameForDisplay = (
  username: string | undefined,
): string => {
  if (!username) return "Unknown";

  // Remove @ symbol temporarily for checking
  const cleanUsername = username.startsWith("@") ? username.slice(1) : username;

  // Check if it's a wallet address (starts with 0x and is hex, length 42)
  if (cleanUsername.startsWith("0x") && cleanUsername.length === 42) {
    // Slice the wallet address: first 5 chars + "..." + last 4 chars
    const slicedWallet = `${cleanUsername.slice(0, 5)}...${cleanUsername.slice(-4)}`;

    // Add back @ prefix if the original had it
    return username.startsWith("@") ? `@${slicedWallet}` : slicedWallet;
  }

  // For Telegram usernames, ensure they have @ prefix for display
  return username.startsWith("@") ? username : `@${username}`;
};
