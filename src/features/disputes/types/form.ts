export interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  type: "image" | "document";
  size: string;
}

export interface DisputeFormState {
  title: string;
  kind: "Pro Bono" | "Paid";
  defendant: string;
  description: string;
  claim: string;
  evidence: UploadedFile[];
  witnesses: string[];
}

export const INITIAL_FORM_STATE: DisputeFormState = {
  title: "",
  kind: "Pro Bono",
  defendant: "",
  description: "",
  claim: "",
  evidence: [],
  witnesses: [""],
};
