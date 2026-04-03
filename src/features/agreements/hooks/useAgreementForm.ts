import { useState } from "react";
import { toast } from "sonner";
import {
  INITIAL_FORM_STATE,
  INITIAL_VALIDATION,
  type AgreementFormState,
  type AgreementType,
  type FormValidation,
  type UploadedFile,
} from "../types/form";
import { getValidationState } from "../utils/formatters";

export function useAgreementForm() {
  const [form, setForm] = useState<AgreementFormState>(INITIAL_FORM_STATE);
  const [validation, setValidation] =
    useState<FormValidation>(INITIAL_VALIDATION);
  const [agreementType, setAgreementType] = useState<AgreementType>("myself");
  const [typeValue, setTypeValue] = useState<"Public" | "Private" | "">("");
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [includeFunds, setIncludeFunds] = useState<"yes" | "no" | "">("");
  const [secureWithEscrow, setSecureWithEscrow] = useState<"yes" | "no" | "">(
    "",
  );
  const [selectedToken, setSelectedToken] = useState("");
  const [customTokenAddress, setCustomTokenAddress] = useState("");
  const [fundsWithoutEscrow, setFundsWithoutEscrow] = useState({
    token: "",
    amount: "",
    customTokenAddress: "",
  });
  const [isDragOver, setIsDragOver] = useState(false);

  // ─── Validation ─────────────────────────────────────────────────────────────

  const updateValidation = (field: keyof FormValidation, value: string) => {
    const state = getValidationState(field, value);
    setValidation((prev) => ({
      ...prev,
      [field]: { ...state, isTouched: true },
    }));
  };

  // ─── File upload ─────────────────────────────────────────────────────────────

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

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

      const newFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        type: fileType,
        size: fileSizeMB.toFixed(2) + " MB",
      };

      if (fileType === "image") {
        const reader = new FileReader();
        reader.onload = (ev) => {
          newFile.preview = ev.target?.result as string;
          setForm((prev) => ({ ...prev, images: [...prev.images, newFile] }));
        };
        reader.readAsDataURL(file);
      } else {
        setForm((prev) => ({ ...prev, images: [...prev.images, newFile] }));
      }
    });
  };

  const removeFile = (id: string) =>
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((f) => f.id !== id),
    }));

  // ─── Drag and drop ───────────────────────────────────────────────────────────

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

  // ─── Reset ───────────────────────────────────────────────────────────────────

  const resetForm = () => {
    setForm(INITIAL_FORM_STATE);
    setValidation(INITIAL_VALIDATION);
    setTypeValue("");
    setDeadline(null);
    setIncludeFunds("");
    setSecureWithEscrow("");
    setSelectedToken("");
    setCustomTokenAddress("");
    setAgreementType("myself");
    setFundsWithoutEscrow({ token: "", amount: "", customTokenAddress: "" });
  };

  return {
    form,
    setForm,
    validation,
    updateValidation,
    agreementType,
    setAgreementType,
    typeValue,
    setTypeValue,
    deadline,
    setDeadline,
    includeFunds,
    setIncludeFunds,
    secureWithEscrow,
    setSecureWithEscrow,
    selectedToken,
    setSelectedToken,
    customTokenAddress,
    setCustomTokenAddress,
    fundsWithoutEscrow,
    setFundsWithoutEscrow,
    isDragOver,
    handleFileSelect,
    removeFile,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    resetForm,
  };
}
