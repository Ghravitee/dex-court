/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { connectSocket } from "../../services/socket";
import {
  handleFilesAdded,
  handleJoin,
  handleMessageCreate,
  handleMessageDelete,
} from "./handlers";
import type {
  DisputeSocketMessageDTO,
  DisputeSocketMessageDeletedEvent,
  DisputeChatRole,
} from "./types";
import { downloadDisputeFile, uploadMessageFiles } from "./utils";
import {
  Paperclip,
  Send,
  Trash2,
  Download,
  Loader2,
  Eye,
  EyeOff,
  Scale,
  UserCheck,
  Shield,
  Gavel,
  Users,
} from "lucide-react";
import { UserAvatar } from "../../components/UserAvatar";

// Utility function to format message timestamps
const formatMessageTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// Utility function to check if two messages are from the same day
const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// Utility function to format date divider
const formatDateDivider = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(date, today)) {
    return "Today";
  } else if (isSameDay(date, yesterday)) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
};

// Group messages by date and add date dividers
const groupMessagesWithDividers = (messages: DisputeSocketMessageDTO[]) => {
  if (messages.length === 0) return [];

  const grouped: (
    | DisputeSocketMessageDTO
    | { type: "divider"; date: string }
  )[] = [];
  let currentDate = "";

  messages.forEach((message) => {
    const messageDate = formatDateDivider(message.creationDate);

    if (messageDate !== currentDate) {
      grouped.push({ type: "divider", date: messageDate });
      currentDate = messageDate;
    }

    grouped.push(message);
  });

  return grouped;
};

// Helper function to check if user can send messages
const canUserSendMessages = (userRole?: DisputeChatRole): boolean => {
  const allowedRoles: DisputeChatRole[] = [
    "plaintiff",
    "defendant",
    "witness",
    "judge",
  ];
  return userRole ? allowedRoles.includes(userRole) : false;
};

// Helper function to check if user can delete their own messages
const canUserDeleteMessages = (userRole?: DisputeChatRole): boolean => {
  const allowedRoles: DisputeChatRole[] = [
    "plaintiff",
    "defendant",
    "witness",
    "judge",
  ];
  return userRole ? allowedRoles.includes(userRole) : false;
};

// Role badge configuration with colors and icons
const roleConfig: Record<
  DisputeChatRole,
  {
    label: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
    icon: React.ReactNode;
  }
> = {
  plaintiff: {
    label: "Plaintiff",
    bgColor: "bg-blue-500/20",
    textColor: "text-blue-300",
    borderColor: "border-blue-400/30",
    icon: <Scale className="h-3 w-3" />,
  },
  defendant: {
    label: "Defendant",
    bgColor: "bg-yellow-500/20",
    textColor: "text-yellow-300",
    borderColor: "border-yellow-400/30",
    icon: <Shield className="h-3 w-3" />,
  },
  witness: {
    label: "Witness",
    bgColor: "bg-green-500/20",
    textColor: "text-green-300",
    borderColor: "border-green-400/30",
    icon: <UserCheck className="h-3 w-3" />,
  },
  judge: {
    label: "Judge",
    bgColor: "bg-purple-500/20",
    textColor: "text-purple-300",
    borderColor: "border-purple-400/30",
    icon: <Gavel className="h-3 w-3" />,
  },
  admin: {
    label: "Admin",
    bgColor: "bg-red-500/20",
    textColor: "text-red-300",
    borderColor: "border-red-400/30",
    icon: <Shield className="h-3 w-3" />,
  },
  community: {
    label: "Community",
    bgColor: "bg-cyan-500/20",
    textColor: "text-cyan-300",
    borderColor: "border-cyan-400/30",
    icon: <Users className="h-3 w-3" />,
  },
};
// Role badge component
const RoleBadge = ({ role }: { role: DisputeChatRole }) => {
  const config = roleConfig[role];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${config.bgColor} ${config.textColor} ${config.borderColor}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
};

// User role badge for the current user in the header
const UserRoleBadge = ({ role }: { role: DisputeChatRole }) => {
  const config = roleConfig[role];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${config.bgColor} ${config.textColor} ${config.borderColor}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
};

// Helper function to format username with @ symbol
// Helper function to format username - Alternative version
const formatUsername = (username: string): string => {
  if (!username || username === "Unknown") return "Unknown";

  // Remove any existing @ symbols for processing
  const cleanUsername = username.replace(/^@+/, "");

  // Check if it's a wallet address (starts with 0x and is 42 characters)
  if (cleanUsername.startsWith("0x") && cleanUsername.length === 42) {
    // Format wallet address: first 4 chars + "..." + last 4 chars
    return `${cleanUsername.slice(0, 6)}...${cleanUsername.slice(-4)}`;
  }

  // Check if it looks like a Telegram username (alphanumeric with underscores)
  const telegramPattern = /^[a-zA-Z0-9_]+$/;
  if (telegramPattern.test(cleanUsername) && cleanUsername.length <= 30) {
    // Add @ prefix for Telegram-style usernames
    return `@${cleanUsername}`;
  }

  // For everything else, return as-is without @ symbol
  return cleanUsername;
};

interface DisputeChatProps {
  disputeId: number;
  userRole?: DisputeChatRole;
}

export default function DisputeChat({ disputeId, userRole }: DisputeChatProps) {
  const token = localStorage.getItem("authToken") ?? "";
  const { user } = useAuth();

  const [messages, setMessages] = useState<DisputeSocketMessageDTO[]>([]);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [isSending, setIsSending] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const canSend = canUserSendMessages(userRole);
  const canDelete = canUserDeleteMessages(userRole);

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  useEffect(() => {
    const socket = connectSocket(token);
    socketRef.current = socket;

    handleJoin(socket, disputeId, setMessages);
    handleFilesAdded(socket, setMessages);

    socket.on("message:created", (msg: DisputeSocketMessageDTO) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("message:deleted", (msg: DisputeSocketMessageDeletedEvent) => {
      setMessages((prev) => prev.filter((m) => m.id !== msg.messageId));
    });

    // 🟢 Listen for typing events
    socket.on("typing:start", ({ username, accountId }: any) => {
      if (user?.id === accountId.toString()) return;
      setTypingUsers((prev) => ({
        ...prev,
        [accountId]: username,
      }));
    });

    socket.on("typing:stop", ({ accountId }: any) => {
      setTypingUsers((prev) => {
        const updated = { ...prev };
        delete updated[accountId];
        return updated;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [disputeId, token, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers, scrollToBottom]);

  const sendMessage = async () => {
    if (!content.trim() && files.length === 0) return;

    setIsSending(true);
    try {
      await handleMessageCreate({
        disputeId,
        content,
        token,
        files,
        setContent,
        setFiles,
        uploadMessageFiles,
      });
      socketRef.current?.emit("typing:stop", {
        disputeId,
        accountId: user?.id,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const deleteMessage = (messageId: number) => {
    if (canDelete) {
      handleMessageDelete(disputeId, messageId);
    }
  };

  const handleDownload = async (fileId: number, fileName: string) => {
    await downloadDisputeFile(token, disputeId, fileId, fileName);
  };

  // 🟡 Handle typing detection
  // 🟡 Handle typing detection - UPDATED for textarea
  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!canSend) return;

    setContent(e.target.value);

    // Auto-expand textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`; // Max 128px (about 6 lines)

    if (!socketRef.current) return;

    socketRef.current.emit("typing:start", {
      disputeId,
      username: user?.username,
      accountId: user?.id,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit("typing:stop", {
        disputeId,
        accountId: user?.id,
      });
    }, 2500);
  };

  // Handle Enter key to send message - UPDATED for textarea
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && canSend) {
      e.preventDefault();
      sendMessage();

      // Reset textarea height after sending
      const textarea = e.currentTarget;
      setTimeout(() => {
        textarea.style.height = "auto";
        textarea.style.height = "48px"; // Reset to initial height
      }, 10);
    }

    // Allow Shift+Enter for new line
    if (e.key === "Enter" && e.shiftKey) {
      // Allow default behavior (new line)
      return;
    }
  };

  if (!disputeId || isNaN(disputeId)) {
    return (
      <div className="p-4 text-center text-red-400">
        Invalid dispute ID. Cannot load chat.
      </div>
    );
  }

  const groupedMessages = groupMessagesWithDividers(messages);
  const typingDisplay =
    Object.values(typingUsers).length > 0
      ? `${Object.values(typingUsers).join(", ")} ${
          Object.values(typingUsers).length === 1 ? "is" : "are"
        } typing...`
      : null;

  return (
    <div className="card-cyan mx-auto w-full max-w-3xl rounded-2xl bg-[#0e1116]/90 p-4 shadow-lg backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between border-b border-cyan-800/30 pb-2">
        <div className="ml-auto flex items-center gap-2 text-sm text-cyan-300/70">
          {canSend ? (
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>Read & Write</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <EyeOff className="h-4 w-4" />
              <span>Read Only</span>
            </div>
          )}
          {userRole && <UserRoleBadge role={userRole} />}
        </div>
      </div>

      <div
        ref={chatContainerRef}
        className="scrollbar-thin scrollbar-thumb-cyan-700/30 flex h-[400px] flex-col space-y-3 overflow-y-auto rounded-lg border border-cyan-800/20 bg-[#0b0e13]/60 p-3"
      >
        {groupedMessages.map((item, index) => {
          if ("type" in item && item.type === "divider") {
            return (
              <div
                key={`divider-${item.date}-${index}`}
                className="my-2 flex items-center justify-center"
              >
                <div className="rounded-full border border-cyan-700/30 bg-cyan-900/20 px-3 py-1 text-xs font-medium text-cyan-400/70">
                  {item.date}
                </div>
              </div>
            );
          }

          const m = item as DisputeSocketMessageDTO;
          const isMine = user?.id === m.accountId.toString();
          const canDeleteThisMessage = isMine && canDelete;
          const formattedUsername = formatUsername(m.username);

          return (
            <div
              key={m.id}
              className={`flex w-full items-start gap-2 ${
                isMine ? "justify-end" : "justify-start"
              }`}
            >
              {!isMine && (
                <UserAvatar
                  userId={m.accountId.toString()}
                  avatarId={m.avatarId ?? null}
                  username={m.username}
                  size="sm"
                  className="flex-shrink-0"
                />
              )}

              <div
                className={`max-w-[90%] rounded-2xl px-2 py-2 text-sm shadow-sm sm:px-4 ${
                  isMine
                    ? "card-cyan text-cyan-100"
                    : "border border-gray-700/40 bg-[#1a1f27]/80 text-gray-200"
                }`}
              >
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 font-semibold text-cyan-400/80">
                      {isMine && (
                        <UserAvatar
                          userId={m.accountId.toString()}
                          avatarId={m.avatarId ?? null}
                          username={m.username}
                          size="sm"
                        />
                      )}
                      <span className="text-cyan-300">{formattedUsername}</span>
                    </div>
                    {/* Always show role badge if role exists */}
                    {m.role && <RoleBadge role={m.role} />}
                  </div>
                  <span className="text-[10px] font-normal text-gray-400/70">
                    {formatMessageTime(m.creationDate)}
                  </span>
                </div>
                <div className="break-words whitespace-pre-wrap">
                  {m.content}
                </div>

                {m.files && m.files.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs">
                    {m.files.map((f) => (
                      <li
                        key={f.id}
                        className="flex cursor-pointer items-center gap-1 hover:text-cyan-400"
                        onClick={() => handleDownload(f.id, f.fileName)}
                      >
                        <Download size={14} /> {f.fileName}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {canDeleteThisMessage && (
                <button
                  onClick={() => deleteMessage(m.id)}
                  className="mt-1 text-gray-500 transition-colors hover:text-red-400"
                  title="Delete message"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          );
        })}

        {typingDisplay && (
          <div className="mt-2 animate-pulse text-xs text-cyan-400/70 italic">
            {typingDisplay}
          </div>
        )}
      </div>

      {/* Input Section - Only show for authorized users */}
      {canSend ? (
        <>
          <div className="mt-4 border-t border-cyan-800/40 pt-3">
            <div className="relative flex items-center gap-2">
              {/* Combined input with upload button inside */}
              <div className="relative flex-1">
                <div className="absolute top-3 left-3 z-10">
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer text-cyan-400 transition-colors hover:text-cyan-300"
                    title="Attach files"
                  >
                    <Paperclip size={20} />
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    onChange={(e) => setFiles(Array.from(e.target.files || []))}
                    className="hidden"
                  />
                </div>

                {/* CHANGED: Replaced input with textarea */}
                <textarea
                  value={content}
                  onChange={handleTyping}
                  onKeyDown={handleKeyPress} // Changed from onKeyPress to onKeyDown
                  placeholder="Write a message..."
                  disabled={isSending}
                  rows={1}
                  className="max-h-32 min-h-[48px] w-full resize-none rounded-xl border border-cyan-800/40 bg-[#141920] py-3 pr-20 pl-12 text-gray-100 transition-all focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none disabled:opacity-50"
                  style={{
                    overflowY: "auto",
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgba(6, 182, 212, 0.3) transparent",
                  }}
                />

                {/* Send button positioned inside the textarea on the right */}
                <div className="absolute right-2 bottom-3 z-10">
                  <button
                    onClick={sendMessage}
                    disabled={
                      isSending || (!content.trim() && files.length === 0)
                    }
                    className="flex items-center gap-1 rounded-lg bg-cyan-600 px-3 py-[6px] font-medium text-white shadow-md transition-all hover:bg-cyan-500 hover:shadow-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    <p className="ml-1 hidden sm:inline">
                      {isSending ? "Sending..." : "Send"}
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-cyan-400">
              {files.map((f) => (
                <span
                  key={f.name}
                  className="rounded-md border border-cyan-500/30 bg-cyan-600/20 px-2 py-1"
                >
                  {f.name}
                </span>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="mt-4 border-t border-cyan-800/40 pt-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-cyan-400/70">
            <EyeOff className="h-4 w-4" />
            <span>Read-only access</span>
          </div>
          <p className="mt-1 text-xs text-cyan-400/50">
            Only plaintiffs, defendants, witnesses, and judges can send messages
          </p>
        </div>
      )}
    </div>
  );
}
