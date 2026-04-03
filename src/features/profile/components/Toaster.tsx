import { useEffect } from "react";
import { type ToasterState } from "../types";

interface ToasterProps extends ToasterState {
  onClose: () => void;
}

export const Toaster = ({
  message,
  type,
  isVisible,
  onClose,
}: ToasterProps) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const bgColor =
    type === "success"
      ? "bg-green-500/20 border-green-400/30 text-green-300"
      : "bg-red-500/20 border-red-400/30 text-red-300";

  return (
    <div className="animate-in slide-in-from-right-full fixed top-4 right-4 z-[100] duration-300">
      <div
        className={`glass rounded-lg border ${bgColor} px-4 py-3 shadow-lg backdrop-blur-sm`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`flex-shrink-0 ${type === "success" ? "text-green-400" : "text-red-400"}`}
          >
            {type === "success" ? "✓" : "⚠"}
          </div>
          <div className="text-sm font-medium">{message}</div>
          <button
            onClick={onClose}
            className={`ml-4 flex-shrink-0 ${type === "success" ? "text-green-400 hover:text-green-300" : "text-red-400 hover:text-red-300"}`}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};
