import { useEffect, useState } from "react";
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
  Download,
  X,
  ExternalLink,
  Image as ImageIcon,
  File,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { getDisputeById } from "../lib/mockDisputes";
import type { DisputeRow } from "../lib/mockDisputes";
import { toast } from "sonner";

// Simplified evidence type definitions - only images and docs
type EvidenceType = "image" | "pdf" | "transaction" | "chat" | "document";

interface EvidenceItem {
  name: string;
  type: EvidenceType;
  url: string;
  preview?: string;
}

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

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    getDisputeById(id)
      .then((data) => {
        setDispute(data || null);
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
          preview: evidence, // show actual image if possible
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

  // Function to get icon for evidence type
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

  // Function to handle evidence viewing
  const handleViewEvidence = (evidence: EvidenceItem) => {
    setSelectedEvidence(evidence);
    setEvidenceViewerOpen(true);
    setPdfLoading(evidence.type === "pdf");
    setPdfError(false);
  };

  // Function to download evidence
  const handleDownloadEvidence = (evidence: EvidenceItem) => {
    toast.success(`Downloading ${evidence.name}...`);
  };

  // Function to handle PDF load events
  const handlePdfLoad = () => {
    setPdfLoading(false);
  };

  const handlePdfError = () => {
    setPdfLoading(false);
    setPdfError(true);
  };

  // Simplified Evidence Viewer Modal - only images and documents
  const EvidenceViewer = () => {
    if (!selectedEvidence) return null;

    const renderEvidenceContent = () => {
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
            <div className="flex h-full flex-col items-center justify-center space-y-6 p-6">
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
            <div className="flex h-full flex-col items-center justify-center space-y-6 p-6">
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
                      onClick={() =>
                        window.open(selectedEvidence.url, "_blank")
                      }
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
                    onLoad={handlePdfLoad}
                    onError={handlePdfError}
                  >
                    <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
                      <FileText className="h-16 w-16 text-yellow-400" />
                      <h3 className="text-lg font-semibold text-white">
                        PDF Not Available
                      </h3>
                      <p className="text-yellow-200">
                        The document isn’t available at the moment.
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
            <div className="flex h-full flex-col items-center justify-center space-y-6 p-6">
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

    return (
      <AnimatePresence>
        {evidenceViewerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setEvidenceViewerOpen(false);
              setPdfLoading(false);
              setPdfError(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card-cyan relative h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl"
              onClick={(e) => e.stopPropagation()}
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
                  onClick={() => {
                    setEvidenceViewerOpen(false);
                    setPdfLoading(false);
                    setPdfError(false);
                  }}
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
        )}
      </AnimatePresence>
    );
  };

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
      <div className="p-6 text-white">
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

  // Evidence display component with proper PDF handling
  const EvidenceDisplay = ({
    evidence,
    color,
  }: {
    evidence: EvidenceItem[];
    color: string;
  }) => {
    const [pdfLoadingStates, setPdfLoadingStates] = useState<{
      [key: string]: boolean;
    }>({});
    const [pdfErrorStates, setPdfErrorStates] = useState<{
      [key: string]: boolean;
    }>({});

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
                className={`rounded-lg border border-${color}-400/20 bg-${color}-500/5 p-4`}
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
                  <div className="flex gap-2">
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadEvidence(item);
                      }}
                      className={`h-8 w-8 p-0 text-${color}-400 hover:text-${color}-300`}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Inline PDF preview using iframe - much more reliable */}
                <div className="relative overflow-hidden rounded-lg border border-white/10 bg-black/20">
                  {isLoading && !hasError && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                      <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                      <p className="ml-2 text-sm text-white/70">
                        Loading PDF...
                      </p>
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
                          This PDF document isn’t available at the moment.
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
              className={`flex items-center gap-3 rounded-lg border border-${color}-400/20 bg-${color}-500/5 p-4 transition-colors hover:bg-${color}-500/10 cursor-pointer`}
              onClick={() => handleViewEvidence(item)}
            >
              <div className={`text-${color}-400`}>
                {getEvidenceIcon(item.type)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-white">
                  {item.name}
                </div>
                <div className="text-xs text-gray-400 capitalize">
                  {item.type === "transaction"
                    ? "View on Etherscan"
                    : "Click to preview"}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadEvidence(item);
                  }}
                  className={`h-8 w-8 p-0 text-${color}-400 hover:text-${color}-300`}
                >
                  <Download className="h-3 w-3" />
                </Button>
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 p-6 text-white"
    >
      {/* Back Button */}
      <Button
        onClick={() => navigate("/disputes")}
        variant="ghost"
        className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Disputes
      </Button>

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
                <EvidenceDisplay evidence={safeEvidence} color="cyan" />
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
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Respond as Defendant
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 border-t border-white/10 pt-6">
        {!dispute.defendantResponse && (
          <Button
            variant="outline"
            className="border-yellow-400/30 text-yellow-300 hover:bg-yellow-500/10"
          >
            <Shield className="mr-2 h-4 w-4" />
            Respond as Defendant
          </Button>
        )}
        {dispute.defendantResponse && !dispute.plaintiffReply && (
          <Button
            variant="outline"
            className="border-red-400/30 text-red-300 hover:bg-red-500/10"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Reply as Plaintiff
          </Button>
        )}
        <Button variant="neon" className="neon-hover ml-auto">
          <Scale className="mr-2 h-4 w-4" />
          Cast Vote
        </Button>
      </div>

      {/* Evidence Viewer Modal */}
      <EvidenceViewer />
    </motion.div>
  );
}
