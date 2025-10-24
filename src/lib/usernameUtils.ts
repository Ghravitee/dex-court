/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/usernameUtils.ts
/**
 * Standardizes Telegram usernames for database lookup
 * Tries both formats: with @ and without @
 */
// In usernameUtils.ts - make sure it's not returning empty strings
export const cleanTelegramUsername = (username: string): string => {
  if (!username) return "";

  // Remove @ symbol and trim whitespace
  let cleaned = username.replace(/^@/, "").trim();

  // Additional cleaning if needed
  cleaned = cleaned.toLowerCase();

  console.log(`🔍 Cleaning username: "${username}" -> "${cleaned}"`);
  return cleaned;
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

  const cleaned = cleanTelegramUsername(username);
  return cleaned.length > 0;
};

/**
 * Gets the current user's Telegram username with consistent formatting
 */
export const getCurrentUserTelegram = (user: any): string => {
  // Try multiple possible locations for Telegram username
  const telegramUsername = user?.telegram?.username || user?.telegramUsername;
  return cleanTelegramUsername(telegramUsername);
};

/**
 * Gets the database-compatible Telegram username
 * This preserves the original format that exists in the database
 */
export const getDatabaseTelegramUsername = (
  username: string | undefined | null,
): string => {
  if (!username) return "";

  // For now, we'll use the cleaned version (without @) as the primary format
  // but we'll handle both formats in the lookup logic
  return cleanTelegramUsername(username);
};
