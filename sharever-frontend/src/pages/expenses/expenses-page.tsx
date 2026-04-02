import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueries } from "@tanstack/react-query";
import { ArrowRight, Search } from "lucide-react";

import { useAuth } from "../../features/auth/model/use-auth";
import { useEventStore } from "../../stores/use-event-store";
import { eventApi } from "../../entities/event/api";
import { settlementApi } from "../../entities/settlement/api";
import { participantApi } from "../../entities/participant/api";
import { transactionApi } from "../../entities/transaction/api";
import { normalizeError } from "../../shared/lib/errors";

function formatMoney(v: number) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(v);
}

export default function ExpensesPage() {
  const navigate = useNavigate();
  const { selectedEventId, setSelectedEventId } = useEventStore();
  const user = useAuth((s) => s.user);

  const [search, setSearch] = useState("");

  const {
    data: events = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["events"],
    queryFn: eventApi.list,
  });

  const eventList = events as any[];

  const balanceQueries = useQueries({
    queries: eventList.map((event) => ({
      queryKey: ["event-balance", event.id, user?.id],
      queryFn: async () => {
        const [summary, participantsData] = await Promise.all([
          settlementApi.summary(String(event.id)),
          participantApi.list(String(event.id)),
        ]);
        const participants = Array.isArray(participantsData)
          ? participantsData
          : (participantsData as any)?.participants ?? [];
        const myParticipant = participants.find((p: any) => p.userId === user?.id);
        const balance =
          (summary?.participants ?? []).find((p: any) => p.id === myParticipant?.id)
            ?.balance ?? 0;
        return {
          eventId: String(event.id),
          balance,
          currency: summary?.event?.currency ?? event.currency ?? "VND",
        };
      },
      enabled: !!user?.id,
    })),
  });

  const activityQueries = useQueries({
    queries: eventList.map((event) => ({
      queryKey: ["event-activity", event.id],
      queryFn: async () => {
        const txns = await transactionApi.list(String(event.id));
        return txns?.[0]?.description?.trim() ?? "";
      },
      enabled: !!user?.id,
    })),
  });

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return eventList
      .map((event, index) => {
        const q = balanceQueries[index];
        const data = q?.data;
        const activityQuery = activityQueries[index];
        const currency = data?.currency ?? event.currency ?? "VND";
        const balance = data?.balance ?? 0;

        let status = "Loading...";
        let amountLabel = "";
        let amountClass = "text-gray-400";
        let expenseLabel = "Loading...";

        if (q?.isError) {
          status = "Unable to load balance";
        } else if (!q?.isLoading) {
          if (balance === 0) {
            status = "Settled up";
            amountLabel = "0";
          } else if (balance > 0) {
            status = "You are owed";
            amountLabel = `+${formatMoney(balance)} ${currency}`;
            amountClass = "text-emerald-600";
          } else {
            status = "You owe";
            amountLabel = `-${formatMoney(Math.abs(balance))} ${currency}`;
            amountClass = "text-rose-600";
          }
        }

        if (activityQuery?.isError) {
          expenseLabel = "Unable to load expense";
        } else if (!activityQuery?.isLoading) {
          expenseLabel = activityQuery?.data ? activityQuery.data : "No expense yet";
        }

        return {
          id: String(event.id),
          eventName: event?.name ?? "Untitled",
          status,
          amountLabel,
          amountClass,
          expenseLabel,
        };
      })
      .filter((row) => {
        if (!query) return true;
        return (
          row.eventName.toLowerCase().includes(query) ||
          row.expenseLabel.toLowerCase().includes(query)
        );
      });
  }, [eventList, balanceQueries, activityQueries, search]);

  return (
    <div className="animate-enter space-y-6 pb-20">
      <div className="bg-[#E6F6FA] w-full h-40 rounded-[32px] flex items-center justify-center shadow-sm relative overflow-hidden">
        <div className="absolute w-64 h-64 bg-white opacity-20 blur-3xl rounded-full -top-10 -left-10" />
        <div className="z-10 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight font-display">
            My Debts and Credits
          </h1>
          <p className="text-gray-600 mt-2">
            Pick an event to manage expenses in Activity.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Your events</h2>
          <div className="relative w-full md:w-72">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-gray-50 text-sm text-gray-800 outline-none border border-transparent focus:border-purple-300 focus:bg-white"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading && <div className="p-6 text-gray-500">Loading events...</div>}

        {isError && (
          <div className="p-6 text-rose-600">
            Failed to load events: {normalizeError(error)}
          </div>
        )}

        {!isLoading && !isError && rows.length === 0 && (
          <div className="p-6 text-gray-500">No events found.</div>
        )}

        {!isLoading && !isError && rows.length > 0 && (
          <div className="divide-y divide-gray-100">
            {rows.map((row) => {
              const isActive = String(row.id) === String(selectedEventId);
              return (
                <button
                  key={row.id}
                  onClick={() => {
                    setSelectedEventId(row.id);
                    navigate("/app/activity");
                  }}
                  className={`w-full text-left px-6 py-4 flex items-center justify-between transition-colors ${
                    isActive
                      ? "bg-purple-50/60 border-l-4 border-purple-400"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-gray-900 truncate">
                      {row.expenseLabel}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {row.eventName}
                      {row.status ? ` • ${row.status}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`text-sm font-bold ${row.amountClass}`}>
                      {row.amountLabel || "--"}
                    </div>
                    <ArrowRight size={16} className="text-gray-400" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
