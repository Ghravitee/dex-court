// components/PageTransitionLoader.tsx
import { motion } from "framer-motion";

export const PageTransitionLoader = () => {
  return (
    <motion.div
      className="fixed top-0 left-0 z-[9999] h-[3px] bg-[#2C89F5]"
      initial={{ width: "0%" }}
      animate={{ width: "100%" }}
      exit={{ width: "0%" }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
    />
  );
};
