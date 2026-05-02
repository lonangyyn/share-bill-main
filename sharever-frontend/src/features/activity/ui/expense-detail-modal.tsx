import { Modal } from "../../../shared/ui/modal";
import {
  formatMoney,
  roundMoney,
  computeExpenseNetByParticipant,
} from "./helpers";

interface ExpenseDetailModalProps {
  open: boolean;
  onClose: () => void;
  detailTxnId: string | null;
  txnDetailById: Map<string, any>;
  currentParticipantId: string;
  participantOptions: any[];
  currency: string;
}

export function ExpenseDetailModal({
  open,
  onClose,
  detailTxnId,
  txnDetailById,
  currentParticipantId,
  participantOptions,
  currency,
}: ExpenseDetailModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Expense detail">
      {(() => {
        if (!detailTxnId)
          return (
            <div className="text-sm text-gray-600">No expense selected.</div>
          );

        const detail = txnDetailById.get(detailTxnId);
        if (!detail)
          return <div className="text-sm text-gray-600">Loading detail...</div>;

        const netByPid = computeExpenseNetByParticipant(detail);

        const rows = Array.from(netByPid.entries())
          .map(([pid, net]) => {
            const isYou = String(pid) === String(currentParticipantId);
            const name = isYou
              ? "You"
              : (participantOptions.find(
                  (p: any) => String(p.id) === String(pid),
                )?.name ?? "Member");

            return {
              pid,
              name,
              net,
              abs: Math.abs(net),
              type: net >= 0 ? "receive" : "pay",
            };
          })
          .sort((a, b) => {
            if (a.type !== b.type) return a.type === "receive" ? -1 : 1;
            return b.abs - a.abs;
          });

        const currencyLabel = currency ?? "VND";

        return (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="text-sm font-semibold text-gray-900">
                {detail.description ?? "Untitled"}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Total:{" "}
                <span className="font-semibold text-gray-700">
                  {formatMoney(Number(detail.amount ?? 0))} {currencyLabel}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {rows.map((r) => (
                <div
                  key={r.pid}
                  className="rounded-2xl border border-gray-100 px-4 py-3 flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">
                      {r.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {r.type === "receive" ? "Will receive" : "Need to pay"}
                    </div>
                  </div>

                  <div
                    className={`text-sm font-extrabold whitespace-nowrap ${
                      r.type === "receive"
                        ? "text-emerald-700"
                        : "text-rose-700"
                    }`}
                  >
                    {r.type === "receive" ? "+" : "-"}
                    {formatMoney(roundMoney(r.abs))} {currencyLabel}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        );
      })()}
    </Modal>
  );
}
