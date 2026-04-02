import { useEffect, useMemo, useState } from "react";
import { Input } from "../../../shared/ui/input";
import { Button } from "../../../shared/ui/button";
import { useToast } from "../../../shared/ui/toast";
import { formatCurrencyVND } from "../../../shared/lib/format";
import { normalizeError } from "../../../shared/lib/errors";

export type SplitType = "equal" | "exact" | "percentage";

export interface BeneficiaryInput {
  participantId: string;
  weight: number;
}

export interface ExpenseFormValues {
  description: string;
  amount: number;
  paidById: string;
  splitType: SplitType;
  note?: string;
  beneficiaries?: BeneficiaryInput[];
}

export interface ParticipantOption {
  id: string;
  name: string;
}

interface ExpenseFormProps {
  participants: ParticipantOption[];
  onSubmit?: (values: ExpenseFormValues) => Promise<void> | void;
  initialValues?: Partial<ExpenseFormValues>;
  submitLabel?: string;
  successMessage?: string;
  lockPaidById?: string;
}

export function ExpenseForm({
  participants,
  onSubmit,
  initialValues,
  submitLabel,
  successMessage,
  lockPaidById,
}: ExpenseFormProps) {
  const toast = useToast();
  const [description, setDescription] = useState(
    initialValues?.description ?? ""
  );
  const [amount, setAmount] = useState<string>(
    initialValues?.amount !== undefined ? String(initialValues.amount) : ""
  );
  const [paidById, setPaidById] = useState<string>(
    lockPaidById ?? initialValues?.paidById ?? participants[0]?.id ?? ""
  );
  const [splitType, setSplitType] = useState<SplitType>(
    initialValues?.splitType ?? "equal"
  );
  const [note, setNote] = useState(initialValues?.note ?? "");
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [splitError, setSplitError] = useState<string | null>(null);
  const [percentages, setPercentages] = useState<Record<string, number>>({});
  const participantById = useMemo(
    () => new Map(participants.map((p) => [p.id, p])),
    [participants]
  );

  useEffect(() => {
    if (!initialValues) return;
    setDescription(initialValues.description ?? "");
    setAmount(
      initialValues.amount !== undefined ? String(initialValues.amount) : ""
    );
    setSplitType(initialValues.splitType ?? "equal");
    setNote(initialValues.note ?? "");
  }, [initialValues]);

  useEffect(() => {
    if (!participants.length) {
      setSelectedIds([]);
      setExactAmounts({});
      return;
    }

    if (initialValues?.beneficiaries?.length) {
      const ids = initialValues.beneficiaries
        .map((b) => b.participantId)
        .filter((id) => participantById.has(id));
      setSelectedIds(ids);

      const total = Number(initialValues.amount ?? 0);
      const totalWeight = initialValues.beneficiaries.reduce(
        (sum, b) => sum + b.weight,
        0
      );
      if (total > 0 && totalWeight > 0) {
        const nextAmounts: Record<string, string> = {};
        initialValues.beneficiaries.forEach((b) => {
          if (!participantById.has(b.participantId)) return;
          const ratio = b.weight / totalWeight;
          const computed = Math.round(total * ratio);
          nextAmounts[b.participantId] = String(computed);
        });
        setExactAmounts(nextAmounts);
      } else {
        setExactAmounts({});
      }
    } else {
      setSelectedIds(participants.map((p) => p.id));
      setExactAmounts({});
    }
    setSplitError(null);
  }, [initialValues?.beneficiaries, initialValues?.amount, participantById, participants]);

  useEffect(() => {
    if (lockPaidById) {
      setPaidById(lockPaidById);
      return;
    }
    if (initialValues?.paidById) {
      setPaidById(initialValues.paidById);
      return;
    }
    if (participants[0]?.id) {
      setPaidById(participants[0].id);
    }
  }, [initialValues?.paidById, lockPaidById, participants]);

  function parseMoney(value: string) {
    return Number(value.replace(/\D/g, ""));
  }

  function toggleParticipant(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((pid) => pid !== id);
        setExactAmounts((current) => {
          const copy = { ...current };
          delete copy[id];
          return copy;
        });
        setSplitError(null);
        return next;
      }
      setSplitError(null);
      return [...prev, id];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!onSubmit) return;

    const numAmount = parseMoney(amount);
    if (!numAmount || numAmount <= 0) {
      toast.push("Amount must be greater than 0.");
      return;
    }

    const selected = selectedIds.length ? selectedIds : [];
    if (selected.length === 0) {
      setSplitError("Select at least one participant to split the expense.");
      return;
    }

    let beneficiaries: BeneficiaryInput[] = [];

    if (splitType === "percentage") {
      const totalPercent = Object.values(percentages).reduce((a, b) => a + b, 0);
      if (Math.abs(totalPercent - 100) > 0.01) {
        setSplitError("Sum of percentages must equal 100%.");
        return;
      }

      beneficiaries = selectedIds.map((id) => ({
        participantId: id,
        weight: (percentages[id] || 0) / 100, // Chuyển % thành tỷ lệ (0.25 = 25%)
      }));
    } else if (splitType === "exact") {
      // Logic exact giữ nguyên
      const amounts = selectedIds.map((id) => parseMoney(exactAmounts[id] ?? ""));
      if (amounts.some((v) => v <= 0)) {
        setSplitError("Enter exact amounts greater than 0 for all selected participants.");
        return;
      }
      const sum = amounts.reduce((acc, v) => acc + v, 0);
      if (sum !== numAmount) {
        setSplitError("Sum of exact amounts must equal the total amount.");
        return;
      }
      beneficiaries = selectedIds.map((id, index) => ({
        participantId: id,
        weight: amounts[index], // weight là số tiền thực
      }));
    } else {
      // equal
      beneficiaries = selectedIds.map((id) => ({
        participantId: id,
        weight: 1,
      }));
    }

    setLoading(true);
    try {
      const payerId = lockPaidById ?? paidById;
      await onSubmit({
        description,
        amount: numAmount,
        paidById: payerId,
        splitType,
        note: note || undefined,
        beneficiaries,
      });
      toast.push(successMessage ?? "Expense created.");
      setDescription("");
      setAmount("");
      setNote("");
      setSplitError(null);
    } catch (err) {
      toast.push(normalizeError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-enter">
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">
          What is this for?
        </label>
        <Input
          placeholder="Coffee, tickets, taxi..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Amount</label>
          <Input
            inputMode="numeric"
            placeholder="250000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          {amount && (
            <div className="text-xs text-gray-500">
              ~ {formatCurrencyVND(Number(amount.replace(/\D/g, "")))}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Paid by</label>
          {lockPaidById && (
            <div className="text-xs text-gray-500">
              Paid by is set to your account.
            </div>
          )}
          <select
            className="h-11 w-full rounded-2xl bg-gray-100 px-4 text-sm text-gray-800 outline-none border border-transparent focus:border-purple-400 focus:bg-white"
            value={lockPaidById ?? paidById}
            onChange={(e) => setPaidById(e.target.value)}
            disabled={!!lockPaidById}
          >
            {(lockPaidById
              ? participants.filter((p) => p.id === lockPaidById)
              : participants
            ).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {participants.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Participants</div>
          <div className="text-xs text-gray-500">
            Select who this expense is split between.
          </div>
          <div className="flex flex-wrap gap-2">
            {participants.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleParticipant(p.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  selectedIds.includes(p.id)
                    ? "bg-purple-100 text-purple-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">Split</div>
        <div className="rounded-2xl bg-gray-100 p-1 inline-flex">
          <button
            type="button"
            onClick={() => setSplitType("equal")}
            className={`px-3 py-1 rounded-2xl text-xs font-semibold ${
              splitType === "equal"
                ? "bg-white shadow-sm text-purple-700"
                : "text-gray-500"
            }`}
          >
            Equal
          </button>
          <button
            type="button"
            onClick={() => setSplitType("exact")}
            className={`px-3 py-1 rounded-2xl text-xs font-semibold ${
              splitType === "exact"
                ? "bg-white shadow-sm text-purple-700"
                : "text-gray-500"
            }`}
          >
            Exact amounts
          </button>

          <button
            type="button"
            onClick={() => {
              setSplitType("percentage");
              // Khởi tạo % mặc định nếu cần (ví dụ chia đều)
              const defaultPercent = 100 / selectedIds.length;
              const newPercents: Record<string, number> = {};
              selectedIds.forEach(id => {
                newPercents[id] = defaultPercent;
              });
              setPercentages(newPercents);
            }}
            className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-all ${
              splitType === "percentage"
                ? "bg-white shadow-sm text-purple-700"
                : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            Percentage (%)
          </button>
        </div>
        {splitType === "equal" && (
          <p className="text-xs text-gray-500">
            The bill will be split evenly between selected participants.
          </p>
        )}
        {splitType === "exact" && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">
              Enter exact amounts for each selected participant.
            </p>
            {selectedIds.length === 0 && (
              <div className="text-xs text-gray-500">
                Select at least one participant to enter amounts.
              </div>
            )}
            {selectedIds.length > 0 && (
              <div className="space-y-2">
                {selectedIds.map((id) => {
                  const participant = participantById.get(id);
                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-gray-50 px-3 py-2"
                    >
                      <div className="text-sm font-semibold text-gray-700 truncate">
                        {participant?.name ?? "Member"}
                      </div>
                      <Input
                        inputMode="numeric"
                        className="h-9 w-32 bg-white"
                        placeholder="0"
                        value={exactAmounts[id] ?? ""}
                        onChange={(e) =>
                          setExactAmounts((prev) => ({
                            ...prev,
                            [id]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {splitType === "percentage" && selectedIds.length > 0 && (
          <div className="mt-4 space-y-3 bg-gray-50 p-4 rounded-2xl">
            <div className="text-sm font-medium text-gray-700">
              Enter percentage for each selected participant
            </div>
            {selectedIds.map((id) => {
              const participant = participantById.get(id);
              const currentPercent = percentages[id] || 0;

              return (
                <div
                  key={id}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="flex-1 font-medium text-gray-800 truncate">
                    {participant?.name ?? "Thành viên"}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={currentPercent}
                      onChange={(e) => {
                        const newValue = parseFloat(e.target.value) || 0;
                        setPercentages((prev) => ({
                          ...prev,
                          [id]: newValue,
                        }));
                        setSplitError(null);
                      }}
                      className="w-24 p-2 border rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-purple-300"
                    />
                    <span className="text-sm font-medium text-gray-600">%</span>
                  </div>
                </div>
              );
            })}

            {/* Hiển thị tổng phần trăm */}
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between text-sm font-medium">
                <span>Tổng phần trăm:</span>
                <span
                  className={
                    Math.abs(
                      Object.values(percentages).reduce((a, b) => a + b, 0) - 100
                    ) < 0.01
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }
                >
                  {Object.values(percentages)
                    .reduce((a, b) => a + b, 0)
                    .toFixed(2)}
                  %
                </span>
              </div>
            </div>
          </div>
        )}
        {splitError && <div className="text-xs text-rose-600">{splitError}</div>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Note</label>
        <Input
          placeholder="Optional note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="pt-2">
        <Button className="min-w-[140px]" disabled={loading}>
          {loading ? "Saving..." : submitLabel ?? "Add expense"}
        </Button>
      </div>
    </form>
  );
}
