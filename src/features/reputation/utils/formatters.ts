// features/reputation/utils/formatters.ts

export function truncateWallet(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatUsername(username: string): string {
  if (!username) return "Anonymous";
  return username.startsWith("@") ? username.slice(1) : username;
}

export function getDisplayName(username: string): string {
  if (!username) return "@Anonymous";
  if (isWalletAddress(username)) return truncateWallet(username);
  return username.startsWith("@") ? username : `@${username}`;
}

export function isWalletAddress(username: string): boolean {
  return username.startsWith("0x") && username.length >= 42;
}

export function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
