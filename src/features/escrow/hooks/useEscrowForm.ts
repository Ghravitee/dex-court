import { useState } from "react";
import { toast } from "sonner";
import { validateFile } from "../utils/validators";
import { initialFormState } from "../types";
import type {
  EscrowFormState,
  EscrowType,
  Milestone,
  UploadedFile,
} from "../types";

export function useEscrowForm() {
  const [form, setForm] = useState<EscrowFormState>(initialFormState);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [escrowType, setEscrowType] = useState<EscrowType>("myself");

  const resetForm = () => {
    setForm(initialFormState);
    setDeadline(null);
    setEscrowType("myself");
  };

  // ─── File upload ───────────────────────────────────────────────────────────

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;

    const newFiles: UploadedFile[] = [];

    Array.from(selected).forEach((file) => {
      const error = validateFile(file, [...form.evidence, ...newFiles]);
      if (error) {
        toast.error(error);
        return;
      }

      const fileType = file.type.startsWith("image/") ? "image" : "document";
      const sizeMB = (file.size / 1024 / 1024).toFixed(2) + " MB";

      const newFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        type: fileType,
        size: sizeMB,
      };

      newFiles.push(newFile);

      if (fileType === "image") {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const preview = ev.target?.result as string;
          setForm((prev) => ({
            ...prev,
            evidence: prev.evidence.map((f) =>
              f.id === newFile.id ? { ...f, preview } : f,
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

      if (newFiles.length === 1) {
        toast.success(`Added ${newFiles[0].file.name}`, {
          description: `Size: ${newFiles[0].size}, Type: ${newFiles[0].type}`,
        });
      } else {
        toast.success(`Added ${newFiles.length} files`);
      }
    }
  };

  const removeFile = (id: string) => {
    setForm((prev) => ({
      ...prev,
      evidence: prev.evidence.filter((f) => f.id !== id),
    }));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dataTransfer = new DataTransfer();
    Array.from(e.dataTransfer.files).forEach((f) => dataTransfer.items.add(f));
    handleFileSelect({
      target: { files: dataTransfer.files },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  // ─── Milestone helpers ────────────────────────────────────────────────────

  const addMilestone = () => {
    const empty: Milestone = { percent: "", date: null };
    setForm((prev) => ({ ...prev, milestones: [...prev.milestones, empty] }));
  };

  const updateMilestone = (idx: number, patch: Partial<Milestone>) => {
    setForm((prev) => {
      const next: Milestone[] = prev.milestones.map((m, i) =>
        i === idx ? { ...m, ...patch } : m,
      );
      return { ...prev, milestones: next };
    });
  };

  const removeMilestone = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== idx),
    }));
  };

  return {
    form,
    setForm,
    deadline,
    setDeadline,
    escrowType,
    setEscrowType,
    resetForm,
    // file
    handleFileSelect,
    removeFile,
    handleDrop,
    // milestones
    addMilestone,
    updateMilestone,
    removeMilestone,
  };
}
