import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  Users,
  FileText,
  Scale,
  MessageCircle,
  Upload,
  UserCheck,
  User,
  Shield,
  X,
  ExternalLink,
  Image as ImageIcon,
  File,
  MessageSquare,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Info,
  BarChart3,
  Send,
  Trash2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { getDisputeById } from "../lib/mockDisputes";
import type { DisputeRow } from "../lib/mockDisputes";

// Simplified evidence type definitions - only images and docs
type EvidenceType = "image" | "pdf" | "transaction" | "chat" | "document";

interface EvidenceItem {
  name: string;
  type: EvidenceType;
  url: string;
  preview?: string;
}

// Voting types
interface VoteData {
  choice: "plaintiff" | "defendant" | "dismissed" | null;
  comment: string;
}

// File upload types
interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  type: "image" | "document";
}

// Mock vote outcome data
const mockVoteOutcome = {
  winner: "plaintiff" as const,
  judgeVotes: 7,
  communityVotes: 124,
  judgePct: 72,
  communityPct: 61,
  comments: [
    {
      handle: "@judgeNova",
      text: "Compelling evidence of breach of agreement.",
    },
    {
      handle: "@judgeAres",
      text: "Clear violation of terms based on the evidence provided.",
    },
  ],
};

// Reply Modal Component
// Reply Modal Component
const ReplyModal = ({
  isOpen,
  onClose,
  type,
  dispute,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  type: "plaintiff" | "defendant";
  dispute: DisputeRow | null;
  onSubmit: (
    description: string,
    files: UploadedFile[],
    witnesses: string[],
  ) => void;
}) => {
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [witnesses, setWitnesses] = useState<string[]>([]);
  const [witnessInput, setWitnessInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = [];
    console.log(newFiles);

    Array.from(selectedFiles).forEach((file) => {
      const fileType = file.type.startsWith("image/") ? "image" : "document";
      const newFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        type: fileType,
      };

      // Create preview for images
      if (fileType === "image") {
        const reader = new FileReader();
        reader.onload = (e) => {
          newFile.preview = e.target?.result as string;
          setFiles((prev) => [...prev, newFile]);
        };
        reader.readAsDataURL(file);
      } else {
        setFiles((prev) => [...prev, newFile]);
      }
    });
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const handleWitnessInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWitnessInput(e.target.value);
  };

  const addWitness = () => {
    const witness = witnessInput.trim();
    if (witness && !witnesses.includes(witness)) {
      setWitnesses((prev) => [...prev, witness]);
      setWitnessInput("");
    }
  };

  const removeWitness = (witnessToRemove: string) => {
    setWitnesses((prev) =>
      prev.filter((witness) => witness !== witnessToRemove),
    );
  };

  const handleSubmit = async () => {
    if (!description.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(description, files, witnesses);
      setDescription("");
      setFiles([]);
      setWitnesses([]);
      setWitnessInput("");
      onClose();
    } catch (error) {
      console.error("Error submitting reply:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getModalConfig = () => {
    if (type === "plaintiff") {
      return {
        title: "Reply as Plaintiff",
        icon: <User className="h-5 w-5" />,
        color: "cyan",
        placeholder:
          "Provide additional arguments or respond to the defense...",
      };
    } else {
      return {
        title: "Respond as Defendant",
        icon: <Shield className="h-5 w-5" />,
        color: "yellow",
        placeholder:
          "Respond to the plaintiff's claims and provide your defense...",
      };
    }
  };

  const config = getModalConfig();

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass card-cyan relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl"
          onClick={handleModalClick}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between border-b border-${config.color}-400/30 p-6`}
          >
            <div className="flex items-center gap-3">
              {config.icon}
              <h3 className="text-xl font-semibold text-cyan-300">
                {config.title}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/70 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Case Info */}
              <div
                className={`rounded-lg border border-${config.color}-400/20 bg-${config.color}-500/10 p-4`}
              >
                <h4 className="mb-2 font-semibold text-cyan-300">
                  {dispute?.title}
                </h4>
                <div className="text-sm text-cyan-200">
                  <span className="font-medium">{dispute?.plaintiff}</span> vs{" "}
                  <span className="font-medium">{dispute?.defendant}</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-cyan-200">
                  Your Response
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-32 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-cyan-400/40"
                  placeholder={config.placeholder}
                  rows={5}
                />
              </div>

              {/* Witnesses Section - Only for Defendant */}
              {type === "defendant" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-cyan-200">
                    Witnesses (Optional)
                  </label>

                  {/* Witness Input with Button */}
                  <div className="mb-3 flex gap-2">
                    <input
                      type="text"
                      value={witnessInput}
                      onChange={handleWitnessInputChange}
                      placeholder="Add witness handle"
                      className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-cyan-400/40"
                    />
                    <Button
                      type="button"
                      onClick={addWitness}
                      disabled={!witnessInput.trim()}
                      variant="outline"
                      className="border-yellow-400/30 text-yellow-300 hover:bg-yellow-500/10 disabled:opacity-50"
                    >
                      <UserCheck className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-cyan-200/70">
                    Add @handles of witnesses who can support your defense
                  </p>

                  {/* Witness Tags */}
                  {witnesses.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {witnesses.map((witness, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1 rounded-full bg-yellow-500/20 px-3 py-1 text-sm text-yellow-300"
                          >
                            <UserCheck className="h-3 w-3" />
                            {witness}
                            <button
                              type="button"
                              onClick={() => removeWitness(witness)}
                              className="ml-1 rounded-full hover:bg-yellow-500/30"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-cyan-200/70">
                        {witnesses.length} witness(es) added
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* File Upload */}
              <div>
                <label className="mb-3 block text-sm font-medium text-cyan-200">
                  Supporting Evidence
                </label>

                {/* File Input */}
                <div className="mb-4">
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-cyan-400/30 bg-cyan-500/5 px-4 py-6 text-sm transition-colors hover:bg-cyan-500/10"
                  >
                    <Upload className="h-5 w-5 text-cyan-400" />
                    <span className="text-cyan-300">Click to upload files</span>
                    <span className="text-cyan-200/70">
                      (Images, PDFs, Documents)
                    </span>
                  </label>
                </div>

                {/* File List */}
                {files.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-cyan-200">
                      Selected Files ({files.length})
                    </h4>
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between rounded-lg border border-cyan-400/20 bg-cyan-500/5 p-3"
                      >
                        <div className="flex items-center gap-3">
                          {file.type === "image" && file.preview ? (
                            <img
                              src={file.preview}
                              alt={file.file.name}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <FileText className="h-5 w-5 text-cyan-400" />
                          )}
                          <div>
                            <div className="text-sm font-medium text-white">
                              {file.file.name}
                            </div>
                            <div className="text-xs text-cyan-200/70">
                              {(file.file.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-cyan-200/70">
                  {files.length} file(s) selected
                  {type === "defendant" &&
                    witnesses.length > 0 &&
                    ` • ${witnesses.length} witness(es)`}
                </div>

                <Button
                  variant="neon"
                  className="neon-hover"
                  disabled={!description.trim() || isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit Response
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Vote Option Component
const VoteOption = ({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-md border px-3 py-4 text-center text-sm shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-transform hover:bg-cyan-500/20 active:scale-[0.98] ${
        active
          ? "border-cyan-400/40 bg-cyan-500/30 text-cyan-200"
          : "border-white/10 bg-white/5 hover:border-cyan-400/30"
      }`}
    >
      {icon}
      {label}
    </button>
  );
};

// Vote Modal Component
const VoteModal = ({
  isOpen,
  onClose,
  dispute,
  voteData,
  onVoteChange,
  onCastVote,
  hasVoted,
}: {
  isOpen: boolean;
  onClose: () => void;
  dispute: DisputeRow | null;
  voteData: VoteData;
  onVoteChange: (
    choice: "plaintiff" | "defendant" | "dismissed" | null,
    comment: string,
  ) => void;
  onCastVote: () => void;
  hasVoted: boolean;
}) => {
  const isJudge = true; // Mock - in real app, check user role

  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleVoteChoice = useCallback(
    (choice: "plaintiff" | "defendant" | "dismissed") => {
      onVoteChange(choice, voteData.comment);
    },
    [onVoteChange, voteData.comment],
  );

  const handleCommentChange = useCallback(
    (comment: string) => {
      if (comment.length <= 1200) {
        onVoteChange(voteData.choice, comment);
      }
    },
    [onVoteChange, voteData.choice],
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass card-cyan relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl"
          onClick={handleModalClick}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-cyan-400/30 bg-cyan-500/10 p-6">
            <div className="flex items-center gap-3">
              <Scale className="h-6 w-6 text-cyan-300" />
              <h3 className="text-xl font-semibold text-cyan-300">
                Cast Your Vote
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/70 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
            {hasVoted ? (
              <div className="py-8 text-center">
                <div className="mb-2 text-lg font-semibold text-emerald-400">
                  ✓ Vote Submitted
                </div>
                <div className="text-sm text-cyan-200">
                  Thank you for participating. Your vote will be revealed when
                  the voting period ends.
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Case Info */}
                <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-4">
                  <h4 className="mb-2 font-semibold text-cyan-300">
                    {dispute?.title}
                  </h4>
                  <div className="text-sm text-cyan-200">
                    <span className="font-medium">{dispute?.plaintiff}</span> vs{" "}
                    <span className="font-medium">{dispute?.defendant}</span>
                  </div>
                </div>

                {/* Voting Options */}
                <div>
                  <h4 className="mb-3 text-lg font-semibold tracking-wide text-cyan-200">
                    Who is your vote for?
                  </h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <VoteOption
                      label={`Plaintiff (${dispute?.plaintiff})`}
                      active={voteData.choice === "plaintiff"}
                      onClick={() => handleVoteChoice("plaintiff")}
                      icon={<ThumbsUp className="h-4 w-4" />}
                    />
                    <VoteOption
                      label={`Defendant (${dispute?.defendant})`}
                      active={voteData.choice === "defendant"}
                      onClick={() => handleVoteChoice("defendant")}
                      icon={<ThumbsDown className="h-4 w-4" />}
                    />
                    <VoteOption
                      label="Dismiss Case"
                      active={voteData.choice === "dismissed"}
                      onClick={() => handleVoteChoice("dismissed")}
                      icon={<Minus className="h-4 w-4" />}
                    />
                  </div>
                </div>

                {/* Comment Section */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Comment{" "}
                      {isJudge && <span className="text-xs">(max 1200)</span>}
                    </span>
                    {!isJudge && (
                      <span className="text-muted-foreground text-xs">
                        Only judges can comment
                      </span>
                    )}
                  </div>
                  <textarea
                    disabled={!isJudge}
                    value={voteData.comment}
                    onChange={(e) => handleCommentChange(e.target.value)}
                    className="min-h-28 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-cyan-400/40 disabled:opacity-60"
                    placeholder={
                      isJudge
                        ? "Add your reasoning..."
                        : "Comments restricted to judges"
                    }
                  />
                  {isJudge && (
                    <div className="text-muted-foreground mt-1 text-right text-xs">
                      {1200 - voteData.comment.length} characters left
                    </div>
                  )}
                </div>

                {/* Vote Button + Info */}
                <div className="flex items-center justify-between gap-3">
                  <Button
                    variant="neon"
                    className="neon-hover"
                    disabled={!voteData.choice}
                    onClick={onCastVote}
                  >
                    Cast Vote
                  </Button>
                  <div className="group relative cursor-pointer">
                    <Info className="h-4 w-4 text-cyan-300/70 transition group-hover:text-cyan-300" />
                    <div className="absolute top-full right-0 mt-2 hidden w-60 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                      Your vote remains private until the voting period ends.
                      During this time, only your participation status is
                      visible — not your decision.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Vote Outcome Modal Component
const VoteOutcomeModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const {
    winner,
    judgeVotes,
    communityVotes,
    judgePct,
    communityPct,
    comments,
  } = mockVoteOutcome;

  // Weighted Voting Logic (DexCourt 70/30 model)
  const totalVotes = judgeVotes + communityVotes;
  const judgeWeight = 0.7;
  const communityWeight = 0.3;
  const weightedPlaintiffPct =
    judgePct * judgeWeight + communityPct * communityWeight;
  const weightedDefendantPct = 100 - weightedPlaintiffPct;
  const plaintiffVotes = Math.round((totalVotes * weightedPlaintiffPct) / 100);
  const defendantVotes = totalVotes - plaintiffVotes;
  const winPct = Math.round(
    Math.max(weightedPlaintiffPct, weightedDefendantPct),
  );

  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass card-cyan relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl"
          onClick={handleModalClick}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-emerald-400/30 bg-emerald-500/10 p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-emerald-300" />
              <h3 className="text-xl font-semibold text-emerald-300">
                Vote Outcome - Case Settled
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/70 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Verdict Banner */}
              <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/20 p-6 text-center">
                <div className="mb-2 text-lg text-emerald-200">
                  Final Verdict
                </div>
                <div
                  className={`mb-2 text-2xl font-bold ${
                    winner === "plaintiff"
                      ? "text-cyan-300"
                      : winner === "defendant"
                        ? "text-pink-300"
                        : "text-yellow-300"
                  }`}
                >
                  {winner === "plaintiff"
                    ? "Plaintiff Wins"
                    : winner === "defendant"
                      ? "Defendant Wins"
                      : "Case Dismissed"}
                </div>
                <div className="text-emerald-200">
                  {winPct}% weighted majority
                </div>
              </div>

              {/* Voting Breakdown */}
              <div className="space-y-4">
                <div className="text-lg font-medium text-white/90">
                  Voting Breakdown
                </div>

                {/* Judges Section */}
                <div className="mb-4">
                  <div className="text-muted-foreground mb-2 flex items-center justify-between text-sm">
                    <span>Judges — {judgeVotes} votes</span>
                    <span>{judgePct}% favor Plaintiff</span>
                  </div>
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="absolute top-0 left-0 h-full rounded-l-full bg-cyan-800"
                      initial={{ width: 0 }}
                      animate={{ width: `${judgePct}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                    <motion.div
                      className="absolute top-0 right-0 h-full rounded-r-full bg-pink-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${100 - judgePct}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-cyan-300">
                      Plaintiff: {Math.round((judgePct / 100) * judgeVotes)}{" "}
                      votes
                    </span>
                    <span className="text-pink-300">
                      Defendant:{" "}
                      {Math.round(((100 - judgePct) / 100) * judgeVotes)} votes
                    </span>
                  </div>
                </div>

                {/* Community Section */}
                <div className="mb-4">
                  <div className="text-muted-foreground mb-2 flex items-center justify-between text-sm">
                    <span>Community — {communityVotes} votes</span>
                    <span>{communityPct}% favor Plaintiff</span>
                  </div>
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="absolute top-0 left-0 h-full rounded-l-full bg-cyan-300"
                      initial={{ width: 0 }}
                      animate={{ width: `${communityPct}%` }}
                      transition={{
                        duration: 1,
                        ease: "easeOut",
                        delay: 0.3,
                      }}
                    />
                    <motion.div
                      className="absolute top-0 right-0 h-full rounded-r-full bg-pink-300/60"
                      initial={{ width: 0 }}
                      animate={{ width: `${100 - communityPct}%` }}
                      transition={{
                        duration: 1,
                        ease: "easeOut",
                        delay: 0.3,
                      }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-cyan-300">
                      Plaintiff:{" "}
                      {Math.round((communityPct / 100) * communityVotes)} votes
                    </span>
                    <span className="text-pink-300">
                      Defendant:{" "}
                      {Math.round(
                        ((100 - communityPct) / 100) * communityVotes,
                      )}{" "}
                      votes
                    </span>
                  </div>
                </div>

                {/* Weighted Overall Section */}
                <div>
                  <div className="text-muted-foreground mb-2 flex justify-between text-sm">
                    <span>Weighted Total (70% Judges, 30% Community)</span>
                    <span>
                      {weightedPlaintiffPct.toFixed(1)}% favor Plaintiff
                    </span>
                  </div>
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="absolute top-0 left-0 h-full rounded-l-full bg-cyan-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${weightedPlaintiffPct}%` }}
                      transition={{
                        duration: 1,
                        ease: "easeOut",
                        delay: 0.5,
                      }}
                    />
                    <motion.div
                      className="absolute top-0 right-0 h-full rounded-r-full bg-pink-400/60"
                      initial={{ width: 0 }}
                      animate={{ width: `${weightedDefendantPct}%` }}
                      transition={{
                        duration: 1,
                        ease: "easeOut",
                        delay: 0.5,
                      }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-cyan-300">
                      Plaintiff: {plaintiffVotes} votes
                    </span>
                    <span className="text-pink-300">
                      Defendant: {defendantVotes} votes
                    </span>
                  </div>
                </div>
              </div>

              {/* Judges' Comments */}
              {comments.length > 0 && (
                <div>
                  <div className="mb-4 text-lg font-medium text-white/90">
                    Judges' Comments
                  </div>
                  <div className="space-y-4">
                    {comments.map((comment, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-white/10 bg-white/5 p-4"
                      >
                        <div className="text-sm font-medium text-cyan-300">
                          {comment.handle}
                        </div>
                        <div className="mt-2 text-white/80">{comment.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Evidence Viewer Component
const EvidenceViewer = ({
  isOpen,
  onClose,
  selectedEvidence,
  onPdfLoad,
  onPdfError,
  pdfLoading,
  pdfError,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedEvidence: EvidenceItem | null;
  onPdfLoad: () => void;
  onPdfError: () => void;
  pdfLoading: boolean;
  pdfError: boolean;
}) => {
  const getEvidenceIcon = (type: EvidenceType) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-4 w-4" />;
      case "pdf":
        return <FileText className="h-4 w-4" />;
      case "transaction":
        return <ExternalLink className="h-4 w-4" />;
      case "chat":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const renderEvidenceContent = () => {
    if (!selectedEvidence) return null;

    switch (selectedEvidence.type) {
      case "image":
      case "chat":
        return (
          <div className="flex h-full items-center justify-center p-4">
            <img
              src={selectedEvidence.preview}
              alt={selectedEvidence.name}
              className="max-h-full max-w-full rounded-lg border border-white/10 object-contain"
            />
          </div>
        );
      case "transaction":
        return (
          <div className="flex h-full flex-col items-center justify-center space-y-6 py-6">
            <ExternalLink className="h-16 w-16 text-cyan-400" />
            <div className="text-center">
              <h3 className="mb-2 text-lg font-semibold text-white">
                Blockchain Transaction
              </h3>
              <p className="mb-4 text-cyan-200">{selectedEvidence.name}</p>
              <img
                src={selectedEvidence.preview}
                alt="Transaction preview"
                className="mb-4 max-h-48 rounded-lg border border-white/10"
              />
              <Button
                onClick={() => window.open(selectedEvidence.url, "_blank")}
                variant="neon"
                className="neon-hover"
              >
                View on Etherscan
              </Button>
            </div>
          </div>
        );
      case "pdf":
        return (
          <div className="flex h-full flex-col items-center justify-center space-y-6 py-6">
            <div className="h-[80vh] w-full">
              {pdfLoading && (
                <div className="flex h-full flex-col items-center justify-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                  <p className="text-white/70">Loading PDF document...</p>
                </div>
              )}

              {pdfError && (
                <div className="flex h-full flex-col items-center justify-center space-y-4">
                  <FileText className="h-16 w-16 text-red-400" />
                  <div className="text-center">
                    <h3 className="mb-2 text-lg font-semibold text-white">
                      PDF Not Available
                    </h3>
                    <p className="text-red-200">
                      The PDF document could not be loaded.
                    </p>
                  </div>
                  <Button
                    onClick={() => window.open(selectedEvidence.url, "_blank")}
                    variant="neon"
                    className="neon-hover"
                  >
                    Try Opening in New Tab
                  </Button>
                </div>
              )}

              {!pdfLoading && !pdfError && (
                <object
                  data={selectedEvidence.url}
                  type="application/pdf"
                  width="100%"
                  height="100%"
                  className="rounded-xl border border-white/10"
                  onLoad={onPdfLoad}
                  onError={onPdfError}
                >
                  <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
                    <FileText className="h-16 w-16 text-yellow-400" />
                    <h3 className="text-lg font-semibold text-white">
                      PDF Not Available
                    </h3>
                    <p className="text-yellow-200">
                      The document isn't available at the moment.
                    </p>
                    <Button
                      onClick={() =>
                        window.open(selectedEvidence.url, "_blank")
                      }
                      variant="neon"
                      className="neon-hover"
                    >
                      Try Opening in New Tab
                    </Button>
                  </div>
                </object>
              )}
            </div>
          </div>
        );
      default:
        return (
          <div className="flex h-full flex-col items-center justify-center space-y-6 py-6">
            <File className="h-16 w-16 text-cyan-400" />
            <div className="text-center">
              <h3 className="mb-2 text-lg font-semibold text-white">
                Evidence File
              </h3>
              <p className="text-cyan-200">{selectedEvidence.name}</p>
            </div>
          </div>
        );
    }
  };

  if (!isOpen || !selectedEvidence) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="card-cyan relative h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl"
          onClick={handleModalClick}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-gray-800/50 p-6">
            <div className="flex items-center gap-3">
              {getEvidenceIcon(selectedEvidence.type)}
              <h3 className="text-lg font-semibold text-white">
                {selectedEvidence.name}
              </h3>
              {pdfLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/70 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="h-[calc(100%-80px)] overflow-auto p-6">
            {renderEvidenceContent()}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Evidence Display Component
const EvidenceDisplay = ({
  evidence,
  color,
  onViewEvidence,
}: {
  evidence: EvidenceItem[];
  color: string;
  onViewEvidence: (evidence: EvidenceItem) => void;
}) => {
  const [pdfLoadingStates, setPdfLoadingStates] = useState<{
    [key: string]: boolean;
  }>({});
  const [pdfErrorStates, setPdfErrorStates] = useState<{
    [key: string]: boolean;
  }>({});

  const getEvidenceIcon = (type: EvidenceType) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-4 w-4" />;
      case "pdf":
        return <FileText className="h-4 w-4" />;
      case "transaction":
        return <ExternalLink className="h-4 w-4" />;
      case "chat":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const handlePdfLoad = (index: number) => {
    setPdfLoadingStates((prev) => ({ ...prev, [index]: false }));
    setPdfErrorStates((prev) => ({ ...prev, [index]: false }));
  };

  const handlePdfError = (index: number) => {
    setPdfLoadingStates((prev) => ({ ...prev, [index]: false }));
    setPdfErrorStates((prev) => ({ ...prev, [index]: true }));
  };

  return (
    <div className="space-y-3">
      {evidence.map((item, index) => {
        // For PDFs: inline preview
        if (item.type === "pdf") {
          const isLoading = pdfLoadingStates[index] ?? true;
          const hasError = pdfErrorStates[index] ?? false;

          return (
            <div
              key={index}
              className={`relative rounded-lg border border-${color}-400/20 bg-${color}-500/5 p-4`}
            >
              <div className="mb-3 flex items-center gap-3">
                <div className={`text-${color}-400`}>
                  {getEvidenceIcon(item.type)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">
                    {item.name}
                  </div>
                  <div className="text-xs text-gray-400 capitalize">
                    PDF • Inline preview
                  </div>
                </div>
                <div className="absolute top-8 right-2 sm:top-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(item.url, "_blank");
                    }}
                    className={`h-8 w-8 p-0 text-${color}-400 hover:text-${color}-300`}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Inline PDF preview using iframe - much more reliable */}
              <div className="relative overflow-hidden rounded-lg border border-white/10 bg-black/20">
                {isLoading && !hasError && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                    <p className="ml-2 text-sm text-white/70">Loading PDF...</p>
                  </div>
                )}

                {hasError && (
                  <div className="flex h-40 flex-col items-center justify-center p-4 text-center">
                    <FileText className="mb-3 h-10 w-10 text-red-400" />
                    <p className="font-semibold text-red-300">
                      PDF Not Available
                    </p>
                    <p className="mt-1 text-sm text-red-200">
                      The document could not be loaded.
                    </p>
                    <Button
                      onClick={() => window.open(item.url, "_blank")}
                      variant="outline"
                      size="sm"
                      className="mt-2 border-red-400/30 text-red-300 hover:bg-red-500/10"
                    >
                      Try Opening Directly
                    </Button>
                  </div>
                )}
                {!hasError && (
                  <object
                    data={item.url}
                    type="application/pdf"
                    width="100%"
                    height="400"
                    onLoad={() => handlePdfLoad(index)}
                    onError={() => handlePdfError(index)}
                    className="rounded-lg"
                  >
                    <div className="flex h-40 flex-col items-center justify-center p-4 text-center">
                      <FileText className="mb-2 h-8 w-8 text-yellow-400" />
                      <p className="text-sm text-yellow-300">
                        This PDF document isn't available at the moment.
                      </p>
                      <Button
                        onClick={() => window.open(item.url, "_blank")}
                        variant="outline"
                        size="sm"
                        className="mt-2 border-yellow-400/30 text-yellow-300 hover:bg-yellow-500/10"
                      >
                        Try Opening in New Tab
                      </Button>
                    </div>
                  </object>
                )}
              </div>
            </div>
          );
        }

        // For all other evidence types
        return (
          <div
            key={index}
            className={`relative flex items-center gap-2 rounded-lg border border-${color}-400/20 bg-${color}-500/5 p-4 transition-colors hover:bg-${color}-500/10 cursor-pointer`}
            onClick={() => onViewEvidence(item)}
          >
            <div className={`text-${color}-400`}>
              {getEvidenceIcon(item.type)}
            </div>
            <div className="">
              <div className="text-sm font-medium break-all text-white">
                {item.name}
              </div>
              <div className="text-xs text-gray-400 capitalize">
                {item.type === "transaction"
                  ? "View on Etherscan"
                  : "Click to preview"}
              </div>
            </div>
            <div className="absolute top-2 right-2">
              {item.type === "transaction" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(item.url, "_blank");
                  }}
                  className={`h-8 w-8 p-0 text-${color}-400 hover:text-${color}-300`}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Main Component
export default function DisputeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dispute, setDispute] = useState<DisputeRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(
    null,
  );
  const [evidenceViewerOpen, setEvidenceViewerOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  // Voting state
  const [voteData, setVoteData] = useState<VoteData>({
    choice: null,
    comment: "",
  });
  const [hasVoted, setHasVoted] = useState(false);
  const [voteOutcomeModalOpen, setVoteOutcomeModalOpen] = useState(false);
  const [voteModalOpen, setVoteModalOpen] = useState(false);

  // Reply modals state
  const [defendantReplyModalOpen, setDefendantReplyModalOpen] = useState(false);
  const [plaintiffReplyModalOpen, setPlaintiffReplyModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    getDisputeById(id)
      .then((data) => {
        setDispute(data || null);
        // Check if user has already voted (mock implementation)
        setHasVoted(false);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const processEvidence = (evidenceList: string[]): EvidenceItem[] => {
    return evidenceList.map((evidence) => {
      const name = evidence.split("/").pop() || evidence;

      // Determine type based on file or URL
      if (evidence.includes("etherscan.io")) {
        return {
          name,
          type: "transaction",
          url: evidence,
          preview:
            "https://placehold.co/600x400/1e3a8a/white?text=Blockchain+Tx",
        };
      } else if (/\.(webp|jpg|jpeg)$/i.test(evidence)) {
        return {
          name,
          type: "image",
          url: evidence,
          preview: evidence,
        };
      } else if (evidence.endsWith(".pdf")) {
        return {
          name,
          type: "pdf",
          url: evidence,
          preview:
            "https://placehold.co/600x800/059669/white?text=PDF+Document",
        };
      } else if (evidence.match(/chat|screenshot|conversation/i)) {
        return {
          name,
          type: "chat",
          url: evidence,
          preview:
            "https://placehold.co/600x800/1f2937/white?text=Chat+Screenshot",
        };
      } else {
        return {
          name,
          type: "document",
          url: evidence,
          preview: "https://placehold.co/600x800/059669/white?text=Document",
        };
      }
    });
  };

  // Safe data access with fallbacks
  const safeEvidence = processEvidence(dispute?.evidence || []);
  const safeWitnesses = dispute?.witnesses || [];
  const safeDescription = dispute?.description || "No description provided.";
  const safeClaim = dispute?.claim || "No claim specified.";

  const defendantEvidence = dispute?.defendantResponse
    ? processEvidence(dispute.defendantResponse.evidence || [])
    : [];

  const plaintiffReplyEvidence = dispute?.plaintiffReply
    ? processEvidence(dispute.plaintiffReply.evidence || [])
    : [];

  // Function to handle evidence viewing
  const handleViewEvidence = (evidence: EvidenceItem) => {
    setSelectedEvidence(evidence);
    setEvidenceViewerOpen(true);
    setPdfLoading(evidence.type === "pdf");
    setPdfError(false);
  };

  // Function to handle PDF load events
  const handlePdfLoad = () => {
    setPdfLoading(false);
  };

  const handlePdfError = () => {
    setPdfLoading(false);
    setPdfError(true);
  };

  // Voting handlers
  const handleVoteChange = useCallback(
    (
      choice: "plaintiff" | "defendant" | "dismissed" | null,
      comment: string,
    ) => {
      setVoteData({ choice, comment });
    },
    [],
  );

  const handleCastVote = useCallback(() => {
    if (!voteData.choice) return;

    // Mock vote submission
    console.log("Voting:", voteData);
    setHasVoted(true);
    setVoteModalOpen(false);
    // In a real app, you would call an API here
  }, [voteData]);

  const handleOpenVoteModal = useCallback(() => {
    setVoteModalOpen(true);
    // Reset vote data when opening modal
    setVoteData({ choice: null, comment: "" });
  }, []);

  // Reply handlers with witnesses
  const handleDefendantReply = useCallback(
    async (description: string, files: UploadedFile[], witnesses: string[]) => {
      console.log("Defendant reply:", { description, files, witnesses });
      // In a real app, you would upload files and submit the response with witnesses
      // Mock implementation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(
        "Defendant response submitted successfully with witnesses:",
        witnesses,
      );
    },
    [],
  );

  const handlePlaintiffReply = useCallback(
    async (description: string, files: UploadedFile[], witnesses: string[]) => {
      console.log("Plaintiff reply:", { description, files, witnesses });
      // In a real app, you would upload files and submit the response
      // Mock implementation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Plaintiff reply submitted successfully");
    },
    [],
  );

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-muted-foreground">Loading dispute details...</p>
        </div>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="py-6 text-white">
        <Button
          onClick={() => navigate("/disputes")}
          variant="ghost"
          className="mb-4 flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Disputes
        </Button>
        <p className="text-red-400">Dispute not found.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 py-6 text-white"
    >
      <div className="flex items-center justify-between">
        {/* Back Button */}
        <Button
          onClick={() => navigate("/disputes")}
          variant="ghost"
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Disputes
        </Button>
        {(dispute.status === "Settled" || dispute.status === "Dismissed") && (
          <div className="">
            <Button
              variant="neon"
              className="neon-hover"
              onClick={() => setVoteOutcomeModalOpen(true)}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              See Vote Outcome
            </Button>
          </div>
        )}

        {dispute.status === "Vote in Progress" && (
          <Button
            variant="neon"
            className="neon-hover ml-auto"
            onClick={handleOpenVoteModal}
          >
            <Scale className="mr-2 h-4 w-4" />
            Cast Vote
          </Button>
        )}
      </div>
      {/* Header Card */}
      <div className="max-w-xl rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="mb-2 font-bold text-cyan-400 lg:text-[22px]">
              {dispute.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-cyan-300">
                <Clock className="h-4 w-4" />
                <span>{new Date(dispute.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-300">
                <FileText className="h-4 w-4" />
                <span>{dispute.request}</span>
              </div>
              <div className="flex items-center gap-2 text-yellow-300">
                <Scale className="h-4 w-4" />
                <span>{dispute.status}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-center gap-2 text-sm text-white/70">
              <Users className="h-4 w-4" />
              <span>Parties</span>
            </div>
            <div className="mt-1 flex flex-col items-center gap-2 text-sm text-cyan-300">
              <span>{dispute.plaintiff}</span> vs
              <span className="text-yellow-300">{dispute.defendant}</span>
            </div>
          </div>
        </div>
      </div>
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Plaintiff Column */}
        <div className="space-y-6">
          {/* Plaintiff Header */}
          <motion.div
            initial={{ x: -100 }}
            animate={{ x: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 12,
              bounce: 0.4,
              duration: 1.2,
            }}
            className="ml-auto flex w-fit items-center gap-3 rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-4"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/20">
              <User className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-cyan-400">Plaintiff</h2>
              <p className="text-sm text-cyan-300">{dispute.plaintiff}</p>
            </div>
          </motion.div>

          {/* Initial Claim */}
          <div className="space-y-4">
            <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-cyan-300">
                <MessageCircle className="h-4 w-4" />
                Initial Complaint
                <span className="text-muted-foreground ml-auto text-xs">
                  {new Date(dispute.createdAt).toLocaleDateString()}
                </span>
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="mb-2 text-sm font-medium text-cyan-200">
                    Description
                  </h4>
                  <p className="text-sm leading-relaxed text-cyan-100">
                    {safeDescription}
                  </p>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-medium text-green-400">
                    Formal Claim
                  </h4>
                  <p className="text-sm leading-relaxed text-cyan-100">
                    {safeClaim}
                  </p>
                </div>
              </div>
            </div>

            {/* Evidence */}
            {safeEvidence.length > 0 && (
              <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-cyan-300">
                  <Upload className="h-4 w-4" />
                  Supporting Evidence ({safeEvidence.length})
                </h3>
                <EvidenceDisplay
                  evidence={safeEvidence}
                  color="cyan"
                  onViewEvidence={handleViewEvidence}
                />
              </div>
            )}

            {/* Witnesses */}
            {safeWitnesses.length > 0 && (
              <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-cyan-300">
                  <UserCheck className="h-4 w-4" />
                  Witnesses ({safeWitnesses.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {safeWitnesses.map((witness, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-cyan-500/20 px-3 py-1 text-sm text-cyan-300"
                    >
                      {witness}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Plaintiff Reply */}
            {dispute.plaintiffReply && (
              <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-red-300">
                  <MessageCircle className="h-4 w-4" />
                  Reply to Defense
                  <span className="text-muted-foreground ml-auto text-xs">
                    {new Date(
                      dispute.plaintiffReply.createdAt,
                    ).toLocaleDateString()}
                  </span>
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-red-100">
                  {dispute.plaintiffReply.description}
                </p>
                {plaintiffReplyEvidence.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-red-200">
                      Additional Evidence
                    </h4>
                    <EvidenceDisplay
                      evidence={plaintiffReplyEvidence}
                      color="red"
                      onViewEvidence={handleViewEvidence}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Defendant Column */}
        <div className="space-y-6">
          {/* Defendant Header */}
          <motion.div
            initial={{ x: 100 }}
            animate={{ x: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 12,
              bounce: 0.4,
              duration: 1.2,
              delay: 0.1, // small delay for a natural clash feel
            }}
            className="flex w-fit items-center gap-3 rounded-lg border border-yellow-400/30 bg-yellow-500/10 p-4"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-yellow-400/30 bg-yellow-500/20">
              <Shield className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-yellow-400">Defendant</h2>
              <p className="text-sm text-yellow-300">{dispute.defendant}</p>
            </div>
          </motion.div>

          {/* Defendant Response */}
          {dispute.defendantResponse ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-yellow-400/20 bg-yellow-500/10 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-yellow-300">
                  <MessageCircle className="h-4 w-4" />
                  Response to Claims
                  <span className="text-muted-foreground ml-auto text-xs">
                    {new Date(
                      dispute.defendantResponse.createdAt,
                    ).toLocaleDateString()}
                  </span>
                </h3>
                <p className="text-sm leading-relaxed text-yellow-100">
                  {dispute.defendantResponse.description}
                </p>
              </div>

              {/* Defendant's Evidence */}
              {defendantEvidence.length > 0 && (
                <div className="rounded-lg border border-yellow-400/20 bg-yellow-500/10 p-4">
                  <h3 className="mb-3 flex items-center gap-2 font-semibold text-yellow-300">
                    <Upload className="h-4 w-4" />
                    Defense Evidence ({defendantEvidence.length})
                  </h3>
                  <EvidenceDisplay
                    evidence={defendantEvidence}
                    color="yellow"
                    onViewEvidence={handleViewEvidence}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-yellow-400/30 bg-yellow-500/5 p-8 text-center">
              <Shield className="mx-auto mb-3 h-8 w-8 text-yellow-400/50" />
              <h3 className="mb-2 text-lg font-semibold text-yellow-300">
                Awaiting Response
              </h3>
              <p className="mb-4 text-sm text-yellow-200/70">
                The defendant has not yet responded to the claims.
              </p>
              <Button
                variant="outline"
                className="border-yellow-400/30 text-yellow-300 hover:bg-yellow-500/10"
                onClick={() => setDefendantReplyModalOpen(true)}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Respond as Defendant
              </Button>
            </div>
          )}
        </div>
      </div>
      {/* Action Buttons */}
      {/* Action Buttons */}
      <div className="flex gap-3 border-t border-white/10 pt-6">
        {!dispute.defendantResponse && (
          <Button
            variant="outline"
            className="border-yellow-400/30 text-yellow-300 hover:bg-yellow-500/10"
            onClick={() => setDefendantReplyModalOpen(true)}
          >
            <Shield className="mr-2 h-4 w-4" />
            Respond as Defendant
          </Button>
        )}
        {dispute.defendantResponse && !dispute.plaintiffReply && (
          <Button
            variant="outline"
            className="border-red-400/30 text-red-300 hover:bg-red-500/10"
            onClick={() => setPlaintiffReplyModalOpen(true)}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Reply as Plaintiff
          </Button>
        )}

        {/* Show See Vote Outcome button for settled OR dismissed disputes */}
        {(dispute.status === "Settled" || dispute.status === "Dismissed") && (
          <Button
            variant="neon"
            className="neon-hover ml-auto"
            onClick={() => setVoteOutcomeModalOpen(true)}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            See Vote Outcome
          </Button>
        )}

        {/* Show Cast Vote button ONLY for Vote in Progress disputes */}
        {dispute.status === "Vote in Progress" && (
          <Button
            variant="neon"
            className="neon-hover ml-auto"
            onClick={handleOpenVoteModal}
          >
            <Scale className="mr-2 h-4 w-4" />
            Cast Vote
          </Button>
        )}
      </div>
      {/* Evidence Viewer Modal */}
      <EvidenceViewer
        isOpen={evidenceViewerOpen}
        onClose={() => {
          setEvidenceViewerOpen(false);
          setPdfLoading(false);
          setPdfError(false);
        }}
        selectedEvidence={selectedEvidence}
        onPdfLoad={handlePdfLoad}
        onPdfError={handlePdfError}
        pdfLoading={pdfLoading}
        pdfError={pdfError}
      />
      {/* Vote Outcome Modal */}
      <VoteOutcomeModal
        isOpen={voteOutcomeModalOpen}
        onClose={() => setVoteOutcomeModalOpen(false)}
      />
      {/* Vote Modal */}
      <VoteModal
        isOpen={voteModalOpen}
        onClose={() => setVoteModalOpen(false)}
        dispute={dispute}
        voteData={voteData}
        onVoteChange={handleVoteChange}
        onCastVote={handleCastVote}
        hasVoted={hasVoted}
      />
      {/* Defendant Reply Modal */}
      <ReplyModal
        isOpen={defendantReplyModalOpen}
        onClose={() => setDefendantReplyModalOpen(false)}
        type="defendant"
        dispute={dispute}
        onSubmit={handleDefendantReply}
      />
      {/* Plaintiff Reply Modal */}
      <ReplyModal
        isOpen={plaintiffReplyModalOpen}
        onClose={() => setPlaintiffReplyModalOpen(false)}
        type="plaintiff"
        dispute={dispute}
        onSubmit={handlePlaintiffReply}
      />
    </motion.div>
  );
}
