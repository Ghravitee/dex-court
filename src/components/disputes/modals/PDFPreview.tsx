/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "../../../components/ui/button";
import type { EvidenceItem, EvidenceType } from "../../../types";
import { ExternalLink, FileText, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const PDFPreview = ({
  item,
  color,
}: {
  item: EvidenceItem;
  color: string;
  index: number;
  onViewEvidence: (evidence: EvidenceItem) => void;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load PDF as blob for preview - FIXED with proper cleanup
  useEffect(() => {
    let isMounted = true;

    // Create abort controller for cleanup
    abortControllerRef.current = new AbortController();

    const loadPdfForPreview = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        // Clean up previous blob URL
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
          setBlobUrl(null);
        }

        // Fetch the PDF with abort signal
        const response = await fetch(item.url, {
          signal: abortControllerRef.current?.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load PDF: ${response.status}`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        if (isMounted) {
          setBlobUrl(url);
          setIsLoading(false);
        }
      } catch (error: any) {
        // Don't set error if it was an abort
        if (error.name === "AbortError") return;

        console.error("Error loading PDF for preview:", error);
        if (isMounted) {
          setIsLoading(false);
          setHasError(true);
        }
      }
    };

    loadPdfForPreview();

    // Cleanup on unmount
    return () => {
      isMounted = false;

      // Abort ongoing fetch
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Cleanup blob URL
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.url]); // Only depend on item.url

  const getEvidenceIcon = (type: EvidenceType) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div
      className={`relative rounded-lg border border-${color}-400/20 bg-${color}-500/5 p-4`}
    >
      <div className="mb-3 flex items-center gap-3">
        <div className={`text-${color}-400`}>{getEvidenceIcon(item.type)}</div>
        <div className="flex-1">
          <div className="text-sm font-medium text-white">{item.name}</div>
          <div className="text-xs text-gray-400 capitalize">PDF Document</div>
        </div>

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

      {/* Improved PDF Preview */}
      <div className="relative h-64 w-full overflow-hidden rounded-lg border border-white/10 bg-black/20">
        {isLoading && !hasError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
            <Loader2 className="mb-2 h-8 w-8 animate-spin text-cyan-400" />
            <p className="text-sm text-white/70">Loading PDF preview...</p>
          </div>
        )}

        {hasError && (
          <div className="flex h-full flex-col items-center justify-center p-4 text-center">
            <FileText className="mb-3 h-12 w-12 text-red-400" />
            <p className="mb-1 font-semibold text-red-300">
              PDF Preview Unavailable
            </p>
            <p className="mb-3 text-sm text-red-200">
              The document could not be loaded for preview.
            </p>
            <Button
              onClick={() => window.open(item.url, "_blank")}
              variant="outline"
              size="sm"
              className="border-red-400/30 text-red-300 hover:bg-red-500/10"
            >
              Open PDF Directly
            </Button>
          </div>
        )}

        {!isLoading && !hasError && blobUrl && (
          <iframe
            src={`${blobUrl}#view=fitH&toolbar=0&navpanes=0`}
            title={item.name}
            width="100%"
            height="100%"
            className="rounded-lg"
            sandbox="allow-scripts allow-same-origin"
          >
            <div className="flex h-full flex-col items-center justify-center p-4 text-center">
              <FileText className="mb-2 h-10 w-10 text-yellow-400" />
              <p className="mb-2 text-sm text-yellow-300">
                PDF preview not supported in this browser.
              </p>
              <Button
                onClick={() => window.open(item.url, "_blank")}
                variant="outline"
                size="sm"
                className="border-yellow-400/30 text-yellow-300 hover:bg-yellow-500/10"
              >
                Download PDF
              </Button>
            </div>
          </iframe>
        )}
      </div>
    </div>
  );
};
