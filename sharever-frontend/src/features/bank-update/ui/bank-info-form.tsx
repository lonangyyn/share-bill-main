import { useState } from "react";
import { Modal } from "../../../shared/ui/modal";
import { Input } from "../../../shared/ui/input";
import { Button } from "../../../shared/ui/button";
import { useToast } from "../../../shared/ui/toast";
import { normalizeError } from "../../../shared/lib/errors";

export interface BankInfoPayload {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

interface BankInfoFormProps {
  open: boolean;
  onClose: () => void;
  initial?: Partial<BankInfoPayload>;
  onSubmit?: (data: BankInfoPayload) => Promise<void> | void;
}

export function BankInfoForm({
  open,
  onClose,
  initial,
  onSubmit,
}: BankInfoFormProps) {
  const toast = useToast();
  const [bankName, setBankName] = useState(initial?.bankName ?? "");
  const [accountNumber, setAccountNumber] = useState(
    initial?.accountNumber ?? ""
  );
  const [accountName, setAccountName] = useState(
    initial?.accountName ?? ""
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!onSubmit) return;

    setLoading(true);
    try {
      await onSubmit({ bankName, accountNumber, accountName });
      toast.push("Bank info updated.");
      onClose();
    } catch (err) {
      toast.push(normalizeError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Bank information">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Bank code (VietQR)
          </label>
          <Input
            placeholder="VCB"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            required
          />
          <div className="text-xs text-gray-500">
            Use VietQR bank code (e.g. VCB, ACB, TCB).
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Account number
          </label>
          <Input
            placeholder="0123456789"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Account name
          </label>
          <Input
            placeholder="NGUYEN VAN A"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            required
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            className="text-gray-600"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
