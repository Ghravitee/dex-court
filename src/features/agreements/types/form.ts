export interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  type: "image" | "document";
  size: string;
}

export type AgreementType = "myself" | "others";

export interface AgreementFormState {
  title: string;
  counterparty: string;
  partyA: string;
  partyB: string;
  description: string;
  amount: string;
  images: UploadedFile[];
}

export const INITIAL_FORM_STATE: AgreementFormState = {
  title: "",
  counterparty: "",
  partyA: "",
  partyB: "",
  description: "",
  amount: "",
  images: [],
};

export interface ValidationField {
  isValid: boolean;
  message: string;
  isTouched: boolean;
}

export interface FormValidation {
  title: ValidationField;
  counterparty: ValidationField;
  partyA: ValidationField;
  partyB: ValidationField;
  description: ValidationField;
  amount: ValidationField;
}

export const INITIAL_VALIDATION: FormValidation = {
  title: { isValid: false, message: "", isTouched: false },
  counterparty: { isValid: false, message: "", isTouched: false },
  partyA: { isValid: false, message: "", isTouched: false },
  partyB: { isValid: false, message: "", isTouched: false },
  description: { isValid: false, message: "", isTouched: false },
  amount: { isValid: true, message: "", isTouched: false },
};
