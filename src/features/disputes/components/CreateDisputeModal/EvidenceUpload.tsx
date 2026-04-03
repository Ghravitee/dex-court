import { Upload, Paperclip, Trash2 } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import type { UploadedFile } from "../../types/form";
import { getTotalFileSize } from "../../utils/formatters";

interface Props {
  evidence: UploadedFile[];
  isDragOver: boolean;
  isDisabled: boolean;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

export const EvidenceUpload = ({
  evidence,
  isDragOver,
  isDisabled,
  onFileSelect,
  onRemoveFile,
  onDragOver,
  onDragLeave,
  onDrop,
}: Props) => (
  <div>
    <label className="text-muted-foreground mb-2 block text-sm">
      Evidence Upload <span className="text-red-500">*</span>
      {evidence.length > 0 && (
        <span className="ml-2 text-xs text-yellow-400">
          (Total: {getTotalFileSize(evidence)})
        </span>
      )}
    </label>

    {/* Drop zone */}
    <div
      className={`group relative cursor-pointer rounded-md border border-dashed transition-colors ${
        isDragOver
          ? "border-cyan-400/60 bg-cyan-500/20"
          : "border-white/15 bg-white/5 hover:border-cyan-400/40"
      } ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input
        onChange={onFileSelect}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt"
        className="hidden"
        id="evidence-upload"
        disabled={isDisabled}
      />
      <label
        htmlFor="evidence-upload"
        className={`flex cursor-pointer flex-col items-center justify-center px-4 py-8 text-center ${
          isDisabled ? "cursor-not-allowed" : ""
        }`}
      >
        <Upload className="mb-3 h-8 w-8 text-cyan-400" />
        <div className="text-sm text-cyan-300">
          {isDragOver ? "Drop files here" : "Click to upload or drag and drop"}
        </div>
        <div className="text-muted-foreground mt-1 text-xs">
          Supports images <span className="text-yellow-300">(max 2MB)</span>,
          documents <span className="text-yellow-300">(max 3MB)</span>
          <br />
          <span className="text-yellow-300">Max total size: 50MB</span>
        </div>
      </label>
    </div>

    {/* File list */}
    {evidence.length > 0 && (
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-cyan-200">
            Selected Files ({evidence.length})
          </h4>
          <div className="text-xs text-yellow-400">
            Total: {getTotalFileSize(evidence)}
          </div>
        </div>

        {evidence.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between rounded-lg border border-cyan-400/20 bg-cyan-500/5 p-3"
          >
            <div className="flex items-center gap-3">
              {file.type === "image" && file.preview ? (
                <img
                  src={file.preview}
                  alt={file.file.name}
                  className="h-10 w-10 rounded object-cover"
                />
              ) : (
                <Paperclip className="h-5 w-5 text-cyan-400" />
              )}
              <div>
                <div className="text-sm font-medium text-white">
                  {file.file.name}
                </div>
                <div className="text-xs text-cyan-200/70">
                  {file.size} • {file.type}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveFile(file.id)}
              className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
              disabled={isDisabled}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    )}
  </div>
);
