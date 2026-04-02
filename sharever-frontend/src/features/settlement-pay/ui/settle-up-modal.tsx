import { Modal } from "../../../shared/ui/modal";
import { Button } from "../../../shared/ui/button";
import { formatCurrencyVND } from "../../../shared/lib/format";
import { useToast } from "../../../shared/ui/toast";
import { normalizeError } from "../../../shared/lib/errors";
import { useState } from "react";

export interface SettlementItem {
  fromName: string;
  toName: string;
  amount: number;
}

interface SettleUpModalProps {
  open: boolean;
  onClose: () => void;
  settlement: SettlementItem | null;
  onConfirm?: (s: SettlementItem) => Promise<void> | void;
}

export function SettleUpModal({
  open,
  onClose,
  settlement,
  onConfirm,
}: SettleUpModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  if (!settlement) return null;

  async function handleConfirm() {
    if (!onConfirm) return;
    setLoading(true);
    try {
      await onConfirm(settlement);
      toast.push("Marked as paid.");
      onClose();
    } catch (err) {
      toast.push(normalizeError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Settle up">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Confirm this payment to update the balances.
        </p>

        <div className="rounded-3xl bg-gray-50 px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-800">
            <span className="font-semibold">{settlement.fromName}</span>{" "}
            pays{" "}
            <span className="font-semibold">{settlement.toName}</span>
          </div>
          <div className="text-sm font-extrabold text-emerald-600">
            {formatCurrencyVND(settlement.amount)}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            className="text-gray-600"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? "Saving..." : "Mark as paid"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
