import { Modal } from "../../../shared/ui/modal";
import { formatMoney } from "./helpers";

interface VietQRModalProps {
  open: boolean;
  onClose: () => void;
  qrLoading: boolean;
  qrData: any;
  qrPlan: any;
  currency: string;
  handleMarkPaid: () => void;
  qrSending: boolean;
}

export function VietQRModal({
  open,
  onClose,
  qrLoading,
  qrData,
  qrPlan,
  currency,
  handleMarkPaid,
  qrSending,
}: VietQRModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Pay with VietQR">
      {qrLoading ? (
        <div className="text-sm text-gray-600">Loading QR code...</div>
      ) : qrData ? (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3">
            <img
              src={qrData.qrCodeUrl}
              alt="VietQR"
              className="w-56 h-56 object-contain rounded-2xl border border-gray-100 bg-white"
            />
            {qrPlan && (
              <div className="text-sm text-gray-600">
                Pay{" "}
                <span className="font-semibold text-gray-900">
                  {qrPlan.to.name}
                </span>{" "}
                {formatMoney(qrPlan.amount)} {currency}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700 space-y-1">
            <div>
              <span className="font-semibold">Bank:</span>{" "}
              {qrData.bankInfo.bankName}
            </div>
            <div>
              <span className="font-semibold">Account:</span>{" "}
              {qrData.bankInfo.accountNumber}
            </div>
            <div>
              <span className="font-semibold">Account name:</span>{" "}
              {qrData.bankInfo.accountName}
            </div>
            <div>
              <span className="font-semibold">Content:</span> {qrData.content}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleMarkPaid}
              disabled={qrSending}
              className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
            >
              {qrSending ? "Submitting..." : "I have paid"}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-600">Unable to load QR code.</div>
      )}
    </Modal>
  );
}
