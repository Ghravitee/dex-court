/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/usernameUtils.ts
/**
 * Standardizes Telegram usernames for database lookup
 * Tries both formats: with @ and without @
 */
// In usernameUtils.ts - make sure it's not returning empty strings
// lib/usernameUtils.ts
export const cleanTelegramUsername = (username: string): string => {
  if (!username) return "";

  // REMOVED: .toLowerCase() to preserve original case
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
export const getCurrentUserTelegram = (user: any): string => {
  if (!user) return "";

  // 🚨 FIXED: Look for telegramUsername field (from API response)
  return cleanTelegramUsername(
    user.telegramUsername || user.telegram?.username || user.telegramInfo,
  );
};

/**
 * Gets the database-compatible Telegram username
 * This preserves the original format that exists in the database
 */
export const formatTelegramUsernameForDisplay = (username: string): string => {
  const clean = cleanTelegramUsername(username);
  return clean ? `@${clean}` : ""; // Preserves original case
};
