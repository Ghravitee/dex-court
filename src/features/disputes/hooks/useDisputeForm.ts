import { useState } from "react";
import { toast } from "sonner";
import {
  INITIAL_FORM_STATE,
  type DisputeFormState,
  type UploadedFile,
} from "../types/form";
import {
  MAX_TOTAL_SIZE,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
} from "../constants/fileUpload";

export function useDisputeForm() {
  const [form, setForm] = useState<DisputeFormState>(INITIAL_FORM_STATE);
  const [isDragOver, setIsDragOver] = useState(false);

  const resetForm = () => setForm(INITIAL_FORM_STATE);

  // ─── Witness helpers ────────────────────────────────────────────────────────

  const addWitness = () =>
    setForm((f) =>
      f.witnesses.length >= 5 ? f : { ...f, witnesses: [...f.witnesses, ""] },
    );

  const updateWitness = (i: number, v: string) =>
    setForm((f) => ({
      ...f,
      witnesses: f.witnesses.map((w, idx) => (idx === i ? v : w)),
    }));

  const removeWitness = (i: number) =>
    setForm((f) => ({
      ...f,
      witnesses: f.witnesses.filter((_, idx) => idx !== i),
    }));

  // ─── File helpers ───────────────────────────────────────────────────────────

  const removeFile = (id: string) =>
    setForm((prev) => ({
      ...prev,
      evidence: prev.evidence.filter((file) => file.id !== id),
    }));

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = [];
    const currentTotalSize = form.evidence.reduce(
      (total, file) => total + file.file.size,
      0,
    );

    Array.from(selectedFiles).forEach((file) => {
      const fileSizeMB = file.size / 1024 / 1024;
      const fileType = file.type.startsWith("image/") ? "image" : "document";

      if (fileType === "image" && fileSizeMB > 2) {
        toast.error(
          `Image "${file.name}" exceeds 2MB limit (${fileSizeMB.toFixed(2)}MB)`,
        );
        return;
      }
      if (fileType === "document" && fileSizeMB > 3) {
        toast.error(
          `Document "${file.name}" exceeds 3MB limit (${fileSizeMB.toFixed(2)}MB)`,
        );
        return;
      }
      if (currentTotalSize + file.size > MAX_TOTAL_SIZE) {
        toast.error(
          `Adding "${file.name}" would exceed total 50MB limit. Current total: ${(currentTotalSize / 1024 / 1024).toFixed(2)}MB`,
        );
        return;
      }
      if (
        !ALLOWED_IMAGE_TYPES.includes(file.type) &&
        !ALLOWED_DOCUMENT_TYPES.includes(file.type)
      ) {
        toast.error(
          `File "${file.name}" has unsupported type. Allowed: images (JPEG, PNG, GIF, WebP), PDFs, Word docs, text files`,
        );
        return;
      }

      const newFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        type: fileType,
        size: fileSizeMB.toFixed(2) + " MB",
      };

      newFiles.push(newFile);

      if (fileType === "image") {
        const reader = new FileReader();
        reader.onload = (ev) => {
          newFile.preview = ev.target?.result as string;
          setForm((prev) => ({
            ...prev,
            evidence: prev.evidence.map((f) =>
              f.id === newFile.id ? { ...f, preview: newFile.preview } : f,
            ),
          }));
        };
        reader.readAsDataURL(file);
      }
    });

    if (newFiles.length > 0) {
      setForm((prev) => ({
        ...prev,
        evidence: [...prev.evidence, ...newFiles],
      }));
    }
  };

  // ─── Drag & drop ────────────────────────────────────────────────────────────

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles) return;

    const dataTransfer = new DataTransfer();
    Array.from(droppedFiles).forEach((file) => dataTransfer.items.add(file));

    handleFileSelect({
      target: { files: dataTransfer.files },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  return {
    form,
    setForm,
    resetForm,
    isDragOver,
    addWitness,
    updateWitness,
    removeWitness,
    removeFile,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
