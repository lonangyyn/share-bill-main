import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Check, Copy, Link2, Pencil, Plus, RefreshCw, Trash2, Users } from "lucide-react";
import { useQueries } from "@tanstack/react-query";

import { useAuth } from "../../features/auth/model/use-auth";
import { useEventStore } from "../../stores/use-event-store";
import { eventApi } from "../../entities/event/api";
import { transactionApi } from "../../entities/transaction/api";
import { participantApi } from "../../entities/participant/api";
import { settlementApi } from "../../entities/settlement/api";
import { paymentRequestApi } from "../../entities/payment-request/api";
import type { PaymentQR, SettlementPlanItem } from "../../entities/settlement/types";
import { Modal } from "../../shared/ui/modal";
import { Input } from "../../shared/ui/input";
import { ExpenseForm } from "../../features/transaction-create/ui/expense-form";
import type {
  ExpenseFormValues,
  SplitType,
} from "../../features/transaction-create/ui/expense-form";
import { useToast } from "../../shared/ui/toast";
import { normalizeError } from "../../shared/lib/errors";

type Txn = {
  id: string | number;
  description?: string;
  amount?: number;
  date?: string;
  createdAt?: string;
  payerNames?: string[];
  payers?: Array<{ name?: string }>;
};

function formatMoney(v: number) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(v);
}

function isEmailLike(value?: string) {
  return !!value && value.includes("@");
}

function normalizeParticipantName(
  rawName?: string,
  fallbackName?: string,
  preferFallback?: boolean
) {
  const fallback = fallbackName?.trim() ?? "";
  if (preferFallback && fallback && !isEmailLike(fallback)) return fallback;

  const cleaned = rawName?.trim() ?? "";
  if (cleaned && !isEmailLike(cleaned)) return cleaned;

  if (fallback && !isEmailLike(fallback)) return fallback;

  return "Member";
}

function formatDate(input?: string) {
  if (!input) return "-";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("vi-VN");
}

function roundMoney(v: number) {
  // hiển thị đẹp, tránh lẻ
  return Math.round(v);
}

function computeExpenseNetByParticipant(detail: any) {
  const amount = Number(detail?.amount ?? 0);
  const payers = Array.isArray(detail?.payers) ? detail.payers : [];
  const beneficiaries = Array.isArray(detail?.beneficiaries) ? detail.beneficiaries : [];

  const payerCount = payers.length || 0;
  const paidEach = payerCount > 0 ? amount / payerCount : 0;

  // share theo weight
  const totalWeight =
    beneficiaries.reduce((sum: number, b: any) => sum + Number(b.weight ?? 0), 0) || 1;

  const shareByPid = new Map<string, number>();
  beneficiaries.forEach((b: any) => {
    const pid = String(b.participantId ?? b.id ?? "");
    if (!pid) return;
    const w = Number(b.weight ?? 0);
    const share = amount * (w / totalWeight);
    shareByPid.set(pid, (shareByPid.get(pid) ?? 0) + share);
  });

  // net = paid - share
  // +net => receive, -net => pay
  const netByPid = new Map<string, number>();

  // init tất cả người có trong beneficiaries
  beneficiaries.forEach((b: any) => {
    const pid = String(b.participantId ?? "");
    if (!pid) return;
    netByPid.set(pid, -(shareByPid.get(pid) ?? 0));
  });

  // cộng phần đã trả cho payer(s)
  payers.forEach((p: any) => {
    const pid = String(p.id ?? p.participantId ?? "");
    if (!pid) return;
    netByPid.set(pid, (netByPid.get(pid) ?? 0) + paidEach);
  });

  return netByPid; // Map<participantId, net>
}


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
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
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
  const [dateFilter, setDateFilter] = useState<{ startDate?: string; endDate?: string }>({});
  const [payerFilter, setPayerFilter] = useState<string>("");
  const [amountFilter, setAmountFilter] = useState<{ min?: number; max?: number }>({});

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTxnId, setDetailTxnId] = useState<string | null>(null);


  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: eventApi.list,
  });

  const eventList = events as any[];
  const selectedEvent = useMemo(() => {
    return eventList.find((event) => String(event.id) === String(selectedEventId));
  }, [eventList, selectedEventId]);

  useEffect(() => {
    if (!eventList.length) {
      if (selectedEventId) setSelectedEventId(null);
      return;
    }
    const match = eventList.find(
      (event) => String(event.id) === String(selectedEventId)
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
    : (participantsData as any)?.participants ?? [];

  const currentParticipantId = useMemo(() => {
    const match = participants.find(
      (p: any) =>
        String(p.userId) === String(user?.id) ||
        (p.email && user?.email && String(p.email) === String(user.email))
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
      const displayName = normalizeParticipantName(p.name, user?.name, isCurrentUser);
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
        return { ...txn, yourBalance: 0 }; // fallback nếu đang load/lỗi
      }

      const detail = detailQuery.data;
      let yourBalance = 0;

      const isPayer = detail.payers?.some((p: any) => String(p.id) === currentParticipantId);
      const beneficiaries = detail.beneficiaries ?? [];

      if (isPayer) {
        // Bạn là payer → tính phần bạn được hưởng
        const totalWeight = beneficiaries.reduce((sum: number, b: any) => sum + (b.weight || 1), 0) || 1;
        const yourWeight = beneficiaries.find((b: any) => String(b.participantId) === currentParticipantId)?.weight || 0;
        yourBalance = detail.amount * (yourWeight / totalWeight); // bạn được hưởng
      } else {
        // Bạn là beneficiary → tính phần phải trả
        const totalWeight = beneficiaries.reduce((sum: number, b: any) => sum + (b.weight || 1), 0) || 1;
        const yourWeight = beneficiaries.find((b: any) => String(b.participantId) === currentParticipantId)?.weight || 0;
        yourBalance = - (detail.amount * (yourWeight / totalWeight)); // bạn nợ
      }

      return {
        ...txn,
        yourBalance,
        mainPayerName: detail.payers?.[0]?.name || "Unknown", // tên người trả chính
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
    () => (currentParticipantId ? { paidById: currentParticipantId } : undefined),
    [currentParticipantId]
  );

  const myBalance = useMemo(() => {
    if (!summary || !myParticipant) return 0;
    return (
      summary.participants.find((p) => p.id === myParticipant.id)?.balance ?? 0
    );
  }, [summary, myParticipant]);

  const totalExpenses = summary?.event?.totalExpenses;
  const currency =
    summary?.event?.currency ?? selectedEvent?.currency ?? "VND";
  const youOwe = myBalance < 0 ? Math.abs(myBalance) : 0;
  const youAreOwed = myBalance > 0 ? myBalance : 0;
  const summaryReady = totalExpenses !== undefined;
  const settlementPlan = (summary?.settlementPlan ?? []) as SettlementPlanItem[];
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
    return paymentItems.filter((req: any) => req.payer?.id === myParticipant.id);
  }, [paymentItems, myParticipant?.id]);
  const incomingRequests = useMemo(() => {
    if (!myParticipant?.id) return [];
    return paymentItems.filter((req: any) => req.receiver?.id === myParticipant.id);
  }, [paymentItems, myParticipant?.id]);
  const relevantPlan = useMemo(() => {
    if (!myParticipant?.id) return [];
    return settlementPlan.filter(
      (item) => item.from.id === myParticipant.id || item.to.id === myParticipant.id
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

  async function handleInviteByEmail() {
    if (!selectedEventId || !inviteEmail.trim()) {
      toast.push("Please enter an email address.");
      return;
    }

    if (!inviteEmail.includes("@")) {
      toast.push("Please enter a valid email address.");
      return;
    }

    setInviteLoading(true);
    try {
      await participantApi.inviteByEmail(selectedEventId, {
        email: inviteEmail.trim(),
      });
      
      toast.push("Participant invited successfully.");
      setInviteEmail("");
      
      // Refresh danh sách participants
      await queryClient.invalidateQueries({
        queryKey: ["participants", selectedEventId],
      });
    } catch (err) {
      toast.push(normalizeError(err));
    } finally {
      setInviteLoading(false);
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
        Math.abs(Number(req.amount) - Number(plan.amount)) < 0.01
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
        : participantOptions.map((p) => ({
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
          (b) => Math.abs(b.weight - firstWeight) < 0.0001
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
        : participantOptions.map((p) => ({
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

  async function handleDeleteExpense() {
    if (!selectedEventId || !editingId) return;
    const confirmed = window.confirm("Delete this expense? This cannot be undone.");
    if (!confirmed) return;
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
  }

  async function handleDeleteActivity() {
    const deleteId = selectedEvent?.id ?? selectedEventId;
    if (!deleteId) {
      toast.push("Select an activity first.");
      return;
    }
    const name = selectedEvent?.name ?? "this activity";
    const confirmed = window.confirm(
      `Delete "${name}"? This will remove all its expenses.`
    );
    if (!confirmed) return;

    try {
      await eventApi.remove(String(deleteId));
      const remaining = eventList.filter(
        (event) => String(event.id) !== String(deleteId)
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
  }

  const handleListParticipant = () => {
    if (!participants || participants.length === 0) {
      setListParticipant("There isn't any member in this event.");
      return;
    }

    const participantList = participants
      .map((p: any, index: number) => {
        const isCurrentUser =
          String(p.userId) === String(user?.id) ||
          (p.email && user?.email && String(p.email) === String(user.email));

        const displayName = normalizeParticipantName(p.name, user?.name, isCurrentUser);

        const emailPart = p.email ? ` (${p.email})` : "";
        const youTag = isCurrentUser ? " (you)" : "";

        return `${index + 1}. ${displayName}${emailPart}${youTag}`;
      })
      .join("\n");

    const result = `${participantList}`;

    setListParticipant(result);
  };

  const filteredRows = useMemo(() => {
    let result = detailedTransactions.map((t) => {
    const payerNames = t.payerNames ?? [];
    const resolvedPayerNames = payerNames.map(name => 
      participantNameByLabel.get(name) ?? name
    );

    const dateRaw = t.date ?? t.createdAt;
    const txnDate = dateRaw ? new Date(dateRaw) : null;

    return {
      id: String(t.id),
      description: t.description ?? "Untitled",
      amount: Number(t.amount ?? 0),
      dateLabel: formatDate(dateRaw),
      payerLabel: resolvedPayerNames.length ? resolvedPayerNames.join(", ") : "Unknown payer",
      payerNames: resolvedPayerNames,
      rawDate: txnDate,
      yourBalance: t.yourBalance || 0,
      mainPayerName: t.mainPayerName || resolvedPayerNames[0] || "Unknown",
    };
  });

    // Lọc như cũ (giữ nguyên phần lọc ngày, tên, tiền)
    if (dateFilter.startDate) {
      const start = new Date(dateFilter.startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter(r => r.rawDate && r.rawDate >= start);
    }
    if (dateFilter.endDate) {
      const end = new Date(dateFilter.endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(r => r.rawDate && r.rawDate <= end);
    }

    if (payerFilter) {
      const selectedPayerName = participantOptions.find(p => p.id === payerFilter)?.name || "";
      if (selectedPayerName) {
        result = result.filter(r => 
          r.payerNames.some(name => name.toLowerCase().includes(selectedPayerName.toLowerCase()))
        );
      }
    }

    if (amountFilter.min !== undefined) {
      result = result.filter(r => r.amount >= amountFilter.min!);
    }
    if (amountFilter.max !== undefined) {
      result = result.filter(r => r.amount <= amountFilter.max!);
    }

    return result;
  }, [
    detailedTransactions,
    participantNameByLabel,
    dateFilter,
    payerFilter,
    amountFilter,
    participantOptions,
    currentParticipantId, // thêm để tính balance
  ]);

  return (
    <div className="animate-enter space-y-8">
      <div className="bg-[#FAEBE6] w-full min-h-[12rem] rounded-[32px] flex items-center justify-between shadow-sm relative overflow-hidden px-8 py-6 gap-6 flex-wrap">
        <div className="absolute w-72 h-72 bg-white opacity-20 blur-3xl rounded-full -top-10 -left-10" />
        <div className="z-10">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight font-display">
            Activity
          </h1>
          {selectedEvent?.name ? (
            <>
              <div className="text-sm font-semibold text-gray-700 mt-2">
                {selectedEvent.name}
              </div>
              <p className="text-gray-600 mt-1">
                Recent transactions for this activity.
              </p>
            </>
          ) : (
            <p className="text-gray-600 mt-2">
              Pick an activity to manage expenses.
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="text-xs font-semibold text-gray-500">Activity</div>
            <select
              className="h-10 min-w-[220px] rounded-2xl bg-white/90 px-4 text-sm text-gray-800 outline-none border border-transparent focus:border-purple-300"
              value={selectedEventId ?? ""}
              onChange={(e) => setSelectedEventId(e.target.value || null)}
              disabled={eventList.length === 0}
            >
              <option value="" disabled>
                Select activity
              </option>
              {eventList.map((event) => (
                <option key={String(event.id)} value={String(event.id)}>
                  {event?.name ?? "Untitled"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="z-10 flex flex-col items-end gap-3">
          <div className="rounded-2xl bg-white/70 border border-white/60 px-4 py-3 text-right shadow-sm min-w-[220px]">
            <div className="text-xs font-semibold text-gray-500">Total expenses</div>
            <div className="text-2xl font-extrabold text-gray-900 mt-1">
              {summaryReady ? formatMoney(Number(totalExpenses ?? 0)) : "--"}{" "}
              <span className="text-sm font-semibold text-gray-400">
                {currency}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap justify-end gap-2">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                You are owed{" "}
                {summaryReady ? formatMoney(youAreOwed) : "--"}
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

            {/* Button Member list - chỉ dùng sau khi import Users */}
            <button
              onClick={() => {
                setShowMemberList(true);
                handleListParticipant()
              }
            }
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
                {relevantPlan.map((plan) => {
                  const isPayer = plan.from.id === myParticipant?.id;
                  const isReceiver = plan.to.id === myParticipant?.id;
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
          </div>

          <div className="bg-white rounded-[24px] border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Payment requests
              </h2>
              <span className="text-xs text-gray-400">
                {paymentItems.length} total
              </span>
            </div>

            {paymentItems.length === 0 ? (
              <div className="text-sm text-gray-500">
                No payment requests yet.
              </div>
            ) : (
              <div className="space-y-4">
                {incomingRequests.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500">
                      Incoming
                    </div>
                    <div className="mt-2 space-y-2">
                      {incomingRequests.map((req: any) => {
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
                  </div>
                )}

                {outgoingRequests.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500">
                      Outgoing
                    </div>
                    <div className="mt-2 space-y-2">
                      {outgoingRequests.map((req: any) => {
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
                  </div>
                )}
              </div>
            )}
          </div>
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

      {selectedEventId && !isLoading && !isError && filteredRows.length === 0 && (
        <div className="text-gray-500">No transactions yet.</div>
      )}

      {selectedEventId && !isLoading && !isError && (
        <div className="space-y-6">
          {/* Bộ lọc chi tiêu */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Expense Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Thời gian */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Time</label>
                <div className="flex gap-3">
                  <Input
                    type="date"
                    value={dateFilter.startDate || ""}
                    onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                    className="flex-1 h-10 rounded-2xl border-gray-200"
                  />
                  <Input
                    type="date"
                    value={dateFilter.endDate || ""}
                    onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                    className="flex-1 h-10 rounded-2xl border-gray-200"
                  />
                </div>
              </div>

              {/* Người trả */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Payer</label>
                <select
                  value={payerFilter}
                  onChange={e => setPayerFilter(e.target.value)}
                  className="w-full h-10 rounded-2xl border border-gray-200 px-4 text-sm text-gray-800 outline-none focus:border-purple-300"
                >
                  <option value="">All payers</option>
                  {participantOptions.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Khoảng tiền */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Amount of money</label>
                <div className="flex gap-3">
                  <Input
                    type="number"
                    placeholder="From"
                    value={amountFilter.min ?? ""}
                    onChange={e => setAmountFilter(prev => ({ ...prev, min: Number(e.target.value) || undefined }))}
                    className="flex-1 h-10 rounded-2xl border-gray-200"
                  />
                  <Input
                    type="number"
                    placeholder="To"
                    value={amountFilter.max ?? ""}
                    onChange={e => setAmountFilter(prev => ({ ...prev, max: Number(e.target.value) || undefined }))}
                    className="flex-1 h-10 rounded-2xl border-gray-200"
                  />
                </div>
              </div>
            </div>

            {/* Nút reset khi có bộ lọc */}
            {(dateFilter.startDate || dateFilter.endDate || payerFilter || amountFilter.min !== undefined || amountFilter.max !== undefined) && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setDateFilter({});
                    setPayerFilter("");
                    setAmountFilter({});
                  }}
                  className="text-sm text-purple-600 hover:text-purple-800 font-medium underline"
                >
                  Remove filter
                </button>
              </div>
            )}
          </div>

          {/* Danh sách expense */}
          <div className="space-y-3">
            {filteredRows.length > 0 ? (
              filteredRows.map(t => (
                <div
                  key={t.id}
                  className={`rounded-[24px] border px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:shadow-sm transition-shadow gap-4 ${
                    eventIsSettled ? "bg-emerald-50 border-emerald-100" : "bg-white border-gray-100"
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
                    {/* Số tiền tổng */}
                    <div className="text-sm font-extrabold text-gray-900 whitespace-nowrap">
                      {formatMoney(t.amount)} <span className="text-xs font-semibold text-gray-400">VND</span>
                    </div>

                    {/* Balance cá nhân */}
                    {t.yourBalance !== 0 && (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                          t.yourBalance > 0
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {t.yourBalance > 0 ? (
                          `You are owed ${formatMoney(Math.abs(t.yourBalance))} VND`
                        ) : (
                          `You owe ${formatMoney(Math.abs(t.yourBalance))} VND`
                        )}
                      </span>
                    )}

                    {/* View detail */}
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

                    {/* Nút Edit */}
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
                )
              )
            ) : (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border border-gray-200">
                {transactions.length === 0
                  ? "Chưa có chi tiêu nào trong hoạt động này."
                  : "Không tìm thấy chi tiêu nào phù hợp với bộ lọc."}
              </div>
            )}
          </div>
        </div>
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

      <Modal
        open={inviteOpen}
        onClose={() => {
          setInviteOpen(false);
          setInviteCopied(false);
        }}
        title="Invite people"
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-rose-50 p-4">
            <div className="text-xs font-semibold text-orange-700">Share this link</div>
            <div className="text-lg font-extrabold text-gray-900 mt-1">
              {selectedEvent?.name ?? "Selected activity"}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Anyone with this link can join the activity after signing in.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Invite link</label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                readOnly
                value={inviteUrl}
                placeholder="Select an activity to generate link"
                onFocus={(e) => e.currentTarget.select()}
              />
              <button
                type="button"
                onClick={handleCopyInvite}
                disabled={!inviteUrl}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {inviteCopied ? <Check size={16} /> : <Copy size={16} />}
                {inviteCopied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="text-xs text-gray-500">
              Send this link to your friends. It works on mobile and desktop.
            </div>
          </div>

          {/* Danh sách participants hiện tại */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Current participants</label>
              <span className="text-xs text-gray-400">{participants.length} members</span>
            </div>
      
            {participants.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">
                No participants yet. Add some!
              </div>
            ) : (
        
            <div className="max-h-64 overflow-y-auto space-y-2">
            {participants.map((p: any) => {
              const isCurrentUser =
                String(p.userId) === String(user?.id) ||
                (p.email && user?.email && String(p.email) === String(user.email));
              const displayName = normalizeParticipantName(p.name, user?.name, isCurrentUser);
              
              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-gray-900 truncate">
                      {displayName}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs font-normal text-gray-500">(You)</span>
                      )}
                    </div>
                    {p.email && (
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {p.email}
                      </div>
                    )}
                  </div>
                  
                  {p.bankInfo?.accountNumber && (
                    <div className="ml-3 flex-shrink-0">
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        Bank linked
                      </span>
                    </div>
                 )}
                </div>
              );
            })}
          </div>
        )}
      </div>


          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="truncate">Sharever invites are tied to this activity.</span>
            <button
              type="button"
              onClick={() => {
                if (!inviteUrl) return;
                window.open(inviteUrl, "_blank", "noopener,noreferrer");
              }}
              disabled={!inviteUrl}
              className="font-semibold text-gray-600 hover:text-gray-900 disabled:opacity-60"
            >
              Open link
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditValues(null);
          setEditingId(null);
        }}
        title="Edit expense"
      >
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

      <Modal
        open={qrOpen}
        onClose={() => {
          setQrOpen(false);
          setQrData(null);
          setQrPlan(null);
        }}
        title="Pay with VietQR"
      >
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
                onClick={() => setQrOpen(false)}
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
          <div className="text-sm text-gray-600">
            Unable to load QR code.
          </div>
        )}
      </Modal>

      <Modal
  open={detailOpen}
  onClose={() => {
    setDetailOpen(false);
    setDetailTxnId(null);
  }}
  title="Expense detail"
>
  {(() => {
    if (!detailTxnId) return <div className="text-sm text-gray-600">No expense selected.</div>;

    const detail = txnDetailById.get(detailTxnId);
    if (!detail) return <div className="text-sm text-gray-600">Loading detail...</div>;

    const netByPid = computeExpenseNetByParticipant(detail);

    // build rows for UI
    const rows = Array.from(netByPid.entries())
      .map(([pid, net]) => {
        const isYou = String(pid) === String(currentParticipantId);
        const name = isYou
          ? "You"
          : participantOptions.find((p) => String(p.id) === String(pid))?.name ?? "Member";

        return {
          pid,
          name,
          net,
          abs: Math.abs(net),
          type: net >= 0 ? "receive" : "pay",
        };
      })
      // sort: receive trước, rồi pay
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
            Total: <span className="font-semibold text-gray-700">{formatMoney(Number(detail.amount ?? 0))} {currencyLabel}</span>
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
                  r.type === "receive" ? "text-emerald-700" : "text-rose-700"
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
            onClick={() => {
              setDetailOpen(false);
              setDetailTxnId(null);
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  })()}
</Modal>


      {/* === THÊM MODAL DANH SÁCH THÀNH VIÊN NGAY ĐÂY === */}
      <Modal
        open={showMemberList}
        onClose={() => setShowMemberList(false)}
        title="Danh sách thành viên"
      >
        <div className="space-y-6">
          {participants.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Chưa có thành viên nào trong hoạt động này.
            </div>
          ) : (
            <>
              {/* Thông tin tổng quan */}
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-700">
                  Tổng cộng: <span className="font-bold">{participants.length}</span> thành viên
                </div>
                <div className="text-xs text-gray-500">
                  Đã copy danh sách vào clipboard!
                </div>
              </div>

              {/* Danh sách dạng thẻ đẹp */}
              <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-2">
                {participants.map((p: any) => {
                  const isCurrentUser =
                    String(p.userId) === String(user?.id) ||
                    (p.email && user?.email && String(p.email) === String(user.email));
                  const displayName = normalizeParticipantName(p.name, user?.name, isCurrentUser);
                  return (
                    <div
                      key={p.id}
                      className="rounded-xl border border-gray-200 bg-white px-5 py-4 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-semibold text-gray-900 flex items-center gap-2">
                          {displayName}
                          {isCurrentUser && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                              Bạn
                            </span>
                          )}
                        </div>
                        {p.email && (
                          <div className="text-sm text-gray-500 mt-1 truncate">
                            {p.email}
                          </div>
                        )}
                      </div>
                      {p.bankInfo?.accountNumber ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 whitespace-nowrap">
                          Đã liên kết ngân hàng
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Chưa liên kết</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Textarea hiển thị danh sách dạng text */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Member list</label>
                <textarea
                  readOnly
                  value={listParticipant}
                  className="w-full h-32 p-3 text-sm border border-gray-200 rounded-xl bg-gray-50 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300"
                  onClick={(e) => e.currentTarget.select()}
                />
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
