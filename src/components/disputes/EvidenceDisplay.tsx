import { ExternalLink, FileText, ImageIcon, MessageSquare } from "lucide-react";
import { Button } from "../ui/button";
import type { EvidenceItem, EvidenceType } from "../../types";
import { PDFPreview } from "./modals/PDFPreview";

// Evidence Display Component
export const EvidenceDisplay = ({
  evidence,
  color,
  onViewEvidence,
}: {
  evidence: EvidenceItem[];
  color: string;
  onViewEvidence: (evidence: EvidenceItem) => void;
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

  // Regular evidence item component (non-PDF)
  const RegularEvidenceItem = ({ item }: { item: EvidenceItem }) => (
    <div
      className={`relative flex items-center gap-2 rounded-lg border border-${color}-400/20 bg-${color}-500/5 p-4 transition-colors hover:bg-${color}-500/10 cursor-pointer`}
      onClick={() => onViewEvidence(item)}
    >
      <div className={`text-${color}-400`}>{getEvidenceIcon(item.type)}</div>
      <div className="">
        <div className="text-sm font-medium break-all text-white">
          {item.name}
        </div>
        <div className="text-xs text-gray-400 capitalize">
          {item.type === "transaction"
            ? "View on Etherscan"
            : "Click to preview"}
        </div>
      </div>
      <div className="absolute top-2 right-2">
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

  return (
    <div className="space-y-3">
      {evidence.map((item, index) => {
        if (item.type === "pdf") {
          return (
            <PDFPreview
              key={index}
              item={item}
              color={color}
              index={index}
              onViewEvidence={onViewEvidence}
            />
          );
        } else {
          return <RegularEvidenceItem key={index} item={item} />;
        }
      })}
    </div>
  );
};
