export async function downloadDisputeFile(
  token: string,
  disputeId: number,
  fileId: number,
  fileName: string,
): Promise<void> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/dispute/${disputeId}/file/${fileId}`,
      {
        method: "GET",
        headers: { Authorization: token },
      },
    );

    if (!response.ok) throw new Error("Failed to download file");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();

    window.URL.revokeObjectURL(url);
    link.remove();
  } catch (err) {
    console.error("Error downloading file:", err);
  }
}
