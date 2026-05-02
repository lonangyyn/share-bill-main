import { Modal } from "../../../shared/ui/modal";
import {
  ExpenseForm,
  type ExpenseFormValues,
} from "../../transaction-create/ui/expense-form";

interface EditExpenseModalProps {
  open: boolean;
  onClose: () => void;
  editLoading: boolean;
  editValues: ExpenseFormValues | null;
  participantOptions: any[];
  handleUpdateExpense: (values: ExpenseFormValues) => Promise<void>;
  handleDeleteExpense: () => void;
  deleteLoading: boolean;
}

export function EditExpenseModal({
  open,
  onClose,
  editLoading,
  editValues,
  participantOptions,
  handleUpdateExpense,
  handleDeleteExpense,
  deleteLoading,
}: EditExpenseModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Edit expense">
      {editLoading ? (
        <div className="text-sm text-gray-600">Loading expense...</div>
      ) : editValues ? (
        <>
          <ExpenseForm
            participants={participantOptions}
            initialValues={editValues}
            submitLabel="Save changes"
            successMessage="Expense updated."
            onSubmit={handleUpdateExpense}
          />
          <div className="mt-4 border-t border-gray-100 pt-4">
            <button
              type="button"
              className="w-full rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60"
              onClick={handleDeleteExpense}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete expense"}
            </button>
          </div>
        </>
      ) : (
        <div className="text-sm text-gray-600">Unable to load expense.</div>
      )}
    </Modal>
  );
}
