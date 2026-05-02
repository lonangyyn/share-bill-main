import { useState, useEffect } from "react";
import { Calendar, Pencil, Users, SlidersHorizontal } from "lucide-react";
import { formatMoney } from "./helpers";
import { Input } from "../../../shared/ui/input";

interface ExpenseListSectionProps {
  dateFilter: { startDate?: string; endDate?: string };
  setDateFilter: React.Dispatch<
    React.SetStateAction<{ startDate?: string; endDate?: string }>
  >;
  payerFilter: string;
  setPayerFilter: React.Dispatch<React.SetStateAction<string>>;
  amountFilter: { min?: number; max?: number };
  setAmountFilter: React.Dispatch<
    React.SetStateAction<{ min?: number; max?: number }>
  >;
  participantOptions: any[];
  filteredRows: any[];
  eventIsSettled: boolean;
  transactionsLength: number;
  setDetailTxnId: (id: string) => void;
  setDetailOpen: (open: boolean) => void;
  handleEditExpense: (id: string) => void;
}

export function ExpenseListSection({
  dateFilter,
  setDateFilter,
  payerFilter,
  setPayerFilter,
  amountFilter,
  setAmountFilter,
  participantOptions,
  filteredRows,
  eventIsSettled,
  transactionsLength,
  setDetailTxnId,
  setDetailOpen,
  handleEditExpense,
}: ExpenseListSectionProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Reset về trang 1 khi người dùng đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredRows]);

  const totalPages = Math.ceil(filteredRows.length / ITEMS_PER_PAGE);
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const hasActiveFilters =
    !!dateFilter.startDate ||
    !!dateFilter.endDate ||
    !!payerFilter ||
    amountFilter.min !== undefined ||
    amountFilter.max !== undefined;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">
          Expenses {filteredRows.length > 0 && `(${filteredRows.length})`}
        </h2>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors font-medium text-sm ${
            showFilters || hasActiveFilters
              ? "bg-purple-100 text-purple-700"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <SlidersHorizontal size={16} />
          Filters {hasActiveFilters && "•"}
        </button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm animate-enter">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Time</label>
              <div className="flex gap-3">
                <Input
                  type="date"
                  value={dateFilter.startDate || ""}
                  onChange={(e) =>
                    setDateFilter((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="flex-1 h-10 rounded-2xl border-gray-200"
                />
                <Input
                  type="date"
                  value={dateFilter.endDate || ""}
                  onChange={(e) =>
                    setDateFilter((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  className="flex-1 h-10 rounded-2xl border-gray-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Payer</label>
              <select
                value={payerFilter}
                onChange={(e) => setPayerFilter(e.target.value)}
                className="w-full h-10 rounded-2xl border border-gray-200 px-4 text-sm text-gray-800 outline-none focus:border-purple-300"
              >
                <option value="">All payers</option>
                {participantOptions.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Amount of money
              </label>
              <div className="flex gap-3">
                <Input
                  type="number"
                  placeholder="From"
                  value={amountFilter.min ?? ""}
                  onChange={(e) =>
                    setAmountFilter((prev) => ({
                      ...prev,
                      min: Number(e.target.value) || undefined,
                    }))
                  }
                  className="flex-1 h-10 rounded-2xl border-gray-200"
                />
                <Input
                  type="number"
                  placeholder="To"
                  value={amountFilter.max ?? ""}
                  onChange={(e) =>
                    setAmountFilter((prev) => ({
                      ...prev,
                      max: Number(e.target.value) || undefined,
                    }))
                  }
                  className="flex-1 h-10 rounded-2xl border-gray-200"
                />
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => {
                  setDateFilter({});
                  setPayerFilter("");
                  setAmountFilter({});
                }}
                className="text-sm text-purple-600 hover:text-purple-800 font-semibold"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {filteredRows.length > 0 ? (
          <>
            {paginatedRows.map((t) => (
              <div
                key={t.id}
                className={`rounded-[24px] border px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:shadow-sm transition-shadow gap-4 ${
                  eventIsSettled
                    ? "bg-emerald-50 border-emerald-100"
                    : "bg-white border-gray-100"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-extrabold text-gray-900 truncate">
                    {t.description}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
                    <Calendar size={14} />
                    <span>{t.dateLabel}</span>
                    <span className="text-gray-300">·</span>
                    <span className="truncate">{t.payerLabel}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="text-sm font-extrabold text-gray-900 whitespace-nowrap">
                    {formatMoney(t.amount)}{" "}
                    <span className="text-xs font-semibold text-gray-400">
                      VND
                    </span>
                  </div>

                  {t.yourBalance !== 0 && (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                        t.yourBalance > 0
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {t.yourBalance > 0
                        ? `You are owed ${formatMoney(Math.abs(t.yourBalance))} VND`
                        : `You owe ${formatMoney(Math.abs(t.yourBalance))} VND`}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setDetailTxnId(String(t.id));
                      setDetailOpen(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 whitespace-nowrap"
                  >
                    <Users size={12} />
                    View detail
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEditExpense(String(t.id))}
                    className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 whitespace-nowrap"
                  >
                    <Pencil size={12} />
                    Edit
                  </button>
                </div>
              </div>
            ))}

            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-5 pt-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="text-sm font-semibold text-gray-600 hover:text-gray-900 disabled:opacity-50 transition-colors bg-white border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-sm font-medium text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="text-sm font-semibold text-gray-600 hover:text-gray-900 disabled:opacity-50 transition-colors bg-white border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border border-gray-200">
            {transactionsLength === 0
              ? "There is no expense yet. Create one to get started!"
              : "No expense matches the current filters."}
          </div>
        )}
      </div>
    </div>
  );
}
