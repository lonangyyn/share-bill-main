import { Trash2 } from "lucide-react";

interface LocalBankAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault?: boolean;
}

interface BankSectionProps {
  banks: LocalBankAccount[];
  bankAccounts: LocalBankAccount[]; // Truyền mảng gốc vào để check length đúng như code cũ
  onAdd: () => void;
  onEdit: (idx: number) => void;
  onDelete: (idx: number) => void;
  onSetDefault: (idx: number) => void;
}

export function BankSection({
  banks,
  bankAccounts,
  onAdd,
  onEdit,
  onDelete,
  onSetDefault,
}: BankSectionProps) {
  return (
    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Bank transfer</h3>
        <button
          className="text-purple-600 text-sm font-bold hover:underline"
          onClick={onAdd}
        >
          Add
        </button>
      </div>

      {banks.length > 0 ? (
        <div className="mt-4 space-y-3">
          {banks.map((b, idx) => (
            <div
              key={`${b.bankName}-${b.accountNumber}-${idx}`}
              className="rounded-2xl border border-gray-100 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 flex items-center gap-2">
                    {b.bankName}
                    {b.isDefault && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="text-gray-700 text-sm">{b.accountNumber}</div>
                  <div className="text-gray-500 text-sm">{b.accountName}</div>
                </div>

                {/* LOGIC GỐC: Chỉ cho phép edit/delete cho LOCAL banks */}
                {bankAccounts.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      className="text-sm font-semibold text-gray-700 hover:underline"
                      onClick={() => onEdit(idx)}
                    >
                      Edit
                    </button>

                    <button
                      className="text-sm font-semibold text-rose-600 hover:underline flex items-center gap-1"
                      onClick={() => onDelete(idx)}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>

              {/* LOGIC GỐC: Chỉ hiện Set as default nếu có bankAccounts local */}
              {bankAccounts.length > 0 && !b.isDefault && (
                <button
                  className="mt-3 text-sm font-bold text-purple-600 hover:underline"
                  onClick={() => onSetDefault(idx)}
                >
                  Set as default
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 text-sm text-gray-500">
          Add bank info to receive VietQR payments.
        </div>
      )}
    </div>
  );
}
