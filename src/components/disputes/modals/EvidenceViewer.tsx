import { Button } from "../../../components/ui/button";
import type { EvidenceItem, EvidenceType } from "../../../types";
import {
  ExternalLink,
  FileText,
  ImageIcon,
  Loader2,
  MessageSquare,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback } from "react";

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
        return <FileText className="h-4 w-4" />;
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
            <FileText className="h-16 w-16 text-cyan-400" />
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

export default EvidenceViewer;
