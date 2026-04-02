import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../lib/utils";

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  const content = (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            "w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl animate-enter",
            "max-h-[calc(100vh-3rem)] overflow-y-auto"
          )}
        >
          <div className={cn("flex items-start justify-between gap-4", title ? "mb-3" : "mb-1")}>
            {title ? (
              <div className="text-lg font-bold text-gray-900">{title}</div>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return content;
  return createPortal(content, document.body);
}
