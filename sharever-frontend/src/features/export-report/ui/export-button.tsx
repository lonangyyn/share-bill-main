import { useState } from "react";
import { Button } from "../../../shared/ui/button";

interface ExportButtonProps {
  onExportPdf?: () => Promise<void> | void;
  onExportZip?: () => Promise<void> | void;
}

export function ExportButton({ onExportPdf, onExportZip }: ExportButtonProps) {
  const [open, setOpen] = useState(false);

  async function handle(action?: () => Promise<void> | void) {
    if (!action) return;
    setOpen(false);
    await action();
  }

  return (
    <div className="relative inline-block">
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={() => setOpen((o) => !o)}
      >
        Export
        <span className="text-xs">▼</span>
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-2xl bg-white border border-gray-100 shadow-lg z-20 animate-enter">
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-t-2xl"
            onClick={() => handle(onExportPdf)}
          >
            PDF report
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-b-2xl"
            onClick={() => handle(onExportZip)}
          >
            ZIP (CSV + PDF)
          </button>
        </div>
      )}
    </div>
  );
}
