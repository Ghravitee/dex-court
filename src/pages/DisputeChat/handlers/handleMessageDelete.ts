import { getSocket } from "../../../services/socket";
import type {
  DisputeSocketMessageDeleteDTO,
  DisputeSocketMessageDeleteRequest,
} from "../types";

export function handleMessageDelete(
  disputeId: number,
  messageId: number,
): void {
  const socket = getSocket();
  const payload: DisputeSocketMessageDeleteRequest = { disputeId, messageId };

  socket.emit(
    "message:delete",
    payload,
    (res: DisputeSocketMessageDeleteDTO) => {
      if (!res.ok) console.error("Error deleting message:", res.error);
    },
  );
}
