import { useState, useEffect } from "react";
import { formatDate, formatMoney } from "./helpers";

interface PaymentRequestsCardProps {
  paymentItems: any[];
  incomingRequests: any[];
  outgoingRequests: any[];
  currency: string;
  handleConfirmRequest: (id: string) => void;
  handleCancelRequest: (id: string) => void;
}

export function PaymentRequestsCard({
  paymentItems,
  incomingRequests,
  outgoingRequests,
  currency,
  handleConfirmRequest,
  handleCancelRequest,
}: PaymentRequestsCardProps) {
  const [incomingPage, setIncomingPage] = useState(1);
  const [outgoingPage, setOutgoingPage] = useState(1);
  const ITEMS_PER_PAGE = 3;

  useEffect(() => {
    setIncomingPage(1);
  }, [incomingRequests]);

  useEffect(() => {
    setOutgoingPage(1);
  }, [outgoingRequests]);

  const incomingTotalPages = Math.ceil(
    incomingRequests.length / ITEMS_PER_PAGE,
  );
  const paginatedIncoming = incomingRequests.slice(
    (incomingPage - 1) * ITEMS_PER_PAGE,
    incomingPage * ITEMS_PER_PAGE,
  );

  const outgoingTotalPages = Math.ceil(
    outgoingRequests.length / ITEMS_PER_PAGE,
  );
  const paginatedOutgoing = outgoingRequests.slice(
    (outgoingPage - 1) * ITEMS_PER_PAGE,
    outgoingPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="bg-white rounded-[24px] border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Payment requests</h2>
        <span className="text-xs text-gray-400">
          {paymentItems.length} total
        </span>
      </div>

      {paymentItems.length === 0 ? (
        <div className="text-sm text-gray-500">No payment requests yet.</div>
      ) : (
        <div className="space-y-4">
          {incomingRequests.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500">
                Incoming
              </div>
              <div className="mt-2 space-y-2">
                {paginatedIncoming.map((req: any) => {
                  const status = req.status ?? "pending";
                  const statusLabel =
                    status === "confirmed"
                      ? "Confirmed"
                      : status === "canceled"
                        ? "Canceled"
                        : "Pending";
                  const statusClass =
                    status === "confirmed"
                      ? "bg-emerald-100 text-emerald-700"
                      : status === "canceled"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-700";
                  return (
                    <div
                      key={req.id}
                      className="rounded-2xl border border-gray-100 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {req.payer?.name ?? "Member"} -&gt; You
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(req.createdAt)}
                        </div>
                      </div>
                      <div className="text-sm font-extrabold text-gray-900">
                        {formatMoney(Number(req.amount ?? 0))} {currency}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
                        >
                          {statusLabel}
                        </span>
                        {status === "pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleConfirmRequest(req.id)}
                              className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelRequest(req.id)}
                              className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {incomingTotalPages > 1 && (
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                  <button
                    onClick={() => setIncomingPage((p) => Math.max(1, p - 1))}
                    disabled={incomingPage === 1}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-900 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-medium text-gray-400">
                    {incomingPage} / {incomingTotalPages}
                  </span>
                  <button
                    onClick={() =>
                      setIncomingPage((p) =>
                        Math.min(incomingTotalPages, p + 1),
                      )
                    }
                    disabled={incomingPage === incomingTotalPages}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-900 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {outgoingRequests.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500">
                Outgoing
              </div>
              <div className="mt-2 space-y-2">
                {paginatedOutgoing.map((req: any) => {
                  const status = req.status ?? "pending";
                  const statusLabel =
                    status === "confirmed"
                      ? "Confirmed"
                      : status === "canceled"
                        ? "Canceled"
                        : "Pending";
                  const statusClass =
                    status === "confirmed"
                      ? "bg-emerald-100 text-emerald-700"
                      : status === "canceled"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-700";
                  return (
                    <div
                      key={req.id}
                      className="rounded-2xl border border-gray-100 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          You -&gt; {req.receiver?.name ?? "Member"}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(req.createdAt)}
                        </div>
                      </div>
                      <div className="text-sm font-extrabold text-gray-900">
                        {formatMoney(Number(req.amount ?? 0))} {currency}
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                  );
                })}
              </div>

              {outgoingTotalPages > 1 && (
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                  <button
                    onClick={() => setOutgoingPage((p) => Math.max(1, p - 1))}
                    disabled={outgoingPage === 1}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-900 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-medium text-gray-400">
                    {outgoingPage} / {outgoingTotalPages}
                  </span>
                  <button
                    onClick={() =>
                      setOutgoingPage((p) =>
                        Math.min(outgoingTotalPages, p + 1),
                      )
                    }
                    disabled={outgoingPage === outgoingTotalPages}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-900 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
