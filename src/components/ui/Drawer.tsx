"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  side?: "right" | "bottom";
  width?: string;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  side = "right",
  width = "max-w-md",
}: DrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const slideVariants = {
    right: {
      initial: { x: "100%" },
      animate: { x: 0 },
      exit: { x: "100%" },
    },
    bottom: {
      initial: { y: "100%" },
      animate: { y: 0 },
      exit: { y: "100%" },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[#132824]/40 backdrop-blur-xs"
            onClick={onClose}
          />

          <div
            className={`fixed inset-y-0 right-0 flex max-w-full ${
              side === "bottom" ? "inset-x-0 top-auto h-[85vh]" : ""
            }`}
          >
            <motion.div
              initial={slideVariants[side].initial}
              animate={slideVariants[side].animate}
              exit={slideVariants[side].exit}
              transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
              className={`w-screen ${width} bg-white shadow-2xl flex flex-col border-l border-[#DCE5E2]`}
            >
              {/* Header */}
              <div className="flex items-start justify-between px-6 py-4 border-b border-[#DCE5E2] bg-[#F4F7F6]/60">
                <div>
                  <h2
                    id="drawer-title"
                    className="text-base font-semibold text-[#132824]"
                  >
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-xs text-[#60706C] mt-0.5">{subtitle}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close drawer"
                  className="text-[#60706C] hover:text-[#132824] p-1.5 rounded-md hover:bg-[#EAF0EE] transition-colors focus-visible:ring-2 focus-visible:ring-[#147D6F]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6">{children}</div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
