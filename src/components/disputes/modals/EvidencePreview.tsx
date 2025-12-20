/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "../../../components/ui/button";
import type { EvidenceItem } from "../../../types";
import { FileText, Loader2, ImageIcon, ExternalLink } from "lucide-react";

import { useEffect, useRef, useState } from "react";

// ================= PDF.js =================
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url,
).toString();

export const EvidencePreview = ({
  item,
  onViewEvidence,
  color,
}: {
  item: EvidenceItem;
  color: string;
  onViewEvidence: (evidence: EvidenceItem) => void;
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    let localBlobUrl: string | null = null;

    const load = async () => {
      try {
        setLoading(true);
        setError(false);

        const res = await fetch(item.url);
        if (!res.ok) throw new Error("Fetch failed");

        const blob = await res.blob();
        localBlobUrl = URL.createObjectURL(blob);

        if (mounted) setBlobUrl(localBlobUrl);
      } catch (err) {
        console.error(err);
        if (mounted) setError(true);
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
  }, [item.url]);

  // Render first page if PDF
  useEffect(() => {
    if (!blobUrl || !canvasRef.current || item.type !== "pdf") return;

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

        await page.render({ canvasContext: ctx, viewport: scaledViewport })
          .promise;
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(true);
      }
    };

    render();

    return () => {
      cancelled = true;
    };
  }, [blobUrl, item]);

  return (
    <div
      className={`relative cursor-pointer rounded-lg border border-${color}-400/20 bg-${color}-500/5 p-4`}
      onClick={() => onViewEvidence(item)}
    >
      <div className="mb-3 flex items-center gap-3">
        {item.type === "image" ? (
          <ImageIcon className="h-4 w-4 text-cyan-400" />
        ) : (
          <FileText className="h-4 w-4 text-cyan-400" />
        )}
        <div className="flex-1">
          <div className="text-sm font-medium text-white">{item.name}</div>
          <div className="text-xs text-gray-400">{item.type.toUpperCase()}</div>
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
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>

      <div className="relative flex h-64 w-full items-center justify-center overflow-auto rounded-lg border border-white/10 bg-black/20">
        {item.type === "image" && blobUrl && (
          <img
            src={blobUrl}
            alt={item.name}
            className="max-h-full max-w-full rounded-lg"
          />
        )}

        {item.type === "pdf" && (
          <canvas
            ref={canvasRef}
            className="mx-auto block rounded-lg shadow-lg"
          />
        )}

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
