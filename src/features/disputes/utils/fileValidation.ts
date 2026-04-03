// // features/disputes/utils/fileValidation.ts
// import { toast } from "sonner";
// import {
//   MAX_FILE_SIZE,
//   MAX_TOTAL_SIZE,
//   ALLOWED_IMAGE_TYPES,
//   ALLOWED_DOCUMENT_TYPES,
// } from "./constants";

// export interface UploadedFile {
//   id: string;
//   file: File;
//   preview?: string;
//   type: "image" | "document";
//   size: string;
// }

// export const getTotalFileSize = (files: UploadedFile[]): string => {
//   const totalBytes = files.reduce((total, file) => total + file.file.size, 0);
//   const mb = totalBytes / 1024 / 1024;
//   return `${mb.toFixed(2)} MB`;
// };

// export const validateFile = (file: File, currentTotalSize: number): boolean => {
//   const fileSizeMB = file.size / 1024 / 1024;
//   const fileType = file.type.startsWith("image/") ? "image" : "document";

//   if (fileType === "image" && fileSizeMB > 2) {
//     toast.error(
//       `Image "${file.name}" exceeds 2MB limit (${fileSizeMB.toFixed(2)}MB)`,
//     );
//     return false;
//   }

//   if (fileType === "document" && fileSizeMB > 3) {
//     toast.error(
//       `Document "${file.name}" exceeds 3MB limit (${fileSizeMB.toFixed(2)}MB)`,
//     );
//     return false;
//   }

//   if (currentTotalSize + file.size > MAX_TOTAL_SIZE) {
//     toast.error(
//       `Adding "${file.name}" would exceed total 50MB limit. Current total: ${(currentTotalSize / 1024 / 1024).toFixed(2)}MB`,
//     );
//     return false;
//   }

//   if (
//     !ALLOWED_IMAGE_TYPES.includes(file.type) &&
//     !ALLOWED_DOCUMENT_TYPES.includes(file.type)
//   ) {
//     toast.error(
//       `File "${file.name}" has unsupported type. Allowed: images (JPEG, PNG, GIF, WebP), PDFs, Word docs, text files`,
//     );
//     return false;
//   }

//   return true;
// };

// export const createFilePreview = (file: File): Promise<string> => {
//   return new Promise((resolve) => {
//     const reader = new FileReader();
//     reader.onload = (e) => resolve(e.target?.result as string);
//     reader.readAsDataURL(file);
//   });
// };
