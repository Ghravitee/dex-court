/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
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
import { fetchFileAsObjectUrl } from "./utils/fetchFileAsObjectUrl";
import { X, ZoomIn } from "lucide-react";
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

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ChatParticipant {
  username: string;
  role: DisputeChatRole;
  avatarId?: number | null;
  id?: number;
}

interface DisputeChatProps {
  disputeId: number;
  userRole?: DisputeChatRole;
  participants?: ChatParticipant[];
}

// ── Utilities ─────────────────────────────────────────────────────────────────
const formatMessageTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const MENTION_REGEX = /@([a-zA-Z0-9_]{1,30})/g;

const isSameDay = (date1: Date, date2: Date): boolean =>
  date1.getFullYear() === date2.getFullYear() &&
  date1.getMonth() === date2.getMonth() &&
  date1.getDate() === date2.getDate();

const formatDateDivider = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

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

const canUserSendMessages = (userRole?: DisputeChatRole): boolean =>
  userRole
    ? (
        ["plaintiff", "defendant", "witness", "judge"] as DisputeChatRole[]
      ).includes(userRole)
    : false;

const canUserDeleteMessages = (userRole?: DisputeChatRole): boolean =>
  userRole
    ? (
        ["plaintiff", "defendant", "witness", "judge"] as DisputeChatRole[]
      ).includes(userRole)
    : false;

const formatUsername = (username: string): string => {
  if (!username || username === "Unknown") return "Unknown";
  const cleanUsername = username.replace(/^@+/, "");
  if (cleanUsername.startsWith("0x") && cleanUsername.length === 42)
    return `${cleanUsername.slice(0, 6)}...${cleanUsername.slice(-4)}`;
  const telegramPattern = /^[a-zA-Z0-9_]+$/;
  if (telegramPattern.test(cleanUsername) && cleanUsername.length <= 30)
    return `@${cleanUsername}`;
  return cleanUsername;
};

const isImageFile = (mimeType: string | null | undefined): boolean =>
  mimeType ? mimeType.startsWith("image/") : false;

// ── Role config ───────────────────────────────────────────────────────────────
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

// ── Image attachment ──────────────────────────────────────────────────────────
interface ImageAttachmentProps {
  token: string;
  disputeId: number;
  fileId: number;
  fileName: string;
  mimeType: string | null;
}

const ImageAttachment = ({
  token,
  disputeId,
  fileId,
  fileName,
  mimeType,
}: ImageAttachmentProps) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    fetchFileAsObjectUrl(token, disputeId, fileId)
      .then((url) => {
        objectUrlRef.current = url;
        setObjectUrl(url);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
    return () => {
      if (objectUrlRef.current) {
        window.URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [token, disputeId, fileId]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [lightboxOpen]);

  const handleDownload = () => {
    if (!objectUrl) return;
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (loading)
    return (
      <div className="mt-2 flex h-24 w-40 items-center justify-center rounded-lg border border-cyan-800/30 bg-[#0b0e13]/60">
        <Loader2 size={20} className="animate-spin text-cyan-400/70" />
      </div>
    );

  if (error || !objectUrl)
    return (
      <div
        className="mt-2 flex cursor-pointer items-center gap-1 text-xs text-gray-400 hover:text-cyan-400"
        onClick={handleDownload}
      >
        <Download size={14} />
        <span>{fileName}</span>
        {mimeType && <span className="text-gray-500">({mimeType})</span>}
      </div>
    );

  return (
    <>
      <div className="group relative mt-2 w-fit">
        <img
          src={objectUrl}
          alt={fileName}
          className="max-h-48 max-w-[240px] cursor-zoom-in rounded-lg border border-cyan-800/30 object-cover transition-opacity hover:opacity-90"
          onClick={() => setLightboxOpen(true)}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <ZoomIn size={24} className="text-white drop-shadow-lg" />
        </div>
      </div>
      {lightboxOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setLightboxOpen(false)}
          >
            <div
              className="relative max-h-[90vh] max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={objectUrl}
                alt={fileName}
                className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1 rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur-sm transition-colors hover:bg-cyan-600"
                >
                  <Download size={14} />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setLightboxOpen(false)}
                  className="rounded-lg bg-black/60 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="mt-2 text-center text-xs text-gray-400">
                {fileName}
              </p>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

// ── Mention dropdown ──────────────────────────────────────────────────────────
// ── Mention dropdown ──────────────────────────────────────────────────────────
interface MentionDropdownProps {
  participants: ChatParticipant[];
  query: string;
  onSelect: (username: string) => void;
}

const MentionDropdown = ({
  participants,
  query,
  onSelect,
}: MentionDropdownProps) => {
  const filtered = participants.filter((p) =>
    p.username.toLowerCase().includes(query.toLowerCase()),
  );

  if (filtered.length === 0) return null;

  return (
    <div className="absolute right-0 bottom-full left-0 z-50 mb-2">
      <div className="overflow-hidden rounded-xl border border-cyan-700/40 bg-[#0e1116] shadow-2xl shadow-black/60">
        <div className="border-b border-cyan-800/30 px-3 py-2 text-[10px] font-semibold tracking-widest text-cyan-400/50 uppercase">
          Mention a party
        </div>
        <ul className="max-h-52 overflow-y-auto">
          {filtered.map((p) => {
            const config = roleConfig[p.role];
            return (
              <li key={p.username}>
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(p.username);
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-cyan-500/10"
                >
                  <UserAvatar
                    userId={p.id?.toString() ?? ""}
                    avatarId={p.avatarId ?? null}
                    username={p.username}
                    size="sm"
                    className="flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-white">
                      {formatUsername(p.username)}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${config.bgColor} ${config.textColor} ${config.borderColor}`}
                  >
                    {config.icon}
                    {config.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

// ── Render mention highlights in message content ──────────────────────────────
const renderMessageContent = (
  content: string,
  participants: ChatParticipant[],
) => {
  const parts = content.split(MENTION_REGEX);

  return parts.map((part, i) => {
    // Odd indices = captured usernames
    if (i % 2 === 1) {
      const username = part.toLowerCase();
      const normalize = (u: string) => u.replace(/^@/, "").toLowerCase();

      const user = participants.find(
        (p) => normalize(p.username) === normalize(username),
      );

      if (!user) {
        return (
          <span key={i} className="font-semibold text-cyan-300">
            @{part}
          </span>
        );
      }

      return (
        <span key={i} className="inline align-middle">
          <UserAvatar
            userId={user.id?.toString() ?? ""}
            avatarId={user.avatarId ?? null}
            username={user.username}
            size="sm"
            className="inline-block align-middle"
          />
          <span className="ml-2 font-semibold text-cyan-300">
            @{user.username}
          </span>
        </span>
      );
    }

    return <span key={i}>{part}</span>;
  });
};

// ── Main component ────────────────────────────────────────────────────────────
export default function DisputeChat({
  disputeId,
  userRole,
  participants = [],
}: DisputeChatProps) {
  const token = localStorage.getItem("authToken") ?? "";
  const { user } = useAuth();

  const [messages, setMessages] = useState<DisputeSocketMessageDTO[]>([]);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [isSending, setIsSending] = useState(false);

  // Mention state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionActive, setMentionActive] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const socketRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const canSend = canUserSendMessages(userRole);
  const canDelete = canUserDeleteMessages(userRole);

  // Merge passed participants with judges discovered from message history
  const allParticipants = useMemo(() => {
    console.log("🧩 DISPUTE CHAT RAW participants prop:", participants);
    console.log("🧩 DISPUTE CHAT messages:", messages.length);
    const map = new Map<string, ChatParticipant>();

    const normalize = (u: string) => u.replace(/^@/, "").toLowerCase();

    // 1. Add initial participants
    participants.forEach((p) => {
      map.set(normalize(p.username), { ...p });
    });

    // 2. Enrich/override with message data
    messages.forEach((m) => {
      const key = normalize(m.username);

      const existing = map.get(key);

      map.set(key, {
        username: m.username,

        // prefer message role, fallback to existing
        role: existing?.role ?? m.role ?? "judge",

        // prefer message avatar, fallback to existing
        avatarId: m.avatarId ?? existing?.avatarId ?? null,

        // 🔥 CRITICAL: ALWAYS ensure id is filled
        id: m.accountId ?? existing?.id,
      });

      console.log("🧩 MESSAGE PARTICIPANT SOURCE:", {
        username: m.username,
        role: m.role,
        accountId: m.accountId,
        avatarId: m.avatarId,
      });
    });

    const result = Array.from(map.values());
    console.log("🧩 FINAL MERGED PARTICIPANTS:", result);

    return result; // Return the variable, not allParticipants
  }, [participants, messages]);

  useEffect(() => {
    console.log("🧩 ALL PARTICIPANTS:", allParticipants);
  }, [allParticipants]);

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
      console.log("🔥 SOCKET MESSAGE:", msg);
      setMessages((prev) => [...prev, msg]);
    });
    socket.on("message:deleted", (msg: DisputeSocketMessageDeletedEvent) =>
      setMessages((prev) => prev.filter((m) => m.id !== msg.messageId)),
    );
    socket.on("typing:start", ({ username, accountId }: any) => {
      if (user?.id === accountId.toString()) return;
      setTypingUsers((prev) => ({ ...prev, [accountId]: username }));
    });
    socket.on("typing:stop", ({ accountId }: any) => {
      setTypingUsers((prev) => {
        const u = { ...prev };
        delete u[accountId];
        return u;
      });
    });
    return () => {
      socket.disconnect();
    };
  }, [disputeId, token, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers, scrollToBottom]);

  // ── Mention detection ───────────────────────────────────────────────────────
  const detectMention = (value: string, cursorPos: number) => {
    const textBeforeCursor = value.slice(0, cursorPos);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);

    if (match) {
      setMentionQuery(match[1]);
      setMentionActive(true);
    } else {
      setMentionQuery(null);
      setMentionActive(false);
    }
  };

  const insertMention = (username: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart ?? content.length;
    const textBeforeCursor = content.slice(0, cursorPos);
    const textAfterCursor = content.slice(cursorPos);

    // Replace the @query with @username + space
    const replaced = textBeforeCursor.replace(
      /@([a-zA-Z0-9_]*)$/,
      `@${username.replace(/^@/, "")} `,
    );
    const newContent = replaced + textAfterCursor;

    setContent(newContent);
    setMentionActive(false);
    setMentionQuery(null);

    // Restore focus and move cursor after the inserted mention
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = replaced.length;
      textarea.selectionEnd = replaced.length;
    });
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
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
      setMentionActive(false);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const deleteMessage = (messageId: number) => {
    if (canDelete) handleMessageDelete(disputeId, messageId);
  };

  const handleDownload = async (fileId: number, fileName: string) => {
    await downloadDisputeFile(token, disputeId, fileId, fileName);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!canSend) return;
    const value = e.target.value;
    setContent(value);

    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;

    detectMention(value, textarea.selectionStart ?? value.length);

    if (!socketRef.current) return;
    socketRef.current.emit("typing:start", {
      disputeId,
      username: user?.username,
      accountId: user?.id,
    });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit("typing:stop", { disputeId, accountId: user?.id });
    }, 2500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Close mention dropdown on Escape
    if (e.key === "Escape" && mentionActive) {
      e.preventDefault();
      setMentionActive(false);
      return;
    }

    if (e.key === "Enter" && !e.shiftKey && canSend) {
      // If mention dropdown is open, don't send — let mouse selection handle it
      if (mentionActive) return;
      e.preventDefault();
      sendMessage();
      const textarea = e.currentTarget;
      setTimeout(() => {
        textarea.style.height = "auto";
        textarea.style.height = "48px";
      }, 10);
    }
  };

  const handleCursorMove = (
    e:
      | React.MouseEvent<HTMLTextAreaElement>
      | React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    const textarea = e.currentTarget;
    detectMention(
      textarea.value,
      textarea.selectionStart ?? textarea.value.length,
    );
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
      ? `${Object.values(typingUsers).join(", ")} ${Object.values(typingUsers).length === 1 ? "is" : "are"} typing...`
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

      {/* Messages */}
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

          const normalize = (u: string) => u.replace(/^@/, "").toLowerCase();
          const resolvedRole = allParticipants.find(
            (p) => normalize(p.username) === normalize(m.username),
          )?.role;

          return (
            <div
              key={m.id}
              className={`flex w-full items-start gap-2 ${isMine ? "justify-end" : "justify-start"}`}
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
                className={`max-w-[90%] rounded-2xl px-2 py-2 text-sm shadow-sm sm:px-4 ${isMine ? "card-cyan text-cyan-100" : "border border-gray-700/40 bg-[#1a1f27]/80 text-gray-200"}`}
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
                    {resolvedRole && <RoleBadge role={resolvedRole} />}
                  </div>
                  <span className="text-[10px] font-normal text-gray-400/70">
                    {formatMessageTime(m.creationDate)}
                  </span>
                </div>
                {/* Render with mention highlights */}
                <div className="break-words whitespace-pre-wrap">
                  {renderMessageContent(m.content, allParticipants)}
                </div>
                {m.files && m.files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {m.files.map((f) =>
                      isImageFile(f.mimeType) ? (
                        <ImageAttachment
                          key={f.id}
                          token={token}
                          disputeId={disputeId}
                          fileId={f.id}
                          fileName={f.fileName}
                          mimeType={f.mimeType}
                        />
                      ) : (
                        <div
                          key={f.id}
                          className="flex cursor-pointer items-center gap-1 text-xs hover:text-cyan-400"
                          onClick={() => handleDownload(f.id, f.fileName)}
                        >
                          <Download size={14} /> {f.fileName}
                        </div>
                      ),
                    )}
                  </div>
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

      {/* Input */}
      {canSend ? (
        <>
          <div className="mt-4 border-t border-cyan-800/40 pt-3">
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                {/* Mention dropdown */}
                {mentionActive && mentionQuery !== null && (
                  <MentionDropdown
                    participants={allParticipants}
                    query={mentionQuery}
                    onSelect={insertMention}
                  />
                )}

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

                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleTyping}
                  onKeyDown={handleKeyDown}
                  onClick={handleCursorMove}
                  onKeyUp={handleCursorMove}
                  placeholder="Write a message… type @ to mention a party"
                  disabled={isSending}
                  rows={1}
                  className="max-h-32 min-h-[48px] w-full resize-none rounded-xl border border-cyan-800/40 bg-[#141920] py-3 pr-20 pl-12 text-gray-100 transition-all focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none disabled:opacity-50"
                  style={{
                    overflowY: "auto",
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgba(6, 182, 212, 0.3) transparent",
                  }}
                />

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
