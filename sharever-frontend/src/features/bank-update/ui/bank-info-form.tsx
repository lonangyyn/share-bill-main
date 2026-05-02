import { useState, useEffect } from "react"; // Thêm useEffect
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

interface Bank {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
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
    initial?.accountNumber ?? "",
  );
  const [accountName, setAccountName] = useState(initial?.accountName ?? "");
  const [loading, setLoading] = useState(false);

  // State lưu danh sách ngân hàng từ API
  const [banks, setBanks] = useState<Bank[]>([]);
  const [fetchingBanks, setFetchingBanks] = useState(false);

  useEffect(() => {
    if (open) {
      setFetchingBanks(true);
      fetch("https://api.vietqr.io/v2/banks")
        .then((res) => res.json())
        .then((result) => {
          if (result.code === "00") {
            setBanks(result.data);
          }
        })
        .catch((err) => console.error("Failed to fetch banks", err))
        .finally(() => setFetchingBanks(false));
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!onSubmit) return;

    setLoading(true);
    try {
      await onSubmit({ bankName, accountNumber, accountName });
      toast.push("Update bank info successfully");
      onClose();
    } catch (err) {
      toast.push(normalizeError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Bank Information">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Bank</label>
          {/* Thay thế Input bằng select */}
          <select
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-300 disabled:bg-gray-100"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            required
            disabled={fetchingBanks}
          >
            <option value="">-- Select Bank --</option>
            {banks.map((bank) => (
              <option key={bank.id} value={bank.code}>
                {bank.shortName} - {bank.name}
              </option>
            ))}
          </select>
          {fetchingBanks && (
            <div className="text-xs text-blue-500">Loading bank list...</div>
          )}
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
            onChange={(e) => setAccountName(e.target.value.toUpperCase())} // Thường tên TK nên viết hoa
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
          <Button type="submit" disabled={loading || fetchingBanks}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
