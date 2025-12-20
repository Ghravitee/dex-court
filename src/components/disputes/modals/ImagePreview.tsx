import { Button } from "../../ui/button";
import type { EvidenceItem } from "../../../types";
import { ExternalLink, ImageIcon, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export const ImagePreview = ({
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
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // Load and preview the image
  useEffect(() => {
    let mounted = true;
    let objectUrl: string | null = null;

    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);

        // Fetch the image
        const response = await fetch(item.url);
        if (!response.ok) throw new Error("Failed to fetch image");

        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);

        if (mounted) {
          setImageUrl(objectUrl);

          // Get image dimensions for proper display
          const img = new Image();
          img.onload = () => {
            if (mounted) {
              setDimensions({ width: img.width, height: img.height });
              setLoading(false);
            }
          };
          img.onerror = () => {
            if (mounted) {
              setError(true);
              setLoading(false);
            }
          };
          img.src = objectUrl;
        }
      } catch (err) {
        console.error("Failed to load image:", err);
        if (mounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      mounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [item.url]);

  // Calculate display dimensions for preview
  const getPreviewDimensions = () => {
    if (!dimensions) return { width: 200, height: 150 };

    const maxWidth = 400;
    const maxHeight = 250;
    const ratio = Math.min(
      maxWidth / dimensions.width,
      maxHeight / dimensions.height,
    );

    return {
      width: dimensions.width * ratio,
      height: dimensions.height * ratio,
    };
  };

  return (
    <div
      className="relative cursor-pointer rounded-lg border border-white/10 bg-white/5 p-4"
      onClick={() => onViewEvidence(item)}
    >
      {/* Header */}
      <div className="mb-3 flex items-center gap-3">
        <ImageIcon className="h-4 w-4 text-green-400" />

        <div className="flex-1">
          <div className="text-sm font-medium text-white">{item.name}</div>
          <div className="text-xs text-gray-400">
            {dimensions
              ? `${dimensions.width} × ${dimensions.height} px`
              : "Image"}
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            window.open(item.url, "_blank");
          }}
          className="h-8 w-8 p-0 text-green-400"
        >
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>

      {/* Preview Container */}
      <div className="relative h-64 w-full overflow-hidden rounded-lg border border-white/10 bg-black/20">
        {/* Preview Image */}
        {imageUrl && !loading && !error && (
          <div className="flex h-full items-center justify-center p-2">
            <img
              src={imageUrl}
              alt={item.name}
              className="max-h-full max-w-full rounded object-contain shadow-lg"
              style={getPreviewDimensions()}
              loading="lazy"
            />
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-green-400" />
            <p className="text-sm text-white/70">Loading image preview…</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <ImageIcon className="h-10 w-10 text-red-400" />
            <p className="text-sm text-red-300">Failed to load image</p>
            <p className="mt-1 text-xs text-gray-400">{item.name}</p>
          </div>
        )}
      </div>
    </div>
  );
};
