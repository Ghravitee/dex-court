import { useRef, useState } from "react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  X,
  FileText,
  Loader2,
  Info,
  Calendar,
  Upload,
  Paperclip,
  Trash2,
  User,
  Users,
  ChevronDown,
  CheckCircle,
} from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { PartiesFields } from "./PartiesFields";
import { FundsSection } from "./FundsSection";
import { useAgreementForm } from "../../hooks/useAgreementForm";
import { useAgreementSubmit } from "../../hooks/useAgreementSubmit";
import { useUserSearch } from "../../hooks/useUserSearch";
import { TYPE_OPTIONS } from "../../constants/enums";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Reusable inline feedback — matches the pattern from EscrowForm
function FieldError({ message }: { message: string }) {
  return <div className="mt-1 text-xs text-red-400">{message}</div>;
}

function FieldSuccess({ message }: { message: string }) {
  return (
    <div className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
      <CheckCircle className="h-3 w-3" />
      {message}
    </div>
  );
}

export const CreateAgreementModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const formHook = useAgreementForm();
  const userSearch = useUserSearch();
  const { handleSubmit, isSubmitting } = useAgreementSubmit();

  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const typeRef = useRef<HTMLDivElement>(null);

  // Local touched state for fields not covered by the useAgreementForm
  // validation system (agreementType and typeValue dropdowns).
  const [localTouched, setLocalTouched] = useState({
    agreementType: false,
    typeValue: false,
  });

  const touchLocal = (field: keyof typeof localTouched) =>
    setLocalTouched((prev) => ({ ...prev, [field]: true }));

  if (!isOpen) return null;

  const {
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
  } = formHook;

  const handleClose = () => {
    resetForm();
    setLocalTouched({ agreementType: false, typeValue: false });
    onClose();
  };

  const onFormSuccess = () => {
    resetForm();
    setLocalTouched({ agreementType: false, typeValue: false });
    onClose();
    onSuccess();
  };

  // On submit, mark every field as touched so all errors surface at once.
  const handleFormSubmit = (e: React.FormEvent) => {
    setLocalTouched({ agreementType: true, typeValue: true });
    // Also touch the fields managed by useAgreementForm
    updateValidation("title", form.title);
    updateValidation("description", form.description);
    handleSubmit(e, {
      form,
      agreementType,
      typeValue,
      deadline,
      includeFunds,
      secureWithEscrow,
      selectedToken,
      customTokenAddress,
      fundsWithoutEscrow,
      onSuccess: onFormSuccess,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <form
        onSubmit={handleFormSubmit}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-2xl space-y-5 overflow-y-auto rounded-[0.75rem] border border-white/10 bg-gradient-to-br from-cyan-500/10 p-6"
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3 right-3 text-cyan-300 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="border-b border-white/10 pb-3">
          <h2 className="text-lg font-semibold text-white/90">
            Create New Agreement
          </h2>
          <p className="text-muted-foreground text-sm">
            Provide agreement details and supporting documents
          </p>
        </div>

        {/* Agreement type */}
        <div>
          <label className="text-muted-foreground mb-3 block text-sm font-semibold">
            Who is this agreement for? <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                value: "myself",
                Icon: User,
                label: "Myself & Counterparty",
                sub: "Agreement between you and someone else",
              },
              {
                value: "others",
                Icon: Users,
                label: "Two Other Parties",
                sub: "Agreement between two other users",
              },
            ].map(({ value, Icon, label, sub }) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  touchLocal("agreementType");
                  setAgreementType(value as "myself" | "others");
                }}
                className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-all ${
                  agreementType === value
                    ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                    : "border-white/10 bg-white/5 text-white/70 hover:border-cyan-400/40"
                }`}
              >
                <Icon className="mb-2 h-6 w-6" />
                <span className="text-sm font-medium">{label}</span>
                <span className="mt-1 text-xs opacity-70">{sub}</span>
              </button>
            ))}
          </div>
          {/* Agreement type has an implicit default so only show error if
              somehow neither option is selected after interaction. */}
          {localTouched.agreementType && !agreementType && (
            <FieldError message="Please select who this agreement is for" />
          )}
        </div>

        {/* Title */}
        <div>
          <label className="space mb-2 block font-semibold text-white">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            value={form.title}
            onChange={(e) => {
              setForm({ ...form, title: e.target.value });
              updateValidation("title", e.target.value);
            }}
            onBlur={() => updateValidation("title", form.title)}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
            placeholder="e.g. Design Sprint Phase 1"
            required
          />
          {validation.title.isTouched && (
            <div
              className={`mt-1 flex items-center gap-1 text-xs ${
                validation.title.isValid ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {validation.title.isValid && <CheckCircle className="h-3 w-3" />}
              {validation.title.message}
            </div>
          )}
        </div>

        {/* Type + Parties */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Type dropdown */}
          <div className="relative flex w-full flex-col gap-2" ref={typeRef}>
            <label className="space text-sm font-semibold text-white">
              Type <span className="text-red-500">*</span>
            </label>
            <div
              onClick={() => {
                touchLocal("typeValue");
                setIsTypeOpen((p) => !p);
              }}
              className="flex cursor-pointer items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
            >
              <span>{typeValue || "Select Type"}</span>
              <ChevronDown
                className={`transition-transform ${isTypeOpen ? "rotate-180" : ""}`}
              />
            </div>
            {isTypeOpen && (
              <div className="absolute top-[110%] z-50 w-full rounded-xl border border-white/10 bg-cyan-900/80 shadow-lg backdrop-blur-md">
                {TYPE_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => {
                      setTypeValue(option.value as "Public" | "Private");
                      setIsTypeOpen(false);
                    }}
                    className="cursor-pointer px-4 py-2 text-sm text-white/80 transition-colors hover:bg-cyan-500/30 hover:text-white"
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
            {localTouched.typeValue && !typeValue && (
              <FieldError message="Please select agreement type" />
            )}
            {localTouched.typeValue && typeValue && (
              <FieldSuccess message="Type selected" />
            )}
          </div>

          {/* Parties */}
          <PartiesFields
            agreementType={agreementType}
            form={form}
            setForm={setForm}
            validation={validation}
            updateValidation={updateValidation}
            userSearch={userSearch}
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-muted-foreground mb-2 block text-sm">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => {
              setForm({ ...form, description: e.target.value });
              updateValidation("description", e.target.value);
            }}
            onBlur={() => updateValidation("description", form.description)}
            className="min-h-28 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
            placeholder="Scope, deliverables, timelines..."
            required
          />
          {validation.description.isTouched && (
            <div
              className={`mt-1 flex items-center gap-1 text-xs ${
                validation.description.isValid
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {validation.description.isValid && (
                <CheckCircle className="h-3 w-3" />
              )}
              {validation.description.message}
            </div>
          )}
          <div className="mt-1 flex items-center gap-1">
            <Info className="size-4 text-cyan-300" />
            <p className="text-xs text-cyan-300/80">
              If you'd like to add videos, simply add the link to the video URL
              in the description.
            </p>
          </div>
        </div>

        {/* File upload */}
        <div>
          <label className="text-muted-foreground mb-2 block text-sm">
            Upload Supporting Documents
          </label>
          <div
            className={`group relative cursor-pointer rounded-md border border-dashed transition-colors ${
              isDragOver
                ? "border-cyan-400/60 bg-cyan-500/20"
                : "border-white/15 bg-white/5 hover:border-cyan-400/40"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              onChange={handleFileSelect}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              className="hidden"
              id="agreement-upload"
            />
            <label
              htmlFor="agreement-upload"
              className="flex cursor-pointer flex-col items-center justify-center px-4 py-8 text-center"
            >
              <Upload className="mb-3 h-8 w-8 text-cyan-400" />
              <div className="text-sm text-cyan-300">
                {isDragOver
                  ? "Drop files here"
                  : "Click to upload or drag and drop"}
              </div>
              <div className="text-muted-foreground mt-1 text-xs">
                Supports images{" "}
                <span className="text-yellow-300">(max 2MB)</span>, documents{" "}
                <span className="text-yellow-300">(max 3MB)</span>
              </div>
            </label>
          </div>

          {form.images.length > 0 && (
            <div className="mt-4 space-y-3">
              <h4 className="text-sm font-medium text-cyan-200">
                Selected Files ({form.images.length})
              </h4>
              {form.images.map((file) => (
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
                    onClick={() => removeFile(file.id)}
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deadline */}
        <div>
          <label className="text-muted-foreground mb-2 block text-sm">
            Deadline <span className="text-cyan-400">(Optional)</span>
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Calendar className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cyan-300" />
              <ReactDatePicker
                selected={deadline}
                onChange={(date) => setDeadline(date)}
                placeholderText="Select a date (optional)"
                dateFormat="dd/MM/yyyy"
                className="w-full cursor-pointer rounded-md border border-white/10 bg-white/5 py-2 pr-3 pl-10 text-white outline-none placeholder:text-white/50 focus:border-cyan-400/40"
                calendarClassName="!bg-cyan-700 !text-white rounded-lg border border-white/10"
                popperClassName="z-50"
                minDate={new Date()}
                isClearable
                clearButtonTitle="Clear deadline"
              />
            </div>
            {deadline && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeadline(null)}
                className="border-amber-400/30 text-amber-300 hover:bg-amber-500/10"
              >
                <X className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">Clear</span>
              </Button>
            )}
          </div>
          <div className="mt-1 flex items-start gap-1">
            <Info className="mt-0.5 h-3 w-3 flex-shrink-0 text-cyan-300/70" />
            <p className="text-xs text-cyan-300/70">
              {deadline
                ? `Deadline set to: ${deadline.toLocaleDateString()}`
                : "Optional: If no deadline is set, the agreement will remain active until completed or cancelled."}
            </p>
          </div>
        </div>

        {/* Funds */}
        <FundsSection
          includeFunds={includeFunds}
          setIncludeFunds={setIncludeFunds}
          secureWithEscrow={secureWithEscrow}
          setSecureWithEscrow={setSecureWithEscrow}
          selectedToken={selectedToken}
          setSelectedToken={setSelectedToken}
          customTokenAddress={customTokenAddress}
          setCustomTokenAddress={setCustomTokenAddress}
          fundsWithoutEscrow={fundsWithoutEscrow}
          setFundsWithoutEscrow={setFundsWithoutEscrow}
          validation={validation}
          updateValidation={updateValidation}
        />

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="submit"
            variant="neon"
            className="neon-hover"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Create Agreement
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
