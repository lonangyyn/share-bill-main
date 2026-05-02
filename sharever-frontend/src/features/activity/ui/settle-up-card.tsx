import { useState, useEffect } from "react";
import { formatMoney } from "./helpers";
import type { SettlementPlanItem } from "../../../entities/settlement/types";

interface SettleUpCardProps {
  relevantPlan: SettlementPlanItem[];
  currency: string;
  myParticipantId?: string | number;
  hasPendingOutgoing: (plan: SettlementPlanItem) => boolean;
  handleOpenPayment: (plan: SettlementPlanItem) => void;
}

export function SettleUpCard({
  relevantPlan,
  currency,
  myParticipantId,
  hasPendingOutgoing,
  handleOpenPayment,
}: SettleUpCardProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  useEffect(() => {
    setCurrentPage(1);
  }, [relevantPlan]);

  const totalPages = Math.ceil(relevantPlan.length / ITEMS_PER_PAGE);
  const paginatedPlan = relevantPlan.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="bg-white rounded-[24px] border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Settle up</h2>
        <span className="text-xs text-gray-400">
          {relevantPlan.length} suggestion
          {relevantPlan.length === 1 ? "" : "s"}
        </span>
      </div>

      {relevantPlan.length === 0 ? (
        <div className="text-sm text-gray-500">
          You're all settled up for this activity.
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedPlan.map((plan) => {
            const isPayer = String(plan.from.id) === String(myParticipantId);
            const isReceiver = String(plan.to.id) === String(myParticipantId);
            const pending = isPayer && hasPendingOutgoing(plan);
            return (
              <div
                key={`${plan.from.id}-${plan.to.id}-${plan.amount}`}
                className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="min-w-[160px]">
                  <div className="text-sm font-semibold text-gray-900">
                    {isPayer ? "You" : plan.from.name} -&gt;{" "}
                    {isReceiver ? "You" : plan.to.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {isPayer
                      ? "You owe this amount"
                      : isReceiver
                        ? "You will receive this amount"
                        : "Suggested transfer"}
                  </div>
                </div>

                <div className="text-sm font-extrabold text-gray-900">
                  {formatMoney(plan.amount)} {currency}
                </div>

                {isPayer ? (
                  pending ? (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      Pending
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenPayment(plan)}
                      className="rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800"
                    >
                      Pay now
                    </button>
                  )
                ) : (
                  <span className="text-xs font-semibold text-gray-400">
                    Waiting
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-5 pt-4 border-t border-gray-50">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="text-xs font-semibold text-gray-500 hover:text-gray-900 disabled:opacity-50 transition-colors"
          >
            Previous
          </button>
          <span className="text-xs font-medium text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="text-xs font-semibold text-gray-500 hover:text-gray-900 disabled:opacity-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
