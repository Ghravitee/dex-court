// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { useState, useRef, useEffect, useCallback, useMemo } from "react";
// import { Button } from "../components/ui/button";
// import {
//   Search,
//   Upload,
//   Paperclip,
//   Trash2,
//   Loader2,
//   Users,
//   Scale,
//   Info,
//   ChevronRight,
//   X,
//   Wallet,
//   CheckCircle2,
//   AlertCircle,
// } from "lucide-react";
// import { toast } from "sonner";
// import { disputeService } from "../services/disputeServices";
// import { DisputeTypeEnum } from "../types";
// import type { UploadedFile } from "../types";
// import { UserAvatar } from "../components/UserAvatar";
// import {
//   cleanTelegramUsername,
//   getCurrentUserTelegram,
//   isValidTelegramUsername,
// } from "../lib/usernameUtils";
// import { useAuth } from "../hooks/useAuth";
// import { motion, AnimatePresence } from "framer-motion";
// import { VOTING_ABI, VOTING_CA } from "../web3/config";
// import { useNetworkEnvironment } from "../config/useNetworkEnvironment";
// import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";

// const getTotalFileSize = (files: UploadedFile[]): string => {
//   const totalBytes = files.reduce((total, file) => total + file.file.size, 0);
//   const mb = totalBytes / 1024 / 1024;
//   return `${mb.toFixed(2)} MB`;
// };

// // Add debounce hook at the top
// const useDebounce = (value: string, delay: number) => {
//   const [debouncedValue, setDebouncedValue] = useState(value);

//   useEffect(() => {
//     const handler = setTimeout(() => {
//       setDebouncedValue(value);
//     }, delay);

//     return () => {
//       clearTimeout(handler);
//     };
//   }, [value, delay]);

//   return debouncedValue;
// };

// const isSecondRejection = (agreement: any): boolean => {
//   if (!agreement?.timeline) return false;

//   const rejectionEvents = agreement.timeline.filter(
//     (event: any) => event.eventType === 6, // DELIVERY_REJECTED = 6
//   );

//   return rejectionEvents.length >= 2;
// };

// const isWalletAddress = (value: string) => /^0x[a-fA-F0-9]{40}$/.test(value);

// interface OpenDisputeModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   agreement: any;
//   onDisputeCreated: () => void;
// }

// // User Search Result Component
// const UserSearchResult = ({
//   user,
//   onSelect,

// }: {
//   user: any;
//   onSelect: (username: string) => void;
//   field: "defendant" | "witness";
// }) => {
//   const { user: currentUser } = useAuth();

//   const telegramUsername = cleanTelegramUsername(
//     user.telegramUsername || user.telegram?.username || user.telegramInfo,
//   );

//   if (!telegramUsername) {
//     return null;
//   }

//   const displayUsername = telegramUsername ? `@${telegramUsername}` : "Unknown";
//   const displayName = user.displayName || displayUsername;
//   const isCurrentUser = user.id === currentUser?.id;

//   return (
//     <div
//       onClick={() => onSelect(telegramUsername)}
//       className={`glass card-cyan flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:opacity-60 ${
//         isCurrentUser ? "opacity-80" : ""
//       }`}
//     >
//       <UserAvatar
//         userId={user.id}
//         avatarId={user.avatarId || user.avatar?.id}
//         username={telegramUsername}
//         size="sm"
//       />
//       <div className="min-w-0 flex-1">
//         <div className="truncate text-sm font-medium text-white">
//           {displayName}
//         </div>
//         {telegramUsername && (
//           <div className="truncate text-xs text-cyan-300">
//             @{telegramUsername}
//           </div>
//         )}
//         {user.bio && (
//           <div className="mt-1 truncate text-xs text-cyan-200/70">
//             {user.bio}
//           </div>
//         )}
//       </div>
//       <ChevronRight className="h-4 w-4 flex-shrink-0 text-cyan-400" />
//     </div>
//   );
// };

// // Transaction Status Component
// const TransactionStatus = ({
//   status,
//   onRetry,
// }: {
//   status: "idle" | "pending" | "success" | "error";
//   onRetry?: () => void;
// }) => {
//   if (status === "idle") return null;

//   const configs = {
//     pending: {
//       icon: Loader2,
//       text: "Processing transaction...",
//       className: "text-yellow-400",
//       iconClassName: "animate-spin",
//     },
//     success: {
//       icon: CheckCircle2,
//       text: "Transaction confirmed!",
//       className: "text-green-400",
//       iconClassName: "",
//     },
//     error: {
//       icon: AlertCircle,
//       text: "Transaction failed",
//       className: "text-red-400",
//       iconClassName: "",
//     },
//   };

//   const config = configs[status];
//   const Icon = config.icon;

//   return (
//     <div
//       className={`rounded-lg border p-3 ${config.className} border-current/20 bg-current/5`}
//     >
//       <div className="flex items-center gap-2">
//         <Icon className={`h-5 w-5 ${config.iconClassName}`} />
//         <span className="text-sm font-medium">{config.text}</span>
//         {status === "error" && onRetry && (
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={onRetry}
//             className="ml-auto border-current text-current hover:bg-current/10"
//           >
//             Retry
//           </Button>
//         )}
//       </div>
//     </div>
//   );
// };

// export default function OpenDisputeModal({
//   isOpen,
//   onClose,
//   agreement,
//   onDisputeCreated,
// }: OpenDisputeModalProps) {
//   const { user: currentUser } = useAuth();
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const networkInfo = useNetworkEnvironment();
//   const [form, setForm] = useState({
//     title: "",
//     kind: "Pro Bono" as "Pro Bono" | "Paid",
//     defendant: "",
//     description: "",
//     claim: "",
//     evidence: [] as UploadedFile[],
//     witnesses: [""] as string[],
//   });

//   // Search states for witnesses
//   const [witnessSearchQuery, setWitnessSearchQuery] = useState("");
//   const [witnessSearchResults, setWitnessSearchResults] = useState<any[]>([]);
//   const [isWitnessSearchLoading, setIsWitnessSearchLoading] = useState(false);
//   const [showWitnessSuggestions, setShowWitnessSuggestions] = useState(false);
//   const [activeWitnessIndex, setActiveWitnessIndex] = useState<number>(0);

//   // File upload state
//   const [isDragOver, setIsDragOver] = useState(false);

//   // Transaction state
//   const [transactionStep, setTransactionStep] = useState<
//     "idle" | "pending" | "success" | "error"
//   >("idle");
//   const [isProcessingPaidDispute, setIsProcessingPaidDispute] = useState(false);

//   // Add this ref to track if form has been initialized
//   const hasInitialized = useRef(false);

//   // Wagmi hooks for smart contract interaction
//   const {
//     data: hash,
//     writeContract,
//     isPending: isWritePending,
//     error: writeError,
//     reset: resetWrite,
//   } = useWriteContract();

//   const {
//     isSuccess: isTransactionSuccess,
//     isError: isTransactionError,
//     isLoading: isConfirming,
//   } = useWaitForTransactionReceipt({
//     hash,
//   });

//   // Generate random voting ID
//   const votingIdToUse = useMemo(() => {
//     const array = new Uint32Array(1);
//     crypto.getRandomValues(array);
//     // Generate a 6-digit number (100000 - 999999)
//     return 100000 + (array[0] % 900000);
//   }, []);

//   // Initialize form from agreement
//   useEffect(() => {
//     if (isOpen && agreement && !hasInitialized.current) {
//       // Determine who the defendant should be (the other party)
//       const isFirstParty =
//         agreement._raw?.firstParty?.username === currentUser?.username;
//       const defendant = isFirstParty
//         ? agreement.counterparty
//         : agreement.createdBy;

//       // Check if this is from a second rejection
//       const isFromSecondRejection = isSecondRejection(agreement._raw);

//       let title = `Dispute from Agreement: ${agreement.title}`;
//       let description = `This dispute originates from agreement "${agreement.title}".\n\nOriginal Agreement Description:\n${agreement.description}\n\nDispute Details: `;

//       if (isFromSecondRejection) {
//         title = `Dispute: ${agreement.title} - Second Delivery Rejection`;
//         description = `This dispute was automatically triggered after the second rejection of delivery for agreement "${agreement.title}".\n\nOriginal Agreement Description:\n${agreement.description}\n\nDispute Details: The delivery has been rejected twice, indicating unresolved issues with the work performed.`;
//       }

//       // Pre-fill form with agreement data
//       setForm({
//         title,
//         kind: "Pro Bono",
//         defendant: defendant || "",
//         description,
//         claim: "",
//         evidence: [],
//         witnesses: [""],
//       });

//       // Mark as initialized
//       hasInitialized.current = true;
//     }
//   }, [isOpen, agreement, currentUser]);

//   // Reset the initialized flag when modal closes
//   useEffect(() => {
//     if (!isOpen) {
//       hasInitialized.current = false;
//       setTransactionStep("idle");
//       setIsProcessingPaidDispute(false);
//       resetWrite();
//     }
//   }, [isOpen, resetWrite]);

//   const handleWitnessSearch = useCallback(
//     async (query: string) => {
//       // Remove @ symbol from query for searching
//       const cleanQuery = query.startsWith("@") ? query.substring(1) : query;

//       if (cleanQuery.length < 2) {
//         setWitnessSearchResults([]);
//         setShowWitnessSuggestions(false);
//         return;
//       }

//       setIsWitnessSearchLoading(true);
//       setShowWitnessSuggestions(true);

//       try {
//         // Search with the cleaned query (without @)
//         const results = await disputeService.searchUsers(cleanQuery);

//         const currentUserTelegram = getCurrentUserTelegram(currentUser);
//         const filteredResults = results.filter((resultUser) => {
//           const resultTelegram = cleanTelegramUsername(
//             resultUser.telegramUsername ||
//               resultUser.telegram?.username ||
//               resultUser.telegramInfo,
//           );

//           return (
//             resultTelegram &&
//             resultTelegram.toLowerCase() !== currentUserTelegram.toLowerCase()
//           );
//         });

//         setWitnessSearchResults(filteredResults);
//       } catch (error) {
//         console.error("Witness search failed:", error);
//         setWitnessSearchResults([]);
//       } finally {
//         setIsWitnessSearchLoading(false);
//       }
//     },
//     [currentUser],
//   );

//   const debouncedWitnessQuery = useDebounce(witnessSearchQuery, 300);

//   useEffect(() => {
//     if (debouncedWitnessQuery.length >= 2) {
//       handleWitnessSearch(debouncedWitnessQuery);
//     } else {
//       setWitnessSearchResults([]);
//       setShowWitnessSuggestions(false);
//     }
//   }, [debouncedWitnessQuery, handleWitnessSearch]);

//   // Handle witness selection
//   const handleWitnessSelect = (username: string, index: number) => {
//     // Display with @ symbol, but store without it
//     updateWitness(index, `@${username}`);
//     setShowWitnessSuggestions(false);
//     setWitnessSearchQuery("");
//   };

//   const handleWitnessInputChange = (index: number, value: string) => {
//     updateWitness(index, value);
//     setWitnessSearchQuery(value);
//   };

//   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const selectedFiles = e.target.files;
//     if (!selectedFiles) return;

//     const newFiles: UploadedFile[] = [];

//     Array.from(selectedFiles).forEach((file) => {
//       const fileSizeMB = file.size / 1024 / 1024;
//       const fileType = file.type.startsWith("image/") ? "image" : "document";

//       // Apply file size limits based on file type
//       if (fileType === "image" && fileSizeMB > 2) {
//         toast.error(
//           `Image "${file.name}" exceeds 2MB limit (${fileSizeMB.toFixed(2)}MB)`,
//         );
//         return;
//       }

//       if (fileType === "document" && fileSizeMB > 3) {
//         toast.error(
//           `Document "${file.name}" exceeds 3MB limit (${fileSizeMB.toFixed(2)}MB)`,
//         );
//         return;
//       }

//       const fileSize = fileSizeMB.toFixed(2) + " MB";
//       const newFile: UploadedFile = {
//         id: Math.random().toString(36).substr(2, 9),
//         file,
//         type: fileType,
//         size: fileSize,
//       };

//       newFiles.push(newFile);

//       // Create preview for images
//       if (fileType === "image") {
//         const reader = new FileReader();
//         reader.onload = (e) => {
//           newFile.preview = e.target?.result as string;
//           // Update the specific file with preview
//           setForm((prev) => ({
//             ...prev,
//             evidence: prev.evidence.map((f) =>
//               f.id === newFile.id ? { ...f, preview: newFile.preview } : f,
//             ),
//           }));
//         };
//         reader.readAsDataURL(file);
//       }
//     });

//     // Add all files to evidence immediately
//     setForm((prev) => ({
//       ...prev,
//       evidence: [...prev.evidence, ...newFiles],
//     }));
//   };

//   const removeFile = (id: string) => {
//     setForm((prev) => ({
//       ...prev,
//       evidence: prev.evidence.filter((file) => file.id !== id),
//     }));
//   };

//   // Drag and drop handlers
//   const handleDragOver = (e: React.DragEvent) => {
//     e.preventDefault();
//     setIsDragOver(true);
//   };

//   const handleDragLeave = (e: React.DragEvent) => {
//     e.preventDefault();
//     setIsDragOver(false);
//   };

//   const handleDrop = (e: React.DragEvent) => {
//     e.preventDefault();
//     setIsDragOver(false);

//     const droppedFiles = e.dataTransfer.files;
//     if (!droppedFiles) return;

//     const input = document.createElement("input");
//     input.type = "file";
//     input.multiple = true;
//     input.accept = "image/*,.pdf,.doc,.docx,.txt";
//     const dataTransfer = new DataTransfer();
//     Array.from(droppedFiles).forEach((file) => dataTransfer.items.add(file));
//     input.files = dataTransfer.files;

//     const event = new Event("change", { bubbles: true });
//     input.dispatchEvent(event);

//     handleFileSelect({
//       target: { files: dataTransfer.files },
//     } as React.ChangeEvent<HTMLInputElement>);
//   };

//   // Witness management
//   const addWitness = () => {
//     if (form.witnesses.length < 5) {
//       setForm((prev) => ({
//         ...prev,
//         witnesses: [...prev.witnesses, ""],
//       }));
//     }
//   };

//   const updateWitness = (index: number, value: string) => {
//     setForm((prev) => ({
//       ...prev,
//       witnesses: prev.witnesses.map((w, i) => (i === index ? value : w)),
//     }));
//   };

//   const removeWitness = (index: number) => {
//     setForm((prev) => ({
//       ...prev,
//       witnesses: prev.witnesses.filter((_, i) => i !== index),
//     }));
//   };

//   // Smart contract interaction for paid disputes
//   const createDisputeOnchain = async (): Promise<void> => {
//     try {
//       const contractAddress = VOTING_CA[networkInfo.chainId as number];

//       if (!contractAddress) {
//         throw new Error(
//           `No contract address found for chain ID ${networkInfo.chainId}`,
//         );
//       }

//       writeContract({
//         address: contractAddress,
//         abi: VOTING_ABI.abi,
//         functionName: "raiseDispute",
//         args: [BigInt(votingIdToUse), false],
//       });
//     } catch (error: any) {
//       console.error("Smart contract interaction failed:", error);
//       toast.error("Failed to initiate smart contract transaction", {
//         description:
//           error.message || "Please check your wallet connection and try again.",
//       });
//       setTransactionStep("error");
//       setIsProcessingPaidDispute(false);
//     }
//   };

//   // Create dispute in backend (used for BOTH Pro Bono AND Paid)
//   const createDisputeOffchain = async () => {
//     setIsSubmitting(true);

//     try {
//       console.log("🚀 Creating dispute from agreement...");

//       const cleanedDefendant = isWalletAddress(form.defendant)
//         ? form.defendant
//         : cleanTelegramUsername(form.defendant);

//       // Clean witness usernames - remove @ symbol before sending
//       const cleanedWitnesses = form.witnesses
//         .filter((w) => w.trim())
//         .map((w) => {
//           // Remove @ symbol if present
//           const cleanW = w.startsWith("@") ? w.substring(1) : w;
//           return cleanTelegramUsername(cleanW);
//         });

//       const requestKind =
//         form.kind === "Pro Bono"
//           ? DisputeTypeEnum.ProBono
//           : DisputeTypeEnum.Paid;

//       const files = form.evidence.map((uf) => uf.file);

//       // Create the dispute with ALL data for BOTH types
//       const result = await disputeService.createDisputeFromAgreement(
//         parseInt(agreement.id),
//         {
//           title: form.title,
//           description: form.description,
//           requestKind,
//           defendant: cleanedDefendant,
//           claim: form.claim,
//           witnesses: cleanedWitnesses,
//           // Add on-chain data ONLY for paid disputes
//           ...(form.kind === "Paid" && {
//             onchainVotingId: votingIdToUse,
//             transactionHash: hash,
//             chainId: networkInfo.chainId,
//           }),
//         },
//         files,
//       );

//       console.log("✅ Dispute created from agreement:", result);

//       if (form.kind === "Paid") {
//         toast.success("Paid dispute created successfully!", {
//           description: `${form.title} has been recorded on-chain and in our system`,
//         });
//       } else {
//         toast.success("Pro Bono dispute created successfully!", {
//           description: `${form.title} has been submitted for review`,
//         });
//       }

//       // Reset form and close modal
//       resetFormAndClose();
//     } catch (error: any) {
//       console.error("❌ Dispute creation failed:", error);

//       // Enhanced error handling with specific messages
//       const errorMessage = error.message || "Failed to submit dispute";

//       // Check for specific error messages from the service
//       if (
//         errorMessage.includes("File too large") ||
//         errorMessage.includes("exceeds server limits")
//       ) {
//         toast.error("File Size Limit Exceeded", {
//           description:
//             "The total size of your files is too large for the server. Please:\n1. Upload fewer files\n2. Compress images before uploading\n3. Remove large documents\n4. Try with files under 5MB each",
//           duration: 10000,
//         });
//       } else if (errorMessage.includes("CORS_ERROR")) {
//         toast.error("Connection Security Issue", {
//           description:
//             "Unable to connect due to browser security restrictions.",
//           duration: 10000,
//         });
//       } else if (errorMessage.includes("Request timeout")) {
//         toast.error("Upload Timeout", {
//           description:
//             "The upload is taking too long. This may be due to:\n1. Large file sizes\n2. Slow internet connection\n3. Server is busy\n\nPlease try with smaller files or try again later.",
//           duration: 8000,
//         });
//       } else if (
//         errorMessage.includes("Missing required") ||
//         errorMessage.includes("invalid")
//       ) {
//         toast.error("Validation Error", {
//           description: errorMessage,
//           duration: 6000,
//         });
//       } else {
//         toast.error("Submission Failed", {
//           description: errorMessage,
//           duration: 6000,
//         });
//       }

//       // Reset transaction state on error
//       setTransactionStep("idle");
//       setIsProcessingPaidDispute(false);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Helper function to reset and close
//   const resetFormAndClose = () => {
//     setForm({
//       title: "",
//       kind: "Pro Bono",
//       defendant: "",
//       description: "",
//       claim: "",
//       evidence: [],
//       witnesses: [""],
//     });
//     setTransactionStep("idle");
//     setIsProcessingPaidDispute(false);
//     resetWrite();
//     onDisputeCreated();
//     onClose();
//   };

//   // Main form submission handler
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     // Form validation
//     if (!form.title.trim()) {
//       toast.error("Please enter a title");
//       return;
//     }
//     if (!form.defendant.trim()) {
//       toast.error("Defendant information is required");
//       return;
//     }
//     if (!form.description.trim()) {
//       toast.error("Please enter a description");
//       return;
//     }
//     if (!form.claim.trim()) {
//       toast.error("Please enter your claim");
//       return;
//     }

//     const defendant = form.defendant.trim();
//     if (!isValidTelegramUsername(defendant) && !isWalletAddress(defendant)) {
//       toast.error(
//         "Defendant must be a valid Telegram username or wallet address",
//       );
//       return;
//     }

//     // Validate witness Telegram usernames
//     const invalidWitnesses = form.witnesses
//       .filter((w) => w.trim())
//       .map((w) => (w.startsWith("@") ? w.substring(1) : w))
//       .filter((w) => !isValidTelegramUsername(w));

//     if (invalidWitnesses.length > 0) {
//       toast.error("Please enter valid Telegram usernames for all witnesses");
//       return;
//     }

//     // Validate file sizes and types
//     const maxFileSize = 10 * 1024 * 1024;
//     const allowedImageTypes = [
//       "image/jpeg",
//       "image/jpg",
//       "image/png",
//       "image/gif",
//       "image/webp",
//     ];
//     const allowedDocumentTypes = [
//       "application/pdf",
//       "application/msword",
//       "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//       "text/plain",
//     ];

//     // Calculate total file size
//     const totalSize = form.evidence.reduce(
//       (total, file) => total + file.file.size,
//       0,
//     );
//     const maxTotalSize = 50 * 1024 * 1024;

//     if (totalSize > maxTotalSize) {
//       toast.error("Total file size too large", {
//         description: `Total file size is ${(totalSize / 1024 / 1024).toFixed(2)}MB. Maximum total size is 50MB.`,
//         duration: 8000,
//       });
//       return;
//     }

//     for (const file of form.evidence) {
//       if (file.file.size > maxFileSize) {
//         toast.error(`File ${file.file.name} exceeds 10MB size limit`);
//         return;
//       }

//       const fileType = file.file.type;
//       if (
//         !allowedImageTypes.includes(fileType) &&
//         !allowedDocumentTypes.includes(fileType)
//       ) {
//         toast.error(
//           `File ${file.file.name} has unsupported type. Allowed: images, PDFs, Word docs, text files`,
//         );
//         return;
//       }
//     }

//     // Handle based on dispute type
//     if (form.kind === "Paid") {
//       // For paid disputes, FIRST call smart contract
//       setIsProcessingPaidDispute(true);
//       await createDisputeOnchain();
//     } else {
//       // For pro bono disputes, create directly
//       await createDisputeOffchain();
//     }
//   };

//   // Retry transaction function
//   const retryTransaction = () => {
//     setTransactionStep("idle");
//     resetWrite();
//     if (form.kind === "Paid") {
//       createDisputeOnchain();
//     }
//   };

//     // Handle transaction status changes
//   useEffect(() => {
//     if (isWritePending) {
//       setTransactionStep("pending");
//     } else if (isTransactionSuccess && isProcessingPaidDispute) {
//       setTransactionStep("success");
//       // After transaction success, create the dispute in backend
//       createDisputeOffchain();
//     } else if (writeError || isTransactionError) {
//       setTransactionStep("error");
//       setIsProcessingPaidDispute(false);
//     }
//   }, [
//     isWritePending,
//     isTransactionSuccess,
//     writeError,
//     isTransactionError,
//     isProcessingPaidDispute,
//     createDisputeOffchain,
//   ]);

//   // Separate click outside handling
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       const witnessSearchElement = document.querySelector(
//         "[data-witness-search]",
//       );
//       if (
//         witnessSearchElement &&
//         !witnessSearchElement.contains(event.target as Node)
//       ) {
//         setShowWitnessSuggestions(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const handleModalClick = useCallback((e: React.MouseEvent) => {
//     e.stopPropagation();
//   }, []);

//   if (!isOpen) return null;

//   return (
//     <AnimatePresence mode="wait">
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//         className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
//         onClick={onClose}
//       >
//         <motion.div
//           initial={{ scale: 0.9, opacity: 0 }}
//           animate={{ scale: 1, opacity: 1 }}
//           exit={{ scale: 0.9, opacity: 0 }}
//           className="glass card-cyan relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl"
//           onClick={handleModalClick}
//         >
//           {/* Header */}
//           <div className="flex items-center justify-between border-b border-cyan-400/30 bg-cyan-500/10 p-6">
//             <div className="flex items-center gap-3">
//               <Scale className="h-6 w-6 text-cyan-300" />
//               <h3 className="text-xl font-semibold text-cyan-300">
//                 Open Dispute from Agreement
//               </h3>
//             </div>
//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={onClose}
//               className="text-white/70 hover:text-white"
//               disabled={
//                 isSubmitting ||
//                 transactionStep === "pending" ||
//                 isProcessingPaidDispute
//               }
//             >
//               <X className="h-5 w-5" />
//             </Button>
//           </div>

//           {/* Content */}
//           <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
//             <div className="mb-4 rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-4">
//               <p className="text-sm text-cyan-200">
//                 Creating dispute from: <strong>{agreement?.title}</strong>
//               </p>
//             </div>

//             {/* Transaction Status Display */}
//             {transactionStep !== "idle" && (
//               <div className="mb-4">
//                 <TransactionStatus
//                   status={transactionStep}
//                   onRetry={retryTransaction}
//                 />
//               </div>
//             )}

//             <form onSubmit={handleSubmit} className="space-y-6">
//               {/* Title */}
//               <div>
//                 <div className="mb-2 flex items-center justify-between">
//                   <label className="text-sm font-medium text-cyan-200">
//                     Title <span className="text-red-500">*</span>
//                   </label>
//                   <div className="group relative cursor-help">
//                     <Info className="h-4 w-4 text-cyan-300" />
//                     <div className="absolute top-full right-0 mt-2 hidden w-52 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
//                       The title has been pre-filled from the agreement. You can
//                       modify it as needed.
//                     </div>
//                   </div>
//                 </div>
//                 <input
//                   value={form.title}
//                   onChange={(e) => setForm({ ...form, title: e.target.value })}
//                   className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-cyan-400/40"
//                   placeholder="Dispute title..."
//                   required
//                   disabled={
//                     isSubmitting ||
//                     transactionStep === "pending" ||
//                     isProcessingPaidDispute
//                   }
//                 />
//               </div>

//               {/* Request Kind */}
//               <div>
//                 <div className="mb-2 flex items-center justify-between">
//                   <label className="text-sm font-medium text-cyan-200">
//                     Request Kind <span className="text-red-500">*</span>
//                   </label>
//                   <div className="flex items-center gap-3 text-xs">
//                     <div className="group relative cursor-pointer">
//                       <span className="cursor-help rounded border border-white/10 bg-white/5 px-2 py-0.5">
//                         Pro Bono
//                       </span>
//                       <div className="absolute top-full right-0 mt-2 hidden w-52 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
//                         No payment required. Judges will handle your case pro
//                         bono when available.
//                       </div>
//                     </div>
//                     <div className="group relative cursor-pointer">
//                       <span className="cursor-help rounded border border-white/10 bg-white/5 px-2 py-0.5">
//                         Paid
//                       </span>
//                       <div className="absolute top-full right-0 mt-2 hidden w-52 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
//                         A fee is required to initiate your dispute. This fee
//                         helps prioritize your case and notifies all judges to
//                         begin reviewing it immediately.
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="grid grid-cols-2 gap-3">
//                   {(["Pro Bono", "Paid"] as const).map((kind) => (
//                     <label
//                       key={kind}
//                       className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border p-3 text-center text-sm transition hover:border-cyan-400/40 ${
//                         form.kind === kind
//                           ? "border-cyan-400/40 bg-cyan-500/30 text-cyan-200"
//                           : "border-white/10 bg-white/5"
//                       } ${
//                         isSubmitting ||
//                         transactionStep === "pending" ||
//                         isProcessingPaidDispute
//                           ? "cursor-not-allowed opacity-50"
//                           : ""
//                       }`}
//                     >
//                       <input
//                         type="radio"
//                         name="kind"
//                         className="hidden"
//                         checked={form.kind === kind}
//                         onChange={() => setForm({ ...form, kind })}
//                         disabled={
//                           isSubmitting ||
//                           transactionStep === "pending" ||
//                           isProcessingPaidDispute
//                         }
//                       />
//                       {kind === "Paid" && <Wallet className="h-4 w-4" />}
//                       {kind}
//                     </label>
//                   ))}
//                 </div>
//               </div>

//               {/* Defendant Field */}
//               <div>
//                 <label className="mb-2 block text-sm font-medium text-cyan-200">
//                   Defendant <span className="text-red-500">*</span>
//                   <span className="ml-2 text-xs text-cyan-400">
//                     (Pre-filled from agreement)
//                   </span>
//                 </label>
//                 <div className="relative">
//                   <Users className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
//                   <input
//                     value={form.defendant}
//                     readOnly
//                     className="w-full cursor-not-allowed rounded-md border border-white/10 bg-white/20 py-2 pr-3 pl-9 text-white/70 outline-none"
//                     placeholder="Defendant username..."
//                     required
//                   />
//                 </div>
//               </div>

//               {/* Description */}
//               <div>
//                 <label className="mb-2 block text-sm font-medium text-cyan-200">
//                   Detailed Description <span className="text-red-500">*</span>
//                   <span className="ml-2 text-xs text-cyan-400">
//                     (Agreement description pre-filled)
//                   </span>
//                 </label>
//                 <textarea
//                   value={form.description}
//                   onChange={(e) =>
//                     setForm({ ...form, description: e.target.value })
//                   }
//                   className="min-h-32 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-cyan-400/40"
//                   placeholder="Describe the dispute details..."
//                   required
//                   disabled={
//                     isSubmitting ||
//                     transactionStep === "pending" ||
//                     isProcessingPaidDispute
//                   }
//                 />
//               </div>

//               {/* Claim */}
//               <div>
//                 <div className="mb-2 flex items-center justify-between">
//                   <label className="text-sm font-medium text-cyan-200">
//                     Claim <span className="text-red-500">*</span>
//                   </label>
//                   <div className="group relative cursor-help">
//                     <Info className="h-4 w-4 text-cyan-300" />
//                     <div className="absolute top-full right-0 mt-2 hidden w-52 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
//                       What resolution are you seeking? This field should be
//                       filled by you.
//                     </div>
//                   </div>
//                 </div>
//                 <textarea
//                   value={form.claim}
//                   onChange={(e) => setForm({ ...form, claim: e.target.value })}
//                   className="min-h-24 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-cyan-400/40"
//                   placeholder="What resolution are you seeking? (e.g., refund, completion of work, compensation)"
//                   required
//                   disabled={
//                     isSubmitting ||
//                     transactionStep === "pending" ||
//                     isProcessingPaidDispute
//                   }
//                 />
//               </div>

//               {/* Witnesses Section */}
//               <div data-witness-search>
//                 <div className="mb-2 flex items-center justify-between">
//                   <label className="text-sm font-medium text-cyan-200">
//                     Witness list (max 5)
//                     <span className="ml-2 text-xs text-cyan-400">
//                       (Start typing username with or without @ symbol)
//                     </span>
//                   </label>
//                   <Button
//                     type="button"
//                     variant="outline"
//                     className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
//                     onClick={addWitness}
//                     disabled={
//                       form.witnesses.length >= 5 ||
//                       isSubmitting ||
//                       transactionStep === "pending" ||
//                       isProcessingPaidDispute
//                     }
//                   >
//                     Add witness
//                   </Button>
//                 </div>
//                 <div className="space-y-2">
//                   {form.witnesses.map((w, i) => (
//                     <div key={i} className="relative flex items-center gap-2">
//                       <div className="relative flex-1">
//                         <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
//                         <input
//                           value={w}
//                           onChange={(e) => {
//                             const value = e.target.value;
//                             handleWitnessInputChange(i, value);
//                           }}
//                           onFocus={() => {
//                             setActiveWitnessIndex(i);
//                             const searchValue = w.startsWith("@")
//                               ? w.substring(1)
//                               : w;
//                             if (searchValue.length >= 2) {
//                               setShowWitnessSuggestions(true);
//                             }
//                           }}
//                           className="w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
//                           placeholder="Type username with or without @ (min 2 characters)..."
//                           disabled={
//                             isSubmitting ||
//                             transactionStep === "pending" ||
//                             isProcessingPaidDispute
//                           }
//                         />
//                         {isWitnessSearchLoading && activeWitnessIndex === i && (
//                           <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-cyan-300" />
//                         )}
//                       </div>
//                       {form.witnesses.length > 1 && (
//                         <button
//                           type="button"
//                           onClick={() => removeWitness(i)}
//                           className="rounded-md border border-white/10 bg-white/5 px-2 py-2 text-xs text-cyan-200 hover:text-white"
//                           disabled={
//                             isSubmitting ||
//                             transactionStep === "pending" ||
//                             isProcessingPaidDispute
//                           }
//                         >
//                           Remove
//                         </button>
//                       )}

//                       {/* Witness User Suggestions Dropdown */}
//                       {showWitnessSuggestions && activeWitnessIndex === i && (
//                         <div className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-white/10 bg-cyan-900/95 shadow-lg backdrop-blur-md">
//                           {witnessSearchResults.length > 0 ? (
//                             witnessSearchResults.map((user) => (
//                               <UserSearchResult
//                                 key={user.id}
//                                 user={user}
//                                 onSelect={(username) =>
//                                   handleWitnessSelect(username, i)
//                                 }
//                                 field="witness"
//                               />
//                             ))
//                           ) : witnessSearchQuery.length >= 2 &&
//                             !isWitnessSearchLoading ? (
//                             <div className="px-4 py-3 text-center text-sm text-cyan-300">
//                               No users found for "{witnessSearchQuery}"
//                               <div className="mt-1 text-xs text-cyan-400">
//                                 Make sure the user exists and has a Telegram
//                                 username
//                               </div>
//                             </div>
//                           ) : null}

//                           {witnessSearchQuery.length < 2 && (
//                             <div className="px-4 py-3 text-center text-sm text-cyan-300">
//                               Type at least 2 characters to search
//                             </div>
//                           )}
//                         </div>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Evidence Upload Section */}
//               <div>
//                 <label className="mb-2 block text-sm font-medium text-cyan-200">
//                   Supporting Evidence <span className="text-red-500">*</span>
//                   {form.evidence.length > 0 && (
//                     <span className="ml-2 text-xs text-yellow-400">
//                       (Total: {getTotalFileSize(form.evidence)})
//                     </span>
//                   )}
//                 </label>

//                 <div
//                   className={`group relative cursor-pointer rounded-md border border-dashed transition-colors ${
//                     isDragOver
//                       ? "border-cyan-400/60 bg-cyan-500/20"
//                       : "border-white/15 bg-white/5 hover:border-cyan-400/40"
//                   } ${
//                     isSubmitting ||
//                     transactionStep === "pending" ||
//                     isProcessingPaidDispute
//                       ? "cursor-not-allowed opacity-50"
//                       : ""
//                   }`}
//                   onDragOver={handleDragOver}
//                   onDragLeave={handleDragLeave}
//                   onDrop={handleDrop}
//                 >
//                   <input
//                     onChange={handleFileSelect}
//                     type="file"
//                     multiple
//                     accept="image/*,.pdf,.doc,.docx,.txt"
//                     className="hidden"
//                     id="evidence-upload"
//                     disabled={
//                       isSubmitting ||
//                       transactionStep === "pending" ||
//                       isProcessingPaidDispute
//                     }
//                   />
//                   <label
//                     htmlFor="evidence-upload"
//                     className={`flex cursor-pointer flex-col items-center justify-center px-4 py-6 text-center ${
//                       isSubmitting ||
//                       transactionStep === "pending" ||
//                       isProcessingPaidDispute
//                         ? "cursor-not-allowed"
//                         : ""
//                     }`}
//                   >
//                     <Upload className="mb-2 h-6 w-6 text-cyan-400" />
//                     <div className="text-sm text-cyan-300">
//                       {isDragOver
//                         ? "Drop files here"
//                         : "Click to upload or drag and drop"}
//                     </div>
//                     <div className="text-muted-foreground mt-1 text-xs">
//                       Supports images{" "}
//                       <span className="text-yellow-300">(max 2MB) </span>,
//                       documents{" "}
//                       <span className="text-yellow-300">(max 3MB)</span>
//                     </div>
//                   </label>
//                 </div>

//                 {/* File List */}
//                 {form.evidence.length > 0 && (
//                   <div className="mt-4 space-y-3">
//                     <div className="flex items-center justify-between">
//                       <h4 className="text-sm font-medium text-cyan-200">
//                         Selected Files ({form.evidence.length})
//                       </h4>
//                       <div className="text-xs text-yellow-400">
//                         Total: {getTotalFileSize(form.evidence)}
//                       </div>
//                     </div>
//                     {form.evidence.map((file) => (
//                       <div
//                         key={file.id}
//                         className="flex items-center justify-between rounded-lg border border-cyan-400/20 bg-cyan-500/5 p-3"
//                       >
//                         <div className="flex items-center gap-3">
//                           {file.type === "image" && file.preview ? (
//                             <img
//                               src={file.preview}
//                               alt={file.file.name}
//                               className="h-10 w-10 rounded object-cover"
//                             />
//                           ) : (
//                             <Paperclip className="h-5 w-5 text-cyan-400" />
//                           )}
//                           <div>
//                             <div className="text-sm font-medium text-white">
//                               {file.file.name}
//                             </div>
//                             <div className="text-xs text-cyan-200/70">
//                               {file.size}
//                             </div>
//                           </div>
//                         </div>
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           onClick={() => removeFile(file.id)}
//                           className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
//                           disabled={
//                             isSubmitting ||
//                             transactionStep === "pending" ||
//                             isProcessingPaidDispute
//                           }
//                         >
//                           <Trash2 className="h-4 w-4" />
//                         </Button>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>

//               {/* Submit Button */}
//               <div className="flex items-center justify-between gap-3 pt-4">
//                 <div className="text-xs text-cyan-200/70">
//                   {form.evidence.length} file(s) selected
//                   {form.witnesses.filter((w) => w.trim()).length > 0 &&
//                     ` • ${form.witnesses.filter((w) => w.trim()).length} witness(es)`}
//                 </div>

//                 <Button
//                   type="submit"
//                   variant="neon"
//                   className="neon-hover"
//                   disabled={
//                     isSubmitting ||
//                     transactionStep === "pending" ||
//                     isProcessingPaidDispute
//                   }
//                 >
//                   {isSubmitting || transactionStep === "pending" ? (
//                     <>
//                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                       {form.kind === "Paid" && transactionStep === "pending"
//                         ? "Processing Transaction..."
//                         : "Creating Dispute..."}
//                     </>
//                   ) : (
//                     <>
//                       <Scale className="mr-2 h-4 w-4" />
//                       {form.kind === "Paid"
//                         ? "Pay & Open Dispute"
//                         : "Open Dispute"}
//                     </>
//                   )}
//                 </Button>
//               </div>
//             </form>

//             {/* Smart Contract Info for Paid Disputes */}
//             {form.kind === "Paid" &&
//               transactionStep === "idle" &&
//               !isSubmitting && (
//                 <div className="mt-4 rounded-lg border border-cyan-400/20 bg-cyan-500/5 p-4">
//                   <div className="flex items-center gap-2">
//                     <Wallet className="h-5 w-5 text-cyan-300" />
//                     <h4 className="text-sm font-medium text-cyan-200">
//                       Smart Contract Transaction Required
//                     </h4>
//                   </div>
//                   <p className="mt-2 text-xs text-cyan-300/80">
//                     For paid disputes, you'll need to confirm a transaction in
//                     your wallet to record the dispute on-chain. This ensures
//                     transparency and security for your case.
//                   </p>
//                   <div className="mt-3 text-xs text-cyan-400">
//                     <div className="flex items-center gap-1">
//                       <span>•</span>
//                       <span>Generated Voting ID: {votingIdToUse}</span>
//                     </div>
//                     <div className="flex items-center gap-1">
//                       <span>•</span>
//                       <span>Network: {networkInfo.chainName}</span>
//                     </div>
//                   </div>
//                 </div>
//               )}
//           </div>
//         </motion.div>
//       </motion.div>
//     </AnimatePresence>
//   );
// }

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "../components/ui/button";
import {
  Search,
  Upload,
  Paperclip,
  Trash2,
  Loader2,
  Users,
  Scale,
  Info,
  ChevronRight,
  X,
  Wallet,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { disputeService } from "../services/disputeServices";
import { DisputeTypeEnum } from "../types";
import type { UploadedFile } from "../types";
import { UserAvatar } from "../components/UserAvatar";
import {
  cleanTelegramUsername,
  getCurrentUserTelegram,
  isValidTelegramUsername,
} from "../lib/usernameUtils";
import { useAuth } from "../hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { VOTING_ABI, VOTING_CA } from "../web3/config";
import { useNetworkEnvironment } from "../config/useNetworkEnvironment";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { parseEther } from "ethers";

const FEE_AMOUNT = "0.01";

const getTotalFileSize = (files: UploadedFile[]): string => {
  const totalBytes = files.reduce((total, file) => total + file.file.size, 0);
  const mb = totalBytes / 1024 / 1024;
  return `${mb.toFixed(2)} MB`;
};

// Add debounce hook at the top
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const isSecondRejection = (agreement: any): boolean => {
  if (!agreement?.timeline) return false;

  const rejectionEvents = agreement.timeline.filter(
    (event: any) => event.eventType === 6, // DELIVERY_REJECTED = 6
  );

  return rejectionEvents.length >= 2;
};

const isWalletAddress = (value: string) => /^0x[a-fA-F0-9]{40}$/.test(value);

interface OpenDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  agreement: any;
  onDisputeCreated: () => void;
}

// User Search Result Component
const UserSearchResult = ({
  user,
  onSelect,
}: {
  user: any;
  onSelect: (username: string) => void;
  field: "defendant" | "witness";
}) => {
  const { user: currentUser } = useAuth();

  const telegramUsername = cleanTelegramUsername(
    user.telegramUsername || user.telegram?.username || user.telegramInfo,
  );

  if (!telegramUsername) {
    return null;
  }

  const displayUsername = telegramUsername ? `@${telegramUsername}` : "Unknown";
  const displayName = user.displayName || displayUsername;
  const isCurrentUser = user.id === currentUser?.id;

  return (
    <div
      onClick={() => onSelect(telegramUsername)}
      className={`glass card-cyan flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:opacity-60 ${
        isCurrentUser ? "opacity-80" : ""
      }`}
    >
      <UserAvatar
        userId={user.id}
        avatarId={user.avatarId || user.avatar?.id}
        username={telegramUsername}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-white">
          {displayName}
        </div>
        {telegramUsername && (
          <div className="truncate text-xs text-cyan-300">
            @{telegramUsername}
          </div>
        )}
        {user.bio && (
          <div className="mt-1 truncate text-xs text-cyan-200/70">
            {user.bio}
          </div>
        )}
      </div>
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-cyan-400" />
    </div>
  );
};

// Transaction Status Component
const TransactionStatus = ({
  status,
  onRetry,
}: {
  status: "idle" | "pending" | "success" | "error";
  onRetry?: () => void;
}) => {
  if (status === "idle") return null;

  const configs = {
    pending: {
      icon: Loader2,
      text: "Processing transaction...",
      className: "text-yellow-400",
      iconClassName: "animate-spin",
    },
    success: {
      icon: CheckCircle2,
      text: "Transaction confirmed!",
      className: "text-green-400",
      iconClassName: "",
    },
    error: {
      icon: AlertCircle,
      text: "Transaction failed",
      className: "text-red-400",
      iconClassName: "",
    },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <div
      className={`rounded-lg border p-3 ${config.className} border-current/20 bg-current/5`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${config.iconClassName}`} />
        <span className="text-sm font-medium">{config.text}</span>
        {status === "error" && onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="ml-auto border-current text-current hover:bg-current/10"
          >
            Retry
          </Button>
        )}
      </div>
    </div>
  );
};

export default function OpenDisputeModal({
  isOpen,
  onClose,
  agreement,
  onDisputeCreated,
}: OpenDisputeModalProps) {
  const { user: currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const networkInfo = useNetworkEnvironment();
  const [form, setForm] = useState({
    title: "",
    kind: "Pro Bono" as "Pro Bono" | "Paid",
    defendant: "",
    description: "",
    claim: "",
    evidence: [] as UploadedFile[],
    witnesses: [""] as string[],
  });

  // Search states for witnesses
  const [witnessSearchQuery, setWitnessSearchQuery] = useState("");
  const [witnessSearchResults, setWitnessSearchResults] = useState<any[]>([]);
  const [isWitnessSearchLoading, setIsWitnessSearchLoading] = useState(false);
  const [showWitnessSuggestions, setShowWitnessSuggestions] = useState(false);
  const [activeWitnessIndex, setActiveWitnessIndex] = useState<number>(0);

  // File upload state
  const [isDragOver, setIsDragOver] = useState(false);

  // Transaction state
  const [transactionStep, setTransactionStep] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [isProcessingPaidDispute, setIsProcessingPaidDispute] = useState(false);

  // Add this ref to track if form has been initialized
  const hasInitialized = useRef(false);

  // Refs for form data that changes
  const formRef = useRef(form);
  const agreementIdRef = useRef(agreement?.id);
  const networkInfoRef = useRef(networkInfo);

  // Wagmi hooks for smart contract interaction
  const {
    data: hash,
    writeContract,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const {
    isSuccess: isTransactionSuccess,
    isError: isTransactionError,
    // isLoading: isConfirming,
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Generate random voting ID
  const votingIdToUse = useMemo(() => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    // Generate a 6-digit number (100000 - 999999)
    return 100000 + (array[0] % 900000);
  }, []);

  // Update refs when dependencies change
  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    agreementIdRef.current = agreement?.id;
  }, [agreement?.id]);

  useEffect(() => {
    networkInfoRef.current = networkInfo;
  }, [networkInfo]);

  // Initialize form from agreement
  useEffect(() => {
    if (isOpen && agreement && !hasInitialized.current) {
      // Determine who the defendant should be (the other party)
      const isFirstParty =
        agreement._raw?.firstParty?.username === currentUser?.username;
      const defendant = isFirstParty
        ? agreement.counterparty
        : agreement.createdBy;

      // Check if this is from a second rejection
      const isFromSecondRejection = isSecondRejection(agreement._raw);

      let title = `Dispute from Agreement: ${agreement.title}`;
      let description = `This dispute originates from agreement "${agreement.title}".\n\nOriginal Agreement Description:\n${agreement.description}\n\nDispute Details: `;

      if (isFromSecondRejection) {
        title = `Dispute: ${agreement.title} - Second Delivery Rejection`;
        description = `This dispute was automatically triggered after the second rejection of delivery for agreement "${agreement.title}".\n\nOriginal Agreement Description:\n${agreement.description}\n\nDispute Details: The delivery has been rejected twice, indicating unresolved issues with the work performed.`;
      }

      // Pre-fill form with agreement data
      setForm({
        title,
        kind: "Pro Bono",
        defendant: defendant || "",
        description,
        claim: "",
        evidence: [],
        witnesses: [""],
      });

      // Mark as initialized
      hasInitialized.current = true;
    }
  }, [isOpen, agreement, currentUser]);

  // Reset the initialized flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasInitialized.current = false;
      setTransactionStep("idle");
      setIsProcessingPaidDispute(false);
      resetWrite();
    }
  }, [isOpen, resetWrite]);

  // Helper function to reset and close
  const resetFormAndClose = useCallback(() => {
    setForm({
      title: "",
      kind: "Pro Bono",
      defendant: "",
      description: "",
      claim: "",
      evidence: [],
      witnesses: [""],
    });
    setTransactionStep("idle");
    setIsProcessingPaidDispute(false);
    resetWrite();
    onDisputeCreated();
    onClose();
  }, [resetWrite, onDisputeCreated, onClose]);

  // Create dispute in backend (used for BOTH Pro Bono AND Paid)
  const createDisputeOffchain = useCallback(
    async (transactionHash?: string) => {
      setIsSubmitting(true);

      try {
        console.log("🚀 Creating dispute from agreement...");

        const currentForm = formRef.current;
        const currentAgreementId = agreementIdRef.current;
        const currentNetworkInfo = networkInfoRef.current;

        const cleanedDefendant = isWalletAddress(currentForm.defendant)
          ? currentForm.defendant
          : cleanTelegramUsername(currentForm.defendant);

        // Clean witness usernames - remove @ symbol before sending
        const cleanedWitnesses = currentForm.witnesses
          .filter((w) => w.trim())
          .map((w) => {
            // Remove @ symbol if present
            const cleanW = w.startsWith("@") ? w.substring(1) : w;
            return cleanTelegramUsername(cleanW);
          });

        const requestKind =
          currentForm.kind === "Pro Bono"
            ? DisputeTypeEnum.ProBono
            : DisputeTypeEnum.Paid;

        const files = currentForm.evidence.map((uf) => uf.file);

        // Create the dispute with ALL data for BOTH types
        const result = await disputeService.createDisputeFromAgreement(
          parseInt(currentAgreementId),
          {
            title: currentForm.title,
            description: currentForm.description,
            requestKind,
            defendant: cleanedDefendant,
            claim: currentForm.claim,
            witnesses: cleanedWitnesses,
            // Add on-chain data ONLY for paid disputes
            ...(currentForm.kind === "Paid" && {
              onchainVotingId: votingIdToUse,
              transactionHash: transactionHash || hash,
              chainId: currentNetworkInfo.chainId,
            }),
          },
          files,
        );

        console.log("✅ Dispute created from agreement:", result);

        if (currentForm.kind === "Paid") {
          toast.success("Paid dispute created successfully!", {
            description: `${currentForm.title} has been recorded on-chain and in our system`,
          });
        } else {
          toast.success("Pro Bono dispute created successfully!", {
            description: `${currentForm.title} has been submitted for review`,
          });
        }

        // Reset form and close modal
        resetFormAndClose();
      } catch (error: any) {
        console.error("❌ Dispute creation failed:", error);

        // Enhanced error handling with specific messages
        const errorMessage = error.message || "Failed to submit dispute";

        // Check for specific error messages from the service
        if (
          errorMessage.includes("File too large") ||
          errorMessage.includes("exceeds server limits")
        ) {
          toast.error("File Size Limit Exceeded", {
            description:
              "The total size of your files is too large for the server. Please:\n1. Upload fewer files\n2. Compress images before uploading\n3. Remove large documents\n4. Try with files under 5MB each",
            duration: 10000,
          });
        } else if (errorMessage.includes("CORS_ERROR")) {
          toast.error("Connection Security Issue", {
            description:
              "Unable to connect due to browser security restrictions.",
            duration: 10000,
          });
        } else if (errorMessage.includes("Request timeout")) {
          toast.error("Upload Timeout", {
            description:
              "The upload is taking too long. This may be due to:\n1. Large file sizes\n2. Slow internet connection\n3. Server is busy\n\nPlease try with smaller files or try again later.",
            duration: 8000,
          });
        } else if (
          errorMessage.includes("Missing required") ||
          errorMessage.includes("invalid")
        ) {
          toast.error("Validation Error", {
            description: errorMessage,
            duration: 6000,
          });
        } else {
          toast.error("Submission Failed", {
            description: errorMessage,
            duration: 6000,
          });
        }

        // Reset transaction state on error
        setTransactionStep("idle");
        setIsProcessingPaidDispute(false);
      } finally {
        setIsSubmitting(false);
      }
    },
    [hash, resetFormAndClose, votingIdToUse],
  );

  // Handle transaction status changes
  useEffect(() => {
    if (isWritePending) {
      setTransactionStep("pending");
    } else if (isTransactionSuccess && isProcessingPaidDispute) {
      setTransactionStep("success");
      // After transaction success, create the dispute in backend
      createDisputeOffchain(hash);
    } else if (writeError || isTransactionError) {
      setTransactionStep("error");
      setIsProcessingPaidDispute(false);
    }
  }, [
    isWritePending,
    isTransactionSuccess,
    writeError,
    isTransactionError,
    isProcessingPaidDispute,
    createDisputeOffchain,
    hash,
  ]);

  const handleWitnessSearch = useCallback(
    async (query: string) => {
      // Remove @ symbol from query for searching
      const cleanQuery = query.startsWith("@") ? query.substring(1) : query;

      if (cleanQuery.length < 2) {
        setWitnessSearchResults([]);
        setShowWitnessSuggestions(false);
        return;
      }

      setIsWitnessSearchLoading(true);
      setShowWitnessSuggestions(true);

      try {
        // Search with the cleaned query (without @)
        const results = await disputeService.searchUsers(cleanQuery);

        const currentUserTelegram = getCurrentUserTelegram(currentUser);
        const filteredResults = results.filter((resultUser) => {
          const resultTelegram = cleanTelegramUsername(
            resultUser.telegramUsername ||
              resultUser.telegram?.username ||
              resultUser.telegramInfo,
          );

          return (
            resultTelegram &&
            resultTelegram.toLowerCase() !== currentUserTelegram.toLowerCase()
          );
        });

        setWitnessSearchResults(filteredResults);
      } catch (error) {
        console.error("Witness search failed:", error);
        setWitnessSearchResults([]);
      } finally {
        setIsWitnessSearchLoading(false);
      }
    },
    [currentUser],
  );

  const debouncedWitnessQuery = useDebounce(witnessSearchQuery, 300);

  useEffect(() => {
    if (debouncedWitnessQuery.length >= 2) {
      handleWitnessSearch(debouncedWitnessQuery);
    } else {
      setWitnessSearchResults([]);
      setShowWitnessSuggestions(false);
    }
  }, [debouncedWitnessQuery, handleWitnessSearch]);

  // Handle witness selection
  const handleWitnessSelect = (username: string, index: number) => {
    // Display with @ symbol, but store without it
    updateWitness(index, `@${username}`);
    setShowWitnessSuggestions(false);
    setWitnessSearchQuery("");
  };

  const handleWitnessInputChange = (index: number, value: string) => {
    updateWitness(index, value);
    setWitnessSearchQuery(value);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = [];

    Array.from(selectedFiles).forEach((file) => {
      const fileSizeMB = file.size / 1024 / 1024;
      const fileType = file.type.startsWith("image/") ? "image" : "document";

      // Apply file size limits based on file type
      if (fileType === "image" && fileSizeMB > 2) {
        toast.error(
          `Image "${file.name}" exceeds 2MB limit (${fileSizeMB.toFixed(2)}MB)`,
        );
        return;
      }

      if (fileType === "document" && fileSizeMB > 3) {
        toast.error(
          `Document "${file.name}" exceeds 3MB limit (${fileSizeMB.toFixed(2)}MB)`,
        );
        return;
      }

      const fileSize = fileSizeMB.toFixed(2) + " MB";
      const newFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        type: fileType,
        size: fileSize,
      };

      newFiles.push(newFile);

      // Create preview for images
      if (fileType === "image") {
        const reader = new FileReader();
        reader.onload = (e) => {
          newFile.preview = e.target?.result as string;
          // Update the specific file with preview
          setForm((prev) => ({
            ...prev,
            evidence: prev.evidence.map((f) =>
              f.id === newFile.id ? { ...f, preview: newFile.preview } : f,
            ),
          }));
        };
        reader.readAsDataURL(file);
      }
    });

    // Add all files to evidence immediately
    setForm((prev) => ({
      ...prev,
      evidence: [...prev.evidence, ...newFiles],
    }));
  };

  const removeFile = (id: string) => {
    setForm((prev) => ({
      ...prev,
      evidence: prev.evidence.filter((file) => file.id !== id),
    }));
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles) return;

    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*,.pdf,.doc,.docx,.txt";
    const dataTransfer = new DataTransfer();
    Array.from(droppedFiles).forEach((file) => dataTransfer.items.add(file));
    input.files = dataTransfer.files;

    const event = new Event("change", { bubbles: true });
    input.dispatchEvent(event);

    handleFileSelect({
      target: { files: dataTransfer.files },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  // Witness management
  const addWitness = () => {
    if (form.witnesses.length < 5) {
      setForm((prev) => ({
        ...prev,
        witnesses: [...prev.witnesses, ""],
      }));
    }
  };

  const updateWitness = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      witnesses: prev.witnesses.map((w, i) => (i === index ? value : w)),
    }));
  };

  const removeWitness = (index: number) => {
    setForm((prev) => ({
      ...prev,
      witnesses: prev.witnesses.filter((_, i) => i !== index),
    }));
  };

  // Smart contract interaction for paid disputes
  const createDisputeOnchain = useCallback(async (): Promise<void> => {
    try {
      const contractAddress = VOTING_CA[networkInfo.chainId as number];

      if (!contractAddress) {
        throw new Error(
          `No contract address found for chain ID ${networkInfo.chainId}`,
        );
      }

      writeContract({
        address: contractAddress,
        abi: VOTING_ABI.abi,
        functionName: "raiseDispute",
        args: [BigInt(votingIdToUse), false],
        value: parseEther(FEE_AMOUNT.toString()),
      });
    } catch (error: any) {
      console.error("Smart contract interaction failed:", error);
      toast.error("Failed to initiate smart contract transaction", {
        description:
          error.message || "Please check your wallet connection and try again.",
      });
      setTransactionStep("error");
      setIsProcessingPaidDispute(false);
    }
  }, [networkInfo.chainId, votingIdToUse, writeContract]);

  // Main form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Form validation
    if (!form.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!form.defendant.trim()) {
      toast.error("Defendant information is required");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Please enter a description");
      return;
    }
    if (!form.claim.trim()) {
      toast.error("Please enter your claim");
      return;
    }

    const defendant = form.defendant.trim();
    if (!isValidTelegramUsername(defendant) && !isWalletAddress(defendant)) {
      toast.error(
        "Defendant must be a valid Telegram username or wallet address",
      );
      return;
    }

    // Validate witness Telegram usernames
    const invalidWitnesses = form.witnesses
      .filter((w) => w.trim())
      .map((w) => (w.startsWith("@") ? w.substring(1) : w))
      .filter((w) => !isValidTelegramUsername(w));

    if (invalidWitnesses.length > 0) {
      toast.error("Please enter valid Telegram usernames for all witnesses");
      return;
    }

    // Validate file sizes and types
    const maxFileSize = 10 * 1024 * 1024;
    const allowedImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const allowedDocumentTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    // Calculate total file size
    const totalSize = form.evidence.reduce(
      (total, file) => total + file.file.size,
      0,
    );
    const maxTotalSize = 50 * 1024 * 1024;

    if (totalSize > maxTotalSize) {
      toast.error("Total file size too large", {
        description: `Total file size is ${(totalSize / 1024 / 1024).toFixed(2)}MB. Maximum total size is 50MB.`,
        duration: 8000,
      });
      return;
    }

    for (const file of form.evidence) {
      if (file.file.size > maxFileSize) {
        toast.error(`File ${file.file.name} exceeds 10MB size limit`);
        return;
      }

      const fileType = file.file.type;
      if (
        !allowedImageTypes.includes(fileType) &&
        !allowedDocumentTypes.includes(fileType)
      ) {
        toast.error(
          `File ${file.file.name} has unsupported type. Allowed: images, PDFs, Word docs, text files`,
        );
        return;
      }
    }

    // Handle based on dispute type
    if (form.kind === "Paid") {
      // For paid disputes, FIRST call smart contract
      setIsProcessingPaidDispute(true);
      await createDisputeOnchain();
    } else {
      // For pro bono disputes, create directly
      await createDisputeOffchain();
    }
  };

  // Retry transaction function
  const retryTransaction = useCallback(() => {
    setTransactionStep("idle");
    resetWrite();
    if (form.kind === "Paid") {
      createDisputeOnchain();
    }
  }, [form.kind, createDisputeOnchain, resetWrite]);

  // Separate click outside handling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const witnessSearchElement = document.querySelector(
        "[data-witness-search]",
      );
      if (
        witnessSearchElement &&
        !witnessSearchElement.contains(event.target as Node)
      ) {
        setShowWitnessSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          className="glass card-cyan relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl"
          onClick={handleModalClick}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-cyan-400/30 bg-cyan-500/10 p-6">
            <div className="flex items-center gap-3">
              <Scale className="h-6 w-6 text-cyan-300" />
              <h3 className="text-xl font-semibold text-cyan-300">
                Open Dispute from Agreement
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/70 hover:text-white"
              disabled={
                isSubmitting ||
                transactionStep === "pending" ||
                isProcessingPaidDispute
              }
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
            <div className="mb-4 rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-4">
              <p className="text-sm text-cyan-200">
                Creating dispute from: <strong>{agreement?.title}</strong>
              </p>
            </div>

            {/* Transaction Status Display */}
            {transactionStep !== "idle" && (
              <div className="mb-4">
                <TransactionStatus
                  status={transactionStep}
                  onRetry={retryTransaction}
                />
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-cyan-200">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <div className="group relative cursor-help">
                    <Info className="h-4 w-4 text-cyan-300" />
                    <div className="absolute top-full right-0 mt-2 hidden w-52 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                      The title has been pre-filled from the agreement. You can
                      modify it as needed.
                    </div>
                  </div>
                </div>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-cyan-400/40"
                  placeholder="Dispute title..."
                  required
                  disabled={
                    isSubmitting ||
                    transactionStep === "pending" ||
                    isProcessingPaidDispute
                  }
                />
              </div>

              {/* Request Kind */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-cyan-200">
                    Request Kind <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="group relative cursor-pointer">
                      <span className="cursor-help rounded border border-white/10 bg-white/5 px-2 py-0.5">
                        Pro Bono
                      </span>
                      <div className="absolute top-full right-0 mt-2 hidden w-52 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                        No payment required. Judges will handle your case pro
                        bono when available.
                      </div>
                    </div>
                    <div className="group relative cursor-pointer">
                      <span className="cursor-help rounded border border-white/10 bg-white/5 px-2 py-0.5">
                        Paid
                      </span>
                      <div className="absolute top-full right-0 mt-2 hidden w-52 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                        A fee is required to initiate your dispute. This fee
                        helps prioritize your case and notifies all judges to
                        begin reviewing it immediately.
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(["Pro Bono", "Paid"] as const).map((kind) => (
                    <label
                      key={kind}
                      className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border p-3 text-center text-sm transition hover:border-cyan-400/40 ${
                        form.kind === kind
                          ? "border-cyan-400/40 bg-cyan-500/30 text-cyan-200"
                          : "border-white/10 bg-white/5"
                      } ${
                        isSubmitting ||
                        transactionStep === "pending" ||
                        isProcessingPaidDispute
                          ? "cursor-not-allowed opacity-50"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="kind"
                        className="hidden"
                        checked={form.kind === kind}
                        onChange={() => setForm({ ...form, kind })}
                        disabled={
                          isSubmitting ||
                          transactionStep === "pending" ||
                          isProcessingPaidDispute
                        }
                      />
                      {kind === "Paid" && <Wallet className="h-4 w-4" />}
                      {kind}
                    </label>
                  ))}
                </div>
              </div>

              {/* Defendant Field */}
              <div>
                <label className="mb-2 block text-sm font-medium text-cyan-200">
                  Defendant <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs text-cyan-400">
                    (Pre-filled from agreement)
                  </span>
                </label>
                <div className="relative">
                  <Users className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
                  <input
                    value={form.defendant}
                    readOnly
                    className="w-full cursor-not-allowed rounded-md border border-white/10 bg-white/20 py-2 pr-3 pl-9 text-white/70 outline-none"
                    placeholder="Defendant username..."
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-cyan-200">
                  Detailed Description <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs text-cyan-400">
                    (Agreement description pre-filled)
                  </span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="min-h-32 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-cyan-400/40"
                  placeholder="Describe the dispute details..."
                  required
                  disabled={
                    isSubmitting ||
                    transactionStep === "pending" ||
                    isProcessingPaidDispute
                  }
                />
              </div>

              {/* Claim */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-cyan-200">
                    Claim <span className="text-red-500">*</span>
                  </label>
                  <div className="group relative cursor-help">
                    <Info className="h-4 w-4 text-cyan-300" />
                    <div className="absolute top-full right-0 mt-2 hidden w-52 rounded-md bg-cyan-950/90 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                      What resolution are you seeking? This field should be
                      filled by you.
                    </div>
                  </div>
                </div>
                <textarea
                  value={form.claim}
                  onChange={(e) => setForm({ ...form, claim: e.target.value })}
                  className="min-h-24 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-cyan-400/40"
                  placeholder="What resolution are you seeking? (e.g., refund, completion of work, compensation)"
                  required
                  disabled={
                    isSubmitting ||
                    transactionStep === "pending" ||
                    isProcessingPaidDispute
                  }
                />
              </div>

              {/* Witnesses Section */}
              <div data-witness-search>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-cyan-200">
                    Witness list (max 5)
                    <span className="ml-2 text-xs text-cyan-400">
                      (Start typing username with or without @ symbol)
                    </span>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/10"
                    onClick={addWitness}
                    disabled={
                      form.witnesses.length >= 5 ||
                      isSubmitting ||
                      transactionStep === "pending" ||
                      isProcessingPaidDispute
                    }
                  >
                    Add witness
                  </Button>
                </div>
                <div className="space-y-2">
                  {form.witnesses.map((w, i) => (
                    <div key={i} className="relative flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
                        <input
                          value={w}
                          onChange={(e) => {
                            const value = e.target.value;
                            handleWitnessInputChange(i, value);
                          }}
                          onFocus={() => {
                            setActiveWitnessIndex(i);
                            const searchValue = w.startsWith("@")
                              ? w.substring(1)
                              : w;
                            if (searchValue.length >= 2) {
                              setShowWitnessSuggestions(true);
                            }
                          }}
                          className="w-full rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
                          placeholder="Type username with or without @ (min 2 characters)..."
                          disabled={
                            isSubmitting ||
                            transactionStep === "pending" ||
                            isProcessingPaidDispute
                          }
                        />
                        {isWitnessSearchLoading && activeWitnessIndex === i && (
                          <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-cyan-300" />
                        )}
                      </div>
                      {form.witnesses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeWitness(i)}
                          className="rounded-md border border-white/10 bg-white/5 px-2 py-2 text-xs text-cyan-200 hover:text-white"
                          disabled={
                            isSubmitting ||
                            transactionStep === "pending" ||
                            isProcessingPaidDispute
                          }
                        >
                          Remove
                        </button>
                      )}

                      {/* Witness User Suggestions Dropdown */}
                      {showWitnessSuggestions && activeWitnessIndex === i && (
                        <div className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-white/10 bg-cyan-900/95 shadow-lg backdrop-blur-md">
                          {witnessSearchResults.length > 0 ? (
                            witnessSearchResults.map((user) => (
                              <UserSearchResult
                                key={user.id}
                                user={user}
                                onSelect={(username) =>
                                  handleWitnessSelect(username, i)
                                }
                                field="witness"
                              />
                            ))
                          ) : witnessSearchQuery.length >= 2 &&
                            !isWitnessSearchLoading ? (
                            <div className="px-4 py-3 text-center text-sm text-cyan-300">
                              No users found for "{witnessSearchQuery}"
                              <div className="mt-1 text-xs text-cyan-400">
                                Make sure the user exists and has a Telegram
                                username
                              </div>
                            </div>
                          ) : null}

                          {witnessSearchQuery.length < 2 && (
                            <div className="px-4 py-3 text-center text-sm text-cyan-300">
                              Type at least 2 characters to search
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidence Upload Section */}
              <div>
                <label className="mb-2 block text-sm font-medium text-cyan-200">
                  Supporting Evidence <span className="text-red-500">*</span>
                  {form.evidence.length > 0 && (
                    <span className="ml-2 text-xs text-yellow-400">
                      (Total: {getTotalFileSize(form.evidence)})
                    </span>
                  )}
                </label>

                <div
                  className={`group relative cursor-pointer rounded-md border border-dashed transition-colors ${
                    isDragOver
                      ? "border-cyan-400/60 bg-cyan-500/20"
                      : "border-white/15 bg-white/5 hover:border-cyan-400/40"
                  } ${
                    isSubmitting ||
                    transactionStep === "pending" ||
                    isProcessingPaidDispute
                      ? "cursor-not-allowed opacity-50"
                      : ""
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    onChange={handleFileSelect}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    className="hidden"
                    id="evidence-upload"
                    disabled={
                      isSubmitting ||
                      transactionStep === "pending" ||
                      isProcessingPaidDispute
                    }
                  />
                  <label
                    htmlFor="evidence-upload"
                    className={`flex cursor-pointer flex-col items-center justify-center px-4 py-6 text-center ${
                      isSubmitting ||
                      transactionStep === "pending" ||
                      isProcessingPaidDispute
                        ? "cursor-not-allowed"
                        : ""
                    }`}
                  >
                    <Upload className="mb-2 h-6 w-6 text-cyan-400" />
                    <div className="text-sm text-cyan-300">
                      {isDragOver
                        ? "Drop files here"
                        : "Click to upload or drag and drop"}
                    </div>
                    <div className="text-muted-foreground mt-1 text-xs">
                      Supports images{" "}
                      <span className="text-yellow-300">(max 2MB) </span>,
                      documents{" "}
                      <span className="text-yellow-300">(max 3MB)</span>
                    </div>
                  </label>
                </div>

                {/* File List */}
                {form.evidence.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-cyan-200">
                        Selected Files ({form.evidence.length})
                      </h4>
                      <div className="text-xs text-yellow-400">
                        Total: {getTotalFileSize(form.evidence)}
                      </div>
                    </div>
                    {form.evidence.map((file) => (
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
                            <Paperclip className="h-5 w-5 text-cyan-400" />
                          )}
                          <div>
                            <div className="text-sm font-medium text-white">
                              {file.file.name}
                            </div>
                            <div className="text-xs text-cyan-200/70">
                              {file.size}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                          disabled={
                            isSubmitting ||
                            transactionStep === "pending" ||
                            isProcessingPaidDispute
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between gap-3 pt-4">
                <div className="text-xs text-cyan-200/70">
                  {form.evidence.length} file(s) selected
                  {form.witnesses.filter((w) => w.trim()).length > 0 &&
                    ` • ${form.witnesses.filter((w) => w.trim()).length} witness(es)`}
                </div>

                <Button
                  type="submit"
                  variant="neon"
                  className="neon-hover"
                  disabled={
                    isSubmitting ||
                    transactionStep === "pending" ||
                    isProcessingPaidDispute
                  }
                >
                  {isSubmitting || transactionStep === "pending" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {form.kind === "Paid" && transactionStep === "pending"
                        ? "Processing Transaction..."
                        : "Creating Dispute..."}
                    </>
                  ) : (
                    <>
                      <Scale className="mr-2 h-4 w-4" />
                      {form.kind === "Paid"
                        ? "Pay & Open Dispute"
                        : "Open Dispute"}
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Smart Contract Info for Paid Disputes */}
            {form.kind === "Paid" &&
              transactionStep === "idle" &&
              !isSubmitting && (
                <div className="mt-4 rounded-lg border border-cyan-400/20 bg-cyan-500/5 p-4">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-cyan-300" />
                    <h4 className="text-sm font-medium text-cyan-200">
                      Smart Contract Transaction Required
                    </h4>
                  </div>
                  <p className="mt-2 text-xs text-cyan-300/80">
                    For paid disputes, you'll need to confirm a transaction in
                    your wallet to record the dispute on-chain. This ensures
                    transparency and security for your case.
                  </p>
                  <div className="mt-3 text-xs text-cyan-400">
                    <div className="flex items-center gap-1">
                      <span>•</span>
                      <span>Generated Voting ID: {votingIdToUse}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>•</span>
                      <span>Network: {networkInfo.chainName}</span>
                    </div>
                  </div>
                </div>
              )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
