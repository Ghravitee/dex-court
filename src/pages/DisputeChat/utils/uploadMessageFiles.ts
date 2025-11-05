export async function uploadMessageFiles(
  token: string,
  disputeId: number,
  messageId: number,
  files: File[],
): Promise<boolean> {
  if (!files.length) return false;

  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/dispute/${disputeId}/message/${messageId}/upload`,
    {
      method: "POST",
      headers: { Authorization: token },
      body: formData,
    },
  );

  return response.ok;
}
