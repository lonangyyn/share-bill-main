import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Copy, Receipt, Settings, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { http } from "../../shared/api/http";
import { endpoints } from "../../shared/api/endpoints";
import { useEventStore } from "../../stores/use-event-store";
import { eventApi } from "../../entities/event/api";

type Event = {
  id: string | number;
  name: string;
  description?: string;
  createdAt?: string;
  currency?: string;
  status?: string;
};

type Participant = {
  id: string | number;
  name: string;
  avatar?: string;
  isGuest?: boolean;
};

type Txn = {
  id: string | number;
  description?: string;
  amount?: number;
  date?: string;
  createdAt?: string;
};

function normalizeError(err: any): string {
  return err?.response?.data?.message || err?.message || "Something went wrong";
}

function formatDate(input?: string) {
  if (!input) return "-";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("vi-VN");
}

function formatMoney(v: number) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(v);
}

async function fetchEventDetail(eventId: string): Promise<Event | null> {
  const items = await eventApi.list();
  const match = items.find((item) => String(item.id) === String(eventId));

  // backend có thể trả { event, stats } hoặc trả event luôn
  return (match as Event) ?? null;
}

async function fetchParticipants(eventId: string): Promise<Participant[]> {
  const res = await http.get(endpoints.participants.list(eventId));
  const data = res.data?.data ?? res.data;
  if (Array.isArray(data)) return data;
  return data?.participants ?? [];
}

async function fetchTransactions(eventId: string): Promise<Txn[]> {
  const res = await http.get(endpoints.transactions.list(eventId));
  const data = res.data?.data ?? res.data;
  if (Array.isArray(data)) return data;
  return data?.transactions ?? [];
}

type Props = {
  eventId?: string;
  onBack?: () => void;
};

const TabButton = ({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
      active
        ? "bg-gray-900 text-white shadow"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`}
  >
    {icon}
    {label}
  </button>
);

export default function EventDetailPage({ eventId, onBack }: Props) {
  const navigate = useNavigate();
  const params = useParams();
  const selectedEventId = useEventStore((s) => s.selectedEventId);
  const id = eventId ?? params.eventId ?? selectedEventId;

  const [tab, setTab] = useState<"overview" | "members" | "txns">("overview");
  const [copied, setCopied] = useState(false);

  const {
    data: event,
    isLoading: eLoading,
    isError: eError,
    error: eErr,
  } = useQuery({
    queryKey: ["event", id],
    queryFn: () => fetchEventDetail(id as string),
    enabled: !!id,
  });

  const {
    data: participants = [],
    isLoading: pLoading,
    isError: pError,
    error: pErr,
  } = useQuery({
    queryKey: ["participants", id],
    queryFn: () => fetchParticipants(id as string),
    enabled: !!id,
  });

  const {
    data: txns = [],
    isLoading: tLoading,
    isError: tError,
    error: tErr,
  } = useQuery({
    queryKey: ["transactions", id],
    queryFn: () => fetchTransactions(id as string),
    enabled: !!id,
  });

  const currency = event?.currency ?? "VND";

  const totalSpent = useMemo(() => {
    return txns.reduce((sum, t) => sum + Number(t.amount ?? 0), 0);
  }, [txns]);

  if (!id) {
    return (
      <div className="animate-enter space-y-4">
        <div className="text-gray-500">Chưa chọn event.</div>
      </div>
    );
  }

  const eventMissing = !!id && !eLoading && !eError && !event;
  const loading = eLoading || pLoading || tLoading;
  const hasError = eError || pError || tError || eventMissing;

  return (
    <div className="animate-enter space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
          onClick={() => {
            if (onBack) onBack();
            else navigate(-1);
          }}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <button
          className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(String(id));
              setCopied(true);
              setTimeout(() => setCopied(false), 900);
            } catch {
              // ignore
            }
          }}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          Copy Event ID
        </button>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-[32px] border border-gray-100 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-500">
              EVENT • {String(id)} • {formatDate(event?.createdAt)}
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mt-2 truncate">
              {event?.name ?? "Event"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {event?.description ?? "No description"}
            </p>
          </div>

          <div className="text-right">
            <div className="text-xs font-semibold text-gray-500">Total spent</div>
            <div className="text-2xl font-extrabold text-gray-900 mt-2">
              {formatMoney(totalSpent)}{" "}
              <span className="text-sm font-semibold text-gray-400">
                {currency}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mt-6">
          <TabButton
            active={tab === "overview"}
            onClick={() => setTab("overview")}
            icon={<Settings size={16} />}
            label="Overview"
          />
          <TabButton
            active={tab === "members"}
            onClick={() => setTab("members")}
            icon={<Users size={16} />}
            label="Members"
          />
          <TabButton
            active={tab === "txns"}
            onClick={() => setTab("txns")}
            icon={<Receipt size={16} />}
            label="Transactions"
          />
        </div>
      </div>

      {/* Body */}
      {loading && <div className="text-gray-500">Loading...</div>}

      {hasError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          {eventMissing
            ? "Event not found or you do not have access."
            : normalizeError(eErr) ||
              normalizeError(pErr) ||
              normalizeError(tErr)}
        </div>
      )}

      {!loading && !hasError && tab === "overview" && (
        <div className="bg-white rounded-[32px] border border-gray-100 p-6">
          <h2 className="text-lg font-extrabold text-gray-900">Overview</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-[24px] bg-gray-50 border border-gray-100 p-4">
              <div className="text-xs font-semibold text-gray-500">Participants</div>
              <div className="text-2xl font-extrabold text-gray-900 mt-2">
                {participants.length}
              </div>
            </div>
            <div className="rounded-[24px] bg-gray-50 border border-gray-100 p-4">
              <div className="text-xs font-semibold text-gray-500">Transactions</div>
              <div className="text-2xl font-extrabold text-gray-900 mt-2">
                {txns.length}
              </div>
            </div>
            <div className="rounded-[24px] bg-gray-50 border border-gray-100 p-4">
              <div className="text-xs font-semibold text-gray-500">Status</div>
              <div className="text-2xl font-extrabold text-gray-900 mt-2">
                {event?.status ?? "ACTIVE"}
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && !hasError && tab === "members" && (
        <div className="bg-white rounded-[32px] border border-gray-100 p-6">
          <h2 className="text-lg font-extrabold text-gray-900 mb-4">Members</h2>
          {participants.length === 0 ? (
            <div className="text-gray-500">No members.</div>
          ) : (
            <div className="space-y-2">
              {participants.map((p) => (
                <div
                  key={String(p.id)}
                  className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3 hover:bg-gray-50/60"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                      {(p.name || "?").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-gray-900 truncate">
                        {p.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {p.isGuest ? "Guest" : "Member"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && !hasError && tab === "txns" && (
        <div className="bg-white rounded-[32px] border border-gray-100 p-6">
          <h2 className="text-lg font-extrabold text-gray-900 mb-4">
            Transactions
          </h2>
          {txns.length === 0 ? (
            <div className="text-gray-500">No transactions.</div>
          ) : (
            <div className="space-y-2">
              {txns.map((t) => (
                <div
                  key={String(t.id)}
                  className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3 hover:bg-gray-50/60"
                >
                  <div className="min-w-0">
                    <div className="font-extrabold text-gray-900 truncate">
                      {t.description ?? "Untitled"}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatDate(t.date ?? t.createdAt)}
                    </div>
                  </div>
                  <div className="font-extrabold text-gray-900">
                    {formatMoney(Number(t.amount ?? 0))}{" "}
                    <span className="text-xs font-semibold text-gray-400">
                      {currency}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
