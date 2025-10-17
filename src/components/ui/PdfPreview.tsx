import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, Loader2, FileText } from "lucide-react";
import { Button } from "./button";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFPreviewProps {
  url: string;
  onLoad?: () => void;
  onError?: () => void;
  width?: number;
  height?: number;
}

export default function PdfPreview({
  url,
  onLoad,
  onError,
  width = 350,
}: PDFPreviewProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setIsLoading(false);
    onLoad?.();
  }

  function onDocumentLoadError(error: Error) {
    console.error("PDF loading error:", error);
    setIsLoading(false);
    setHasError(true);
    onError?.();
  }

  const goToPreviousPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => (numPages ? Math.min(prev + 1, numPages) : prev));
  };

  if (hasError) {
    return (
      <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-white/10 bg-black/20 p-4 text-center">
        <FileText className="mb-3 h-10 w-10 text-red-400" />
        <p className="font-semibold text-red-300">Failed to load PDF</p>
        <p className="mt-1 text-sm text-red-200">
          The document could not be previewed.
        </p>
      </div>
    );
  }

  return (
    <div className="pdf-preview">
      {isLoading && (
        <div className="flex h-40 items-center justify-center rounded-lg border border-white/10 bg-black/20">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
          <span className="ml-2 text-sm text-white/70">Loading PDF...</span>
        </div>
      )}

      <Document
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={null} // We handle loading state above
        error={null} // We handle error state above
      >
        <Page
          pageNumber={pageNumber}
          width={width}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className="rounded-lg border border-white/10"
        />
      </Document>

      {numPages && numPages > 1 && (
        <div className="mt-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousPage}
            disabled={pageNumber <= 1}
            className="h-8 px-2 text-white/70 hover:text-white disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-sm text-white/70">
            Page {pageNumber} of {numPages}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="h-8 px-2 text-white/70 hover:text-white disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
