// Determines which fetch strategy to use based on the handle format.
// Called inside the query function so TanStack Query caches by resolved type.
export type HandleType = "own" | "wallet" | "id" | "username";

export function resolveHandleType(
  decodedHandle: string,
  isOwnProfile: boolean,
): HandleType {
  if (isOwnProfile) return "own";
  const clean = decodedHandle.replace(/^@/, "");
  if (/^0x[a-fA-F0-9]{40}$/.test(clean)) return "wallet";
  if (!isNaN(Number(clean)) && clean.length > 0) return "id";
  return "username";
}

export function cleanHandle(decodedHandle: string): string {
  return decodedHandle.replace(/^@/, "");
}
