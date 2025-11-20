// src/constants/auth.ts
export const authQueryKeys = {
  user: ["auth", "user"] as const,
  currentUser: () => [...authQueryKeys.user, "current"] as const,
};
