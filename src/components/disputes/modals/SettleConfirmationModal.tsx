import { Button } from "../../../components/ui/button";
import { Scale, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback } from "react";

const SettleConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  disputeTitle,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  disputeTitle?: string;
}) => {
  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass card-cyan relative max-w-md overflow-hidden rounded-2xl"
          onClick={handleModalClick}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-green-400/30 bg-green-500/10 p-6">
            <div className="flex items-center gap-3">
              <Scale className="h-6 w-6 text-green-300" />
              <h3 className="text-xl font-semibold text-green-300">
                Settle Dispute
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/70 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-4">
              <div className="text-center">
                <div className="mb-2 text-lg font-semibold text-white">
                  {disputeTitle}
                </div>
                <p className="text-green-200">
                  Are you sure you want to settle this dispute?
                </p>
                <p className="mt-2 text-sm text-green-200/70">
                  This action cannot be undone. The dispute will be marked as
                  settled and no further changes can be made.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  variant="neon"
                  className="flex-1 border-green-400/30 bg-green-500/20 text-green-300 hover:bg-green-500/30"
                  onClick={onConfirm}
                >
                  <Scale className="mr-2 h-4 w-4" />
                  Settle Dispute
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SettleConfirmationModal;
