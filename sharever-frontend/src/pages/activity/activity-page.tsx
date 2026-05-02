import { useEffect, useMemo, useState } from "react";
import { Link2, Plus, RefreshCw, Trash2, Users } from "lucide-react";
import { useQuery, useQueryClient, useQueries } from "@tanstack/react-query";

import { useAuth } from "../../features/auth/model/use-auth";
import { useEventStore } from "../../stores/use-event-store";
import { eventApi } from "../../entities/event/api";
import { transactionApi } from "../../entities/transaction/api";
import { participantApi } from "../../entities/participant/api";
import { settlementApi } from "../../entities/settlement/api";
import { paymentRequestApi } from "../../entities/payment-request/api";
import type {
  PaymentQR,
  SettlementPlanItem,
} from "../../entities/settlement/types";
import { Modal } from "../../shared/ui/modal";
import { ExpenseForm } from "../../features/transaction-create/ui/expense-form";
import type {
  ExpenseFormValues,
  SplitType,
} from "../../features/transaction-create/ui/expense-form";
import { useToast } from "../../shared/ui/toast";
import { normalizeError } from "../../shared/lib/errors";
import { ConfirmModal } from "../../shared/ui/confirm-modal";
import type { Participant } from "../../entities/participant/types";
import {
  formatMoney,
  formatDate,
  normalizeParticipantName,
} from "../../features/activity/ui/helpers";
import { MemberListModal } from "../../features/activity/ui/member-list-modal";
import { VietQRModal } from "../../features/activity/ui/viet-qr-modal";
import { ExpenseDetailModal } from "../../features/activity/ui/expense-detail-modal";
import { InviteModal } from "../../features/activity/ui/invite-modal";
import { EditExpenseModal } from "../../features/activity/ui/edit-expense-modal";
import { SettleUpCard } from "../../features/activity/ui/settle-up-card";
import { PaymentRequestsCard } from "../../features/activity/ui/payment-requests-card";
import { ExpenseListSection } from "../../features/activity/ui/expense-list-section";

type Txn = {
  id: string | number;
  description?: string;
  amount?: number;
  date?: string;
  createdAt?: string;
  payerNames?: string[];
  payers?: Array<{ name?: string }>;
};

async function fetchTransactions(eventId: string): Promise<Txn[]> {
  const data = await transactionApi.list(eventId);
  if (Array.isArray(data)) return data;
  return (data as any)?.transactions ?? [];
}

export default function ActivityPage() {
  const selectedEventId = useEventStore((s) => s.selectedEventId);
  const setSelectedEventId = useEventStore((s) => s.setSelectedEventId);
  const queryClient = useQueryClient();
  const user = useAuth((s) => s.user);
  const toast = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<ExpenseFormValues | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrSending, setQrSending] = useState(false);
  const [qrData, setQrData] = useState<PaymentQR | null>(null);
  const [qrPlan, setQrPlan] = useState<SettlementPlanItem | null>(null);
  const [listParticipant, setListParticipant] = useState("");
  const [showMemberList, setShowMemberList] = useState(false);
  const [removingParticipantId, setRemovingParticipantId] = useState<
    string | null
  >(null);
  const [dateFilter, setDateFilter] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});
  const [payerFilter, setPayerFilter] = useState<string>("");
  const [amountFilter, setAmountFilter] = useState<{
    min?: number;
    max?: number;
  }>({});

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTxnId, setDetailTxnId] = useState<string | null>(null);

  // State cho Modal Xác nhận
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: eventApi.list,
  });

  const eventList = events as any[];
  const selectedEvent = useMemo(() => {
    return eventList.find(
      (event) => String(event.id) === String(selectedEventId),
    );
  }, [eventList, selectedEventId]);

  // Kiểm tra xem user hiện tại có phải là người tạo event không
  const isCreator = useMemo(() => {
    if (!selectedEvent || !user) return false;
    return String(selectedEvent.createdBy?.id) === String(user.id);
  }, [selectedEvent, user]);

  useEffect(() => {
    if (!eventList.length) {
      if (selectedEventId) setSelectedEventId(null);
      return;
    }
    const match = eventList.find(
      (event) => String(event.id) === String(selectedEventId),
    );
    if (!match) {
      setSelectedEventId(String(eventList[0].id));
    }
  }, [eventList, selectedEventId, setSelectedEventId]);

  const {
    data: transactions = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["transactions", selectedEventId],
    queryFn: () => fetchTransactions(selectedEventId as string),
    enabled: !!selectedEventId,
  });

  const { data: participantsData } = useQuery({
    queryKey: ["participants", selectedEventId],
    queryFn: () => participantApi.list(selectedEventId as string),
    enabled: !!selectedEventId,
  });

  const participants = Array.isArray(participantsData)
    ? participantsData
    : ((participantsData as any)?.participants ?? []);

  const currentParticipantId = useMemo(() => {
    const match = participants.find(
      (p: any) =>
        String(p.userId) === String(user?.id) ||
        (p.email && user?.email && String(p.email) === String(user.email)),
    );
    return match ? String(match.id) : "";
  }, [participants, user?.id, user?.email]);

  const participantOptions = participants.map((p: any) => {
    const isCurrentUser =
      String(p.userId) === String(user?.id) ||
      (p.email && user?.email && String(p.email) === String(user.email));
    return {
      id: String(p.id),
      name: normalizeParticipantName(p.name, user?.name, isCurrentUser),
    };
  });

  const participantNameByLabel = useMemo(() => {
    const map = new Map<string, string>();
    participants.forEach((p: any) => {
      const isCurrentUser =
        String(p.userId) === String(user?.id) ||
        (p.email && user?.email && String(p.email) === String(user.email));
      const displayName = normalizeParticipantName(
        p.name,
        user?.name,
        isCurrentUser,
      );
      if (p.name) map.set(p.name, displayName);
      if (p.email) map.set(p.email, displayName);
    });
    return map;
  }, [participants, user?.id, user?.name]);

  const myParticipant = useMemo(() => {
    if (!user?.id) return null;
    return participants.find((p: any) => p.userId === user.id) ?? null;
  }, [participants, user?.id]);

  const transactionDetailsQueries = useQueries({
    queries: transactions.map((txn) => ({
      queryKey: ["transaction-detail", txn.id],
      queryFn: () => transactionApi.detail(String(txn.id)),
      enabled: !!selectedEventId && !!txn.id && !isLoading,
    })),
  });

  const txnDetailById = useMemo(() => {
    const map = new Map<string, any>();
    transactions.forEach((t, idx) => {
      const q = transactionDetailsQueries[idx];
      if (q?.data) map.set(String(t.id), q.data);
    });
    return map;
  }, [transactions, transactionDetailsQueries]);

  const detailedTransactions = useMemo(() => {
    return transactions.map((txn, index) => {
      const detailQuery = transactionDetailsQueries[index];
      if (detailQuery.isLoading || detailQuery.isError || !detailQuery.data) {
        return { ...txn, yourBalance: 0 };
      }

      const detail = detailQuery.data;
      let yourBalance = 0;

      const isPayer = detail.payers?.some(
        (p: any) => String(p.id) === currentParticipantId,
      );
      const beneficiaries = detail.beneficiaries ?? [];

      if (isPayer) {
        const totalWeight =
          beneficiaries.reduce(
            (sum: number, b: any) => sum + (b.weight || 1),
            0,
          ) || 1;
        const yourWeight =
          beneficiaries.find(
            (b: any) => String(b.participantId) === currentParticipantId,
          )?.weight || 0;
        yourBalance = detail.amount * (yourWeight / totalWeight);
      } else {
        const totalWeight =
          beneficiaries.reduce(
            (sum: number, b: any) => sum + (b.weight || 1),
            0,
          ) || 1;
        const yourWeight =
          beneficiaries.find(
            (b: any) => String(b.participantId) === currentParticipantId,
          )?.weight || 0;
        yourBalance = -(detail.amount * (yourWeight / totalWeight));
      }

      return {
        ...txn,
        yourBalance,
        mainPayerName: detail.payers?.[0]?.name || "Unknown",
      };
    });
  }, [transactions, transactionDetailsQueries, currentParticipantId]);

  const { data: summary } = useQuery({
    queryKey: ["summary", selectedEventId],
    queryFn: () => settlementApi.summary(selectedEventId as string),
    enabled: !!selectedEventId,
  });

  const { data: paymentRequests = [] } = useQuery({
    queryKey: ["payment-requests", selectedEventId],
    queryFn: () => paymentRequestApi.list(selectedEventId as string),
    enabled: !!selectedEventId,
  });

  const createInitialValues = useMemo(
    () =>
      currentParticipantId ? { paidById: currentParticipantId } : undefined,
    [currentParticipantId],
  );

  const myBalance = useMemo(() => {
    if (!summary || !myParticipant) return 0;
    return (
      summary.participants.find((p) => p.id === myParticipant.id)?.balance ?? 0
    );
  }, [summary, myParticipant]);

  const totalExpenses = summary?.event?.totalExpenses;
  const currency = summary?.event?.currency ?? selectedEvent?.currency ?? "VND";
  const youOwe = myBalance < 0 ? Math.abs(myBalance) : 0;
  const youAreOwed = myBalance > 0 ? myBalance : 0;
  const summaryReady = totalExpenses !== undefined;
  const settlementPlan = (summary?.settlementPlan ??
    []) as SettlementPlanItem[];
  const eventIsSettled = useMemo(() => {
    if (!summary) return false;
    const status = String(summary?.event?.status ?? "").toLowerCase();
    if (status === "closed") return true;
    const participants = summary?.participants ?? [];
    if (!participants.length) return false;
    return settlementPlan.length === 0;
  }, [summary, settlementPlan.length]);
  const paymentItems = Array.isArray(paymentRequests) ? paymentRequests : [];
  const outgoingRequests = useMemo(() => {
    if (!myParticipant?.id) return [];
    return paymentItems.filter(
      (req: any) => req.payer?.id === myParticipant.id,
    );
  }, [paymentItems, myParticipant?.id]);
  const incomingRequests = useMemo(() => {
    if (!myParticipant?.id) return [];
    return paymentItems.filter(
      (req: any) => req.receiver?.id === myParticipant.id,
    );
  }, [paymentItems, myParticipant?.id]);
  const relevantPlan = useMemo(() => {
    if (!myParticipant?.id) return [];
    return settlementPlan.filter(
      (item) =>
        item.from.id === myParticipant.id || item.to.id === myParticipant.id,
    );
  }, [settlementPlan, myParticipant?.id]);

  const inviteUrl = useMemo(() => {
    if (!selectedEventId || typeof window === "undefined") return "";
    return `${window.location.origin}/invite/${selectedEventId}`;
  }, [selectedEventId]);

  async function handleCopyInvite() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setInviteCopied(true);
      toast.push("Invite link copied.");
      setTimeout(() => setInviteCopied(false), 1200);
    } catch (err) {
      toast.push(normalizeError(err));
    }
  }

  async function handleRefresh() {
    if (!selectedEventId) return;
    try {
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: ["transactions", selectedEventId],
        }),
        queryClient.refetchQueries({
          queryKey: ["participants", selectedEventId],
        }),
        queryClient.refetchQueries({
          queryKey: ["summary", selectedEventId],
        }),
        queryClient.refetchQueries({
          queryKey: ["payment-requests", selectedEventId],
        }),
        queryClient.refetchQueries({
          queryKey: ["events"],
        }),
      ]);
    } catch (err) {
      toast.push(normalizeError(err));
    }
  }

  function hasPendingOutgoing(plan: SettlementPlanItem) {
    return outgoingRequests.some(
      (req: any) =>
        req.status === "pending" &&
        req.receiver?.id === plan.to.id &&
        Math.abs(Number(req.amount) - Number(plan.amount)) < 0.01,
    );
  }

  async function handleOpenPayment(plan: SettlementPlanItem) {
    if (!selectedEventId) return;
    setQrPlan(plan);
    setQrOpen(true);
    setQrLoading(true);
    setQrData(null);
    try {
      const data = await settlementApi.generateQr(selectedEventId, {
        receiverId: plan.to.id,
        amount: plan.amount,
      });
      setQrData(data);
    } catch (err) {
      toast.push(normalizeError(err));
      setQrOpen(false);
    } finally {
      setQrLoading(false);
    }
  }

  async function handleMarkPaid() {
    if (!selectedEventId || !qrPlan) return;
    if (!myParticipant?.id || qrPlan.from.id !== myParticipant.id) {
      toast.push("This payment is not assigned to you.");
      return;
    }
    setQrSending(true);
    try {
      await paymentRequestApi.create(selectedEventId, {
        payerId: qrPlan.from.id,
        receiverId: qrPlan.to.id,
        amount: qrPlan.amount,
      });
      toast.push("Payment submitted. Waiting for confirmation.");
      setQrOpen(false);
      setQrData(null);
      setQrPlan(null);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["payment-requests", selectedEventId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["summary", selectedEventId],
        }),
      ]);
    } catch (err) {
      toast.push(normalizeError(err));
    } finally {
      setQrSending(false);
    }
  }

  async function handleConfirmRequest(requestId: string) {
    if (!selectedEventId) return;
    try {
      await paymentRequestApi.confirm(selectedEventId, requestId);
      toast.push("Payment confirmed.");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["payment-requests", selectedEventId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["summary", selectedEventId],
        }),
      ]);
    } catch (err) {
      toast.push(normalizeError(err));
    }
  }

  async function handleCancelRequest(requestId: string) {
    if (!selectedEventId) return;
    try {
      await paymentRequestApi.cancel(selectedEventId, requestId);
      toast.push("Payment canceled.");
      await queryClient.invalidateQueries({
        queryKey: ["payment-requests", selectedEventId],
      });
    } catch (err) {
      toast.push(normalizeError(err));
    }
  }

  async function handleCreateExpense(values: ExpenseFormValues) {
    if (!selectedEventId) return;
    if (participantOptions.length === 0) {
      toast.push("Add at least one participant first.");
      return;
    }
    const payerId = values.paidById || currentParticipantId;
    if (!payerId) {
      toast.push("Unable to detect who paid. Please refresh and try again.");
      return;
    }
    const beneficiaries =
      values.beneficiaries && values.beneficiaries.length > 0
        ? values.beneficiaries
        : participantOptions.map((p: Participant) => ({
            participantId: p.id,
            weight: 1,
          }));
    await transactionApi.create(selectedEventId, {
      description: values.description,
      amount: values.amount,
      payers: [payerId],
      beneficiaries,
    });
    setCreateOpen(false);
    await refetch();
  }

  async function handleEditExpense(txnId: string) {
    if (!selectedEventId) return;
    setEditOpen(true);
    setEditLoading(true);
    setEditingId(txnId);
    try {
      const detail = await transactionApi.detail(txnId);
      const paidById =
        detail.payers?.[0]?.id ?? participantOptions[0]?.id ?? "";
      const beneficiaries = detail.beneficiaries ?? [];
      let splitType: SplitType = "equal";
      if (beneficiaries.length > 1) {
        const firstWeight = beneficiaries[0]?.weight ?? 0;
        const isEqual = beneficiaries.every(
          (b) => Math.abs(b.weight - firstWeight) < 0.0001,
        );
        splitType = isEqual ? "equal" : "exact";
      }
      setEditValues({
        description: detail.description ?? "",
        amount: detail.amount ?? 0,
        paidById,
        splitType,
        note: "",
        beneficiaries,
      });
    } catch (err) {
      toast.push(normalizeError(err));
      setEditOpen(false);
      setEditingId(null);
    } finally {
      setEditLoading(false);
    }
  }

  async function handleUpdateExpense(values: ExpenseFormValues) {
    if (!editingId) return;
    if (participantOptions.length === 0) {
      toast.push("Add at least one participant first.");
      return;
    }
    const beneficiaries =
      values.beneficiaries && values.beneficiaries.length > 0
        ? values.beneficiaries
        : participantOptions.map((p: Participant) => ({
            participantId: p.id,
            weight: 1,
          }));
    await transactionApi.update(editingId, {
      description: values.description,
      amount: values.amount,
      payers: [values.paidById],
      beneficiaries,
    });
    setEditOpen(false);
    setEditValues(null);
    setEditingId(null);
    await refetch();
  }

  function handleDeleteExpense() {
    if (!selectedEventId || !editingId) return;

    setConfirmState({
      open: true,
      title: "Delete expense",
      message: "Delete this expense? This cannot be undone.",
      confirmText: "Delete",
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, open: false }));
        setDeleteLoading(true);
        try {
          await transactionApi.remove(String(selectedEventId), editingId);
          toast.push("Expense deleted.");
          setEditOpen(false);
          setEditValues(null);
          setEditingId(null);
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: ["transactions", selectedEventId],
            }),
            queryClient.invalidateQueries({
              queryKey: ["summary", selectedEventId],
            }),
            queryClient.invalidateQueries({
              queryKey: ["events"],
            }),
          ]);
        } catch (err) {
          toast.push(normalizeError(err));
        } finally {
          setDeleteLoading(false);
        }
      },
    });
  }

  function handleDeleteActivity() {
    const deleteId = selectedEvent?.id ?? selectedEventId;
    if (!deleteId) {
      toast.push("Select an activity first.");
      return;
    }
    const name = selectedEvent?.name ?? "this activity";
    setConfirmState({
      open: true,
      title: "Delete activity",
      message: `Delete "${name}"? This will remove all its expenses.`,
      confirmText: "Delete",
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, open: false }));
        try {
          await eventApi.remove(String(deleteId));
          const remaining = eventList.filter(
            (event) => String(event.id) !== String(deleteId),
          );
          setSelectedEventId(remaining[0] ? String(remaining[0].id) : null);
          setCreateOpen(false);
          setEditOpen(false);
          setEditValues(null);
          setEditingId(null);
          await queryClient.invalidateQueries({ queryKey: ["events"] });
        } catch (err) {
          toast.push(normalizeError(err));
        }
      },
    });
  }

  const handleListParticipant = () => {
    if (!participants || participants.length === 0) {
      return;
    }

    const participantList = participants
      .map((p: any, index: number) => {
        const isCurrentUser =
          String(p.userId) === String(user?.id) ||
          (p.email && user?.email && String(p.email) === String(user.email));

        const displayName = normalizeParticipantName(
          p.name,
          user?.name,
          isCurrentUser,
        );

        const emailPart = p.email ? ` (${p.email})` : "";
        const youTag = isCurrentUser ? " (you)" : "";

        return `${index + 1}. ${displayName}${emailPart}${youTag}`;
      })
      .join("\n");

    const result = `${participantList}`;

    setListParticipant(result);
  };

  async function handleRemoveParticipant(participant: any) {
    if (!selectedEventId) return;

    const pSummary = summary?.participants?.find(
      (p: any) => String(p.id) === String(participant.id),
    );
    const balance = pSummary?.balance ?? 0;
    const totalPaid = pSummary?.totalPaid ?? 0;
    const totalBenefit = pSummary?.totalBenefit ?? 0;
    if (totalPaid > 0 || totalBenefit > 0) {
      toast.push(
        `Cannot remove ${participant.name || "this member"} because they are part of existing expenses.`,
      );
      return;
    }
    if (Math.abs(balance) > 0.01) {
      toast.push(
        `Cannot remove ${participant.name || "this member"}. They still have unsettled payments.`,
      );
      return;
    }

    setConfirmState({
      open: true,
      title: "Remove member",
      message: `Remove ${participant.name || "this member"} from the activity?`,
      confirmText: "Remove",
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, open: false }));
        setRemovingParticipantId(participant.id);
        try {
          await participantApi.remove(String(participant.id));
          toast.push("Member removed.");
          await handleRefresh();
        } catch (err) {
          toast.push(normalizeError(err));
        } finally {
          setRemovingParticipantId(null);
        }
      },
    });
  }

  const filteredRows = useMemo(() => {
    let result = detailedTransactions.map((t) => {
      const payerNames = t.payerNames ?? [];
      const resolvedPayerNames = payerNames.map(
        (name) => participantNameByLabel.get(name) ?? name,
      );

      const dateRaw = t.date ?? t.createdAt;
      const txnDate = dateRaw ? new Date(dateRaw) : null;

      return {
        id: String(t.id),
        description: t.description ?? "Untitled",
        amount: Number(t.amount ?? 0),
        dateLabel: formatDate(dateRaw),
        payerLabel: resolvedPayerNames.length
          ? resolvedPayerNames.join(", ")
          : "Unknown payer",
        payerNames: resolvedPayerNames,
        rawDate: txnDate,
        yourBalance: t.yourBalance || 0,
      };
    });

    if (dateFilter.startDate) {
      const start = new Date(dateFilter.startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter((r) => r.rawDate && r.rawDate >= start);
    }
    if (dateFilter.endDate) {
      const end = new Date(dateFilter.endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter((r) => r.rawDate && r.rawDate <= end);
    }

    if (payerFilter) {
      const selectedPayerName =
        participantOptions.find((p: Participant) => p.id === payerFilter)
          ?.name || "";
      if (selectedPayerName) {
        result = result.filter((r) =>
          r.payerNames.some((name) =>
            name.toLowerCase().includes(selectedPayerName.toLowerCase()),
          ),
        );
      }
    }

    if (amountFilter.min !== undefined) {
      result = result.filter((r) => r.amount >= amountFilter.min!);
    }
    if (amountFilter.max !== undefined) {
      result = result.filter((r) => r.amount <= amountFilter.max!);
    }

    return result;
  }, [
    detailedTransactions,
    participantNameByLabel,
    dateFilter,
    payerFilter,
    amountFilter,
    participantOptions,
    currentParticipantId,
  ]);

  return (
    <div className="animate-enter space-y-8">
      <div className="bg-[#FAEBE6] w-full min-h-[12rem] rounded-[32px] flex items-center justify-between shadow-sm relative overflow-hidden px-8 py-6 gap-6 flex-wrap">
        <div className="absolute w-72 h-72 bg-white opacity-20 blur-3xl rounded-full -top-10 -left-10" />
        <div className="z-10">
          {selectedEvent?.name ? (
            <>
              <div className="text-3xl font-extrabold text-gray-900 tracking-tight font-display">
                {selectedEvent.name}
              </div>
            </>
          ) : (
            <p className="text-gray-600 mt-2">
              Pick an activity from the sidebar to manage expenses.
            </p>
          )}
        </div>

        <div className="z-10 flex flex-col items-end gap-3">
          <div className="rounded-2xl bg-white/70 border border-white/60 px-4 py-3 text-right shadow-sm min-w-[220px]">
            <div className="text-xs font-semibold text-gray-500">
              Total expenses
            </div>
            <div className="text-2xl font-extrabold text-gray-900 mt-1">
              {summaryReady ? formatMoney(Number(totalExpenses ?? 0)) : "--"}{" "}
              <span className="text-sm font-semibold text-gray-400">
                {currency}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap justify-end gap-2">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                You are owed {summaryReady ? formatMoney(youAreOwed) : "--"}
              </span>
              <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                You owe {summaryReady ? formatMoney(youOwe) : "--"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              disabled={!selectedEventId}
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              onClick={() => {
                setShowMemberList(true);
                handleListParticipant();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              disabled={!selectedEventId}
            >
              <Users size={16} />
              Member list
            </button>

            <button
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={() => setInviteOpen(true)}
              disabled={!selectedEventId}
            >
              <Link2 size={16} />
              Invite
            </button>

            <button
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gray-900 text-white text-sm font-semibold hover:scale-105 transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={() => setCreateOpen(true)}
              disabled={!selectedEventId || participantOptions.length === 0}
            >
              <Plus size={16} />
              New expense
            </button>

            <button
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-rose-200 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleDeleteActivity}
              disabled={!selectedEventId}
            >
              <Trash2 size={16} />
              Delete activity
            </button>
          </div>
        </div>
      </div>

      {selectedEventId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SettleUpCard
            relevantPlan={relevantPlan}
            currency={currency}
            myParticipantId={myParticipant?.id}
            hasPendingOutgoing={hasPendingOutgoing}
            handleOpenPayment={handleOpenPayment}
          />

          <PaymentRequestsCard
            paymentItems={paymentItems}
            incomingRequests={incomingRequests}
            outgoingRequests={outgoingRequests}
            currency={currency}
            handleConfirmRequest={handleConfirmRequest}
            handleCancelRequest={handleCancelRequest}
          />
        </div>
      )}

      {!selectedEventId && (
        <div className="text-gray-500">
          {eventList.length === 0
            ? "No activities yet. Create an event to get started."
            : "Select an activity to see transactions."}
        </div>
      )}

      {selectedEventId && isLoading && (
        <div className="text-gray-500">Loading transactions...</div>
      )}

      {selectedEventId && isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          Failed to load transactions: {normalizeError(error)}
          <button className="underline ml-2" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      {selectedEventId && !isLoading && !isError && (
        <ExpenseListSection
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          payerFilter={payerFilter}
          setPayerFilter={setPayerFilter}
          amountFilter={amountFilter}
          setAmountFilter={setAmountFilter}
          participantOptions={participantOptions}
          filteredRows={filteredRows}
          eventIsSettled={eventIsSettled}
          transactionsLength={transactions.length}
          setDetailTxnId={setDetailTxnId}
          setDetailOpen={setDetailOpen}
          handleEditExpense={handleEditExpense}
        />
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New expense"
      >
        {participantOptions.length === 0 ? (
          <div className="text-sm text-gray-600">
            Add participants to this event before creating a transaction.
          </div>
        ) : (
          <ExpenseForm
            participants={participantOptions}
            onSubmit={handleCreateExpense}
            initialValues={createInitialValues}
          />
        )}
      </Modal>

      <InviteModal
        open={inviteOpen}
        onClose={() => {
          setInviteOpen(false);
          setInviteCopied(false);
        }}
        selectedEvent={selectedEvent}
        inviteUrl={inviteUrl}
        inviteCopied={inviteCopied}
        handleCopyInvite={handleCopyInvite}
        participants={participants}
        user={user}
      />

      <EditExpenseModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditValues(null);
          setEditingId(null);
        }}
        editLoading={editLoading}
        editValues={editValues}
        participantOptions={participantOptions}
        handleUpdateExpense={handleUpdateExpense}
        handleDeleteExpense={handleDeleteExpense}
        deleteLoading={deleteLoading}
      />

      <VietQRModal
        open={qrOpen}
        onClose={() => {
          setQrOpen(false);
          setQrData(null);
          setQrPlan(null);
        }}
        qrLoading={qrLoading}
        qrData={qrData}
        qrPlan={qrPlan}
        currency={currency}
        handleMarkPaid={handleMarkPaid}
        qrSending={qrSending}
      />

      <ExpenseDetailModal
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setDetailTxnId(null);
        }}
        detailTxnId={detailTxnId}
        txnDetailById={txnDetailById}
        currentParticipantId={currentParticipantId}
        participantOptions={participantOptions}
        currency={currency}
      />

      <MemberListModal
        open={showMemberList}
        onClose={() => setShowMemberList(false)}
        participants={participants}
        user={user}
        isCreator={isCreator}
        removingParticipantId={removingParticipantId}
        handleRemoveParticipant={handleRemoveParticipant}
        listParticipant={listParticipant}
      />

      <ConfirmModal
        open={confirmState.open}
        onClose={() => setConfirmState((prev) => ({ ...prev, open: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
      />
    </div>
  );
}
