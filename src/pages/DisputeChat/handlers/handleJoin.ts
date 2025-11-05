import type { Socket } from "socket.io-client";
import type { DisputeSocketJoinDTO, DisputeSocketMessageDTO } from "../types";

export function handleJoin(
  socket: Socket,
  disputeId: number,
  setMessages: React.Dispatch<React.SetStateAction<DisputeSocketMessageDTO[]>>,
) {
  socket.emit("dispute:join", { disputeId }, (res: DisputeSocketJoinDTO) => {
    if (res.ok && res.history) setMessages(res.history);
    else console.error("Error joining dispute:", res.error);
  });
}
