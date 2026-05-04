export async function fetchFileAsObjectUrl(
  token: string,
  disputeId: number,
  fileId: number,
): Promise<string> {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/dispute/${disputeId}/file/${fileId}`,
    {
      method: "GET",
      headers: { Authorization: token },
    },
  );

  if (!response.ok) throw new Error("Failed to fetch file");

  const blob = await response.blob();
  return window.URL.createObjectURL(blob);
}
