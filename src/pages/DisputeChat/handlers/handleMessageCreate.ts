import { getSocket } from "../../../services/socket";
import type { DisputeSocketMessageCreateDTO } from "../types";

interface Params {
  disputeId: number;
  content: string;
  token: string;
  files: File[];
  setContent: React.Dispatch<React.SetStateAction<string>>;
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  uploadMessageFiles: (
    token: string,
    disputeId: number,
    messageId: number,
    files: File[],
  ) => Promise<boolean>;
}

export async function handleMessageCreate({
  disputeId,
  content,
  token,
  files,
  setContent,
  setFiles,
  uploadMessageFiles,
}: Params): Promise<void> {
  const socket = getSocket();

  socket.emit(
    "message:create",
    { disputeId, content },
    async (res: DisputeSocketMessageCreateDTO) => {
      if (!res.ok || !res.message) {
        console.error("Error sending message:", res.error);
        return;
      }

      if (files.length > 0) {
        const uploaded = await uploadMessageFiles(
          token,
          disputeId,
          res.message.id,
          files,
        );
        if (!uploaded) console.error("File upload failed");
        setFiles([]);
      }

      setContent("");
    },
  );
}
