/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "../../../components/ui/button";
import { FileText, Loader2, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { EvidenceItem } from "../../../types";

// ================= pdf.js =================
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
// ==========================================

export const EvidenceViewer = ({
  isOpen,
  onClose,
  selectedEvidence,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedEvidence: EvidenceItem | null;
}) => {
  const pdfRef = useRef<any>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // ================= IMAGE LOADER =================
  useEffect(() => {
    if (!selectedEvidence || selectedEvidence.type !== "image") return;

    let cancelled = false;
    let localUrl: string | null = null;

    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);

        const res = await fetch(selectedEvidence.url);
        if (!res.ok) throw new Error("Image fetch failed");

        const blob = await res.blob();
        localUrl = URL.createObjectURL(blob);

        if (!cancelled) setImageUrl(localUrl);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadImage();

    return () => {
      cancelled = true;
      if (localUrl) URL.revokeObjectURL(localUrl);
    };
  }, [selectedEvidence]);

  // ================= PDF LOADER =================
  useEffect(() => {
    if (!selectedEvidence || selectedEvidence.type !== "pdf") return;

    let cancelled = false;

    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(false);
        setCurrentPage(1);

        const task = pdfjsLib.getDocument({
          url: selectedEvidence.url,
          withCredentials: false,
        });

        const pdf = await task.promise;
        if (cancelled) return;

        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
      } catch (e) {
        console.error("PDF load error:", e);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
      pdfRef.current?.destroy?.();
      pdfRef.current = null;
    };
  }, [selectedEvidence]);

  // ================= PDF PAGE RENDER =================
  useEffect(() => {
    if (
      !pdfRef.current ||
      !canvasContainerRef.current ||
      selectedEvidence?.type !== "pdf"
    )
      return;

    let cancelled = false;

    const renderPage = async () => {
      try {
        setLoading(true);

        const page = await pdfRef.current.getPage(currentPage);
        if (cancelled) return;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const viewport = page.getViewport({ scale: 1 });
        const containerWidth =
          canvasContainerRef.current!.clientWidth || viewport.width;

        const scale = containerWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        canvas.width = Math.floor(scaledViewport.width);
        canvas.height = Math.floor(scaledViewport.height);

        // Clear old canvas safely
        canvasContainerRef.current!.innerHTML = "";
        canvasContainerRef.current!.appendChild(canvas);

        await page.render({
          canvasContext: ctx,
          viewport: scaledViewport,
        }).promise;
      } catch (e) {
        console.error("PDF render error:", e);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    renderPage();

    return () => {
      cancelled = true;
    };
  }, [currentPage, numPages, selectedEvidence]);

  // ================= RESET ON CLOSE =================
  useEffect(() => {
    if (!isOpen) {
      setCurrentPage(1);
      setNumPages(0);
      setError(false);
      setImageUrl(null);
      pdfRef.current = null;

      if (canvasContainerRef.current) {
        canvasContainerRef.current.innerHTML = "";
      }
    }
  }, [isOpen]);

  if (!isOpen || !selectedEvidence) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          className="relative h-[85vh] w-full max-w-4xl rounded-2xl bg-gray-900 p-6"
        >
          {/* Header */}
          <div className="mt-10 mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              {selectedEvidence.name}
            </h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X />
            </Button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex h-full flex-col items-center justify-center">
              <FileText className="h-12 w-12 text-red-400" />
              <p className="text-red-300">Failed to load file</p>
            </div>
          )}

          {/* PDF */}
          {!loading && !error && selectedEvidence.type === "pdf" && (
            <>
              <div
                ref={canvasContainerRef}
                className="flex h-[70vh] justify-center overflow-auto"
              />

              {numPages > 1 && (
                <div className="mt-4 flex justify-center gap-4">
                  <Button
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    <ChevronLeft />
                  </Button>
                  <span className="text-cyan-300">
                    {currentPage} / {numPages}
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
            selectedEvidence.type === "image" &&
            imageUrl && (
              <div className="flex h-[70vh] items-center justify-center">
                <img
                  src={imageUrl}
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
