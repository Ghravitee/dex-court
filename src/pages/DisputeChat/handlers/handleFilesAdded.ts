import type { Socket } from "socket.io-client";
import type {
  DisputeSocketMessageDTO,
  DisputeSocketMessageFilesAddedEvent,
} from "../types";

export function handleFilesAdded(
  socket: Socket,
  setMessages: React.Dispatch<React.SetStateAction<DisputeSocketMessageDTO[]>>,
) {
  socket.on(
    "message:filesAdded",
    (event: DisputeSocketMessageFilesAddedEvent) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === event.messageId
            ? {
                ...m,
                files: [
                  ...(m.files || []),
                  ...event.files.map((f) => ({
                    id: f.id,
                    fileName: f.fileName,
                    mimeType: f.mimeType,
                    fileSize: f.fileSize,
                    uploadedAt: f.uploadedAt,
                  })),
                ],
              }
            : m,
        ),
      );
    },
  );
}
