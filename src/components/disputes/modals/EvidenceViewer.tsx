/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "../../../components/ui/button";
import type { EvidenceItem } from "../../../types";
import { FileText, Loader2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

// ================= PDF.js =================
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url,
).toString();
// ==========================================

// ================== Evidence Viewer ==================
export const EvidenceViewer = ({
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
  // Add these optional props
  onPdfLoad?: () => void;
  onPdfError?: () => void;
  pdfLoading?: boolean;
  pdfError?: boolean;
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfRef = useRef<any>(null);

  useEffect(() => {
    if (!selectedEvidence) return;

    let mounted = true;
    let localBlobUrl: string | null = null;

    const load = async () => {
      try {
        setLoading(true);
        setError(false);
        setCurrentPage(1);
        setNumPages(0);

        const res = await fetch(selectedEvidence.url);
        if (!res.ok) throw new Error("Fetch failed");

        const blob = await res.blob();
        localBlobUrl = URL.createObjectURL(blob);

        if (mounted) setBlobUrl(localBlobUrl);
      } catch (err) {
        console.error(err);
        if (mounted) setError(true);
        onPdfError?.(); // Call error handler if provided
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
      if (localBlobUrl) URL.revokeObjectURL(localBlobUrl);
      pdfRef.current?.destroy?.();
      pdfRef.current = null;
    };
  }, [selectedEvidence, onPdfError]);

  // Render PDF page
  useEffect(() => {
    if (!blobUrl || !canvasRef.current || selectedEvidence?.type !== "pdf")
      return;

    let cancelled = false;

    const render = async () => {
      try {
        const pdf =
          pdfRef.current ??
          (pdfRef.current = await pdfjsLib.getDocument(blobUrl).promise);

        if (!cancelled && numPages === 0) setNumPages(pdf.numPages);

        const page = await pdf.getPage(currentPage);
        if (cancelled) return;

        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;
        const viewport = page.getViewport({ scale: 1 });
        const container = canvas.parentElement!;
        const width = container.clientWidth || viewport.width;

        const scale = width / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        canvas.style.display = "block";
        canvas.style.maxWidth = "100%";

        await page.render({ canvasContext: ctx, viewport: scaledViewport })
          .promise;

        if (!cancelled) onPdfLoad?.(); // Call load handler when PDF renders successfully
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(true);
          onPdfError?.(); // Call error handler
        }
      }
    };

    render();

    return () => {
      cancelled = true;
    };
  }, [blobUrl, currentPage, numPages, selectedEvidence, onPdfLoad, onPdfError]);

  if (!isOpen || !selectedEvidence) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          className="relative h-[90vh] w-full max-w-4xl rounded-2xl bg-gray-900 p-6"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
        >
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              {selectedEvidence.name}
            </h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X />
            </Button>
          </div>

          {/* Loading */}
          {(loading || pdfLoading) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
            </div>
          )}

          {/* Error */}
          {(error || pdfError) && (
            <div className="flex h-full flex-col items-center justify-center">
              <FileText className="h-12 w-12 text-red-400" />
              <p className="text-red-300">
                Failed to load {selectedEvidence.type}
              </p>
            </div>
          )}

          {/* PDF */}
          {!loading &&
            !error &&
            !pdfLoading &&
            !pdfError &&
            selectedEvidence.type === "pdf" && (
              <>
                <div className="h-[70vh] overflow-x-hidden overflow-y-auto">
                  <canvas ref={canvasRef} className="rounded-lg shadow-xl" />
                </div>

                {numPages > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-4">
                    <Button
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      <ChevronLeft />
                    </Button>

                    <span className="text-cyan-300">
                      Page {currentPage} / {numPages}
                    </span>

                    <Button
                      size="sm"
                      disabled={currentPage >= numPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      <ChevronRight />
                    </Button>
                  </div>
                )}
              </>
            )}

          {/* IMAGE */}
          {!loading &&
            !error &&
            !pdfLoading &&
            !pdfError &&
            selectedEvidence.type === "image" &&
            blobUrl && (
              <div className="flex h-[70vh] items-center justify-center overflow-auto">
                <img
                  src={blobUrl}
                  alt={selectedEvidence.name}
                  className="max-h-full max-w-full rounded-lg"
                />
              </div>
            )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EvidenceViewer;
