/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "../../../components/ui/button";
import type { EvidenceItem } from "../../../types";
import { Download, FileText, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ================= PDF.js =================
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url,
).toString();
// ==========================================

export const PDFPreview = ({
  item,
  onViewEvidence,
}: {
  item: EvidenceItem;
  color: string;
  index: number;
  onViewEvidence: (evidence: EvidenceItem) => void;
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfRef = useRef<any>(null);

  // ================= FETCH PDF =================
  useEffect(() => {
    let mounted = true;
    let localBlobUrl: string | null = null;

    const load = async () => {
      try {
        setLoading(true);
        setError(false);

        const res = await fetch(item.url);
        if (!res.ok) throw new Error("Failed to fetch PDF");

        const blob = await res.blob();
        localBlobUrl = URL.createObjectURL(blob);

        if (mounted) setBlobUrl(localBlobUrl);
      } catch (err) {
        console.error(err);
        if (mounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
      if (localBlobUrl) URL.revokeObjectURL(localBlobUrl);
      pdfRef.current?.destroy?.();
      pdfRef.current = null;
    };
  }, [item.url]);

  // ================= RENDER FIRST PAGE =================
  useEffect(() => {
    if (!blobUrl || !canvasRef.current) return;

    let cancelled = false;

    const render = async () => {
      try {
        const pdf =
          pdfRef.current ??
          (pdfRef.current = await pdfjsLib.getDocument(blobUrl).promise);

        const page = await pdf.getPage(1);
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
        canvas.style.maxWidth = "100%";
        canvas.style.display = "block";

        await page.render({
          canvasContext: ctx,
          viewport: scaledViewport,
        }).promise;

        if (!cancelled) setLoading(false);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    };

    render();

    return () => {
      cancelled = true;
    };
  }, [blobUrl]);

  return (
    <div
      className="relative cursor-pointer rounded-lg border border-white/10 bg-white/5 p-4"
      onClick={() => onViewEvidence(item)}
    >
      {/* Header */}
      <div className="mb-3 flex items-center gap-3">
        <FileText className="h-4 w-4 text-cyan-400" />

        <div className="flex-1">
          {/* <div className="text-sm font-medium text-white">{item.name}</div> */}
          <div className="text-xs text-gray-400">PDF Document</div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            window.open(item.url, "_blank");
          }}
          className="h-8 w-8 p-0 text-cyan-400"
        >
          <Download className="h-3 w-3" />
        </Button>
      </div>

      {/* Preview */}
      <div className="relative h-64 w-full overflow-x-hidden overflow-y-auto rounded-lg border border-white/10 bg-black/20">
        {/* Canvas is ALWAYS mounted */}
        <canvas
          ref={canvasRef}
          className="mx-auto block rounded-lg shadow-lg"
        />

        {loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            <p className="text-sm text-white/70">Loading preview…</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <FileText className="h-10 w-10 text-red-400" />
            <p className="text-sm text-red-300">Preview unavailable</p>
          </div>
        )}
      </div>
    </div>
  );
};
