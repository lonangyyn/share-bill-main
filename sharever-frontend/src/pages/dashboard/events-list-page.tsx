import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Calendar,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  SlidersHorizontal,
  X,
  Users,
} from "lucide-react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../../features/auth/model/use-auth";
import { useEventStore } from "../../stores/use-event-store";
import { eventApi } from "../../entities/event/api";
import { settlementApi } from "../../entities/settlement/api";
import { participantApi } from "../../entities/participant/api";
import { CreateEventModal } from "../../features/event/ui/create-event-modal";

type SortOption = "date-desc" | "date-asc" | "name-asc" | "name-desc";
type TimeFilter = "all" | "today" | "week" | "month" | "year";

export default function EventsListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuth((s) => s.user);
  const {
    selectedEventId: activeEventId,
    setSelectedEventId: setActiveEventId,
  } = useEventStore();

  const createOpen = searchParams.get("create") === "1";

  // Filter & Sort states
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5; // 5 Events + 1 Nút New = 6 thẻ (đẹp cho grid 3 cột)

  const openCreateModal = () => {
    const next = new URLSearchParams(searchParams);
    next.set("create", "1");
    setSearchParams(next, { replace: true });
  };

  const closeCreateModal = () => {
    const next = new URLSearchParams(searchParams);
    if (next.has("create")) {
      next.delete("create");
      setSearchParams(next, { replace: true });
    }
  };

  const {
    data: events = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["events"],
    queryFn: eventApi.list,
  });

  useEffect(() => {
    if (!activeEventId && events.length) {
      setActiveEventId(String((events as any[])[0].id));
    }
  }, [activeEventId, events, setActiveEventId]);

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
          : ((participantsData as any)?.participants ?? []);
        const myParticipant = participants.find(
          (p: any) => p.userId === user?.id,
        );
        const balance =
          (summary?.participants ?? []).find(
            (p: any) => p.id === myParticipant?.id,
          )?.balance ?? 0;
        return {
          eventId: String(event.id),
          balance,
          currency: summary?.event?.currency ?? event.currency ?? "VND",
          participants,
        };
      },
      enabled: !!user?.id,
    })),
  });

  const { youOwe, youAreOwed, currencyLabel, totalsReady } = useMemo(() => {
    let owe = 0;
    let owed = 0;
    const currencies = new Set<string>();
    let hasData = eventList.length === 0;

    balanceQueries.forEach((q) => {
      const balance = q.data?.balance;
      const currency = q.data?.currency;
      if (typeof balance === "number") {
        hasData = true;
        if (balance < 0) owe += Math.abs(balance);
        if (balance > 0) owed += balance;
      }
      if (currency) currencies.add(currency);
    });

    const currencyLabel =
      currencies.size === 1
        ? Array.from(currencies)[0]
        : currencies.size === 0
          ? "VND"
          : "Multi";

    return {
      youOwe: owe,
      youAreOwed: owed,
      currencyLabel,
      totalsReady: hasData,
    };
  }, [balanceQueries, eventList.length]);

  // Filter and sort events
  const filteredAndSortedEvents = useMemo(() => {
    let filtered = [...eventList];

    // Apply time filter
    if (timeFilter !== "all") {
      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );

      filtered = filtered.filter((event) => {
        const rawDate = event?.createdAt ?? event?.created_at ?? event?.date;
        if (!rawDate) return false;

        const eventDate = new Date(rawDate);

        switch (timeFilter) {
          case "today":
            return eventDate >= startOfDay;
          case "week":
            const weekAgo = new Date(startOfDay);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return eventDate >= weekAgo;
          case "month":
            const monthAgo = new Date(startOfDay);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return eventDate >= monthAgo;
          case "year":
            const yearAgo = new Date(startOfDay);
            yearAgo.setFullYear(yearAgo.getFullYear() - 1);
            return eventDate >= yearAgo;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc": {
          const dateA = new Date(a?.createdAt ?? a?.created_at ?? a?.date ?? 0);
          const dateB = new Date(b?.createdAt ?? b?.created_at ?? b?.date ?? 0);
          return dateB.getTime() - dateA.getTime();
        }
        case "date-asc": {
          const dateA = new Date(a?.createdAt ?? a?.created_at ?? a?.date ?? 0);
          const dateB = new Date(b?.createdAt ?? b?.created_at ?? b?.date ?? 0);
          return dateA.getTime() - dateB.getTime();
        }
        case "name-asc": {
          const nameA = (a?.name ?? a?.title ?? "").toLowerCase();
          const nameB = (b?.name ?? b?.title ?? "").toLowerCase();
          return nameA.localeCompare(nameB);
        }
        case "name-desc": {
          const nameA = (a?.name ?? a?.title ?? "").toLowerCase();
          const nameB = (b?.name ?? b?.title ?? "").toLowerCase();
          return nameB.localeCompare(nameA);
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [eventList, timeFilter, sortBy]);

  // Tự động quay về trang 1 khi thay đổi bộ lọc hoặc thêm sự kiện mới
  useEffect(() => {
    setCurrentPage(1);
  }, [timeFilter, sortBy, eventList.length]);

  const totalPages = Math.ceil(filteredAndSortedEvents.length / ITEMS_PER_PAGE);
  const paginatedEvents = filteredAndSortedEvents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const fmtMoney = (v: number) =>
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v);

  return (
    <div className="space-y-8 animate-enter">
      {/* Header & Stats */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Welcome back, {user?.name ?? "buddy"}! 👋
          </h1>
          <p className="text-gray-500 mt-2">
            Here is what's happening with your expenses.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <div className="bg-[#FAEBE6] p-6 rounded-[32px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingDown size={80} />
          </div>
          <p className="text-gray-600 font-medium text-sm">
            You owe (all events)
          </p>
          <h3 className="text-3xl font-bold text-gray-900 mt-2">
            - {totalsReady ? fmtMoney(youOwe) : "--"}{" "}
            <span className="text-sm font-normal text-gray-500">
              {currencyLabel}
            </span>
          </h3>
        </div>

        <div className="bg-[#E6F6FA] p-6 rounded-[32px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp size={80} />
          </div>
          <p className="text-gray-600 font-medium text-sm">
            You are owed (all events)
          </p>
          <h3 className="text-3xl font-bold text-emerald-600 mt-2">
            + {totalsReady ? fmtMoney(youAreOwed) : "--"}{" "}
            <span className="text-sm font-normal text-gray-500">
              {currencyLabel}
            </span>
          </h3>
        </div>
      </div>

      {/* Events Grid */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Your Events{" "}
            {filteredAndSortedEvents.length > 0 &&
              `(${filteredAndSortedEvents.length})`}
          </h2>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 font-medium text-sm"
          >
            <SlidersHorizontal size={16} />
            Filters {(timeFilter !== "all" || sortBy !== "date-desc") && "•"}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-200 animate-enter">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Filter & Sort</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Time Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Time Period
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "all", label: "All time" },
                    { value: "today", label: "Today" },
                    { value: "week", label: "This week" },
                    { value: "month", label: "This month" },
                    { value: "year", label: "This year" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTimeFilter(option.value as TimeFilter)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        timeFilter === option.value
                          ? "bg-purple-600 text-white shadow-md"
                          : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Options */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Sort By
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "date-desc", label: "Newest first" },
                    { value: "date-asc", label: "Oldest first" },
                    { value: "name-asc", label: "A → Z" },
                    { value: "name-desc", label: "Z → A" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value as SortOption)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        sortBy === option.value
                          ? "bg-purple-600 text-white shadow-md"
                          : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Clear Filters */}
            {(timeFilter !== "all" || sortBy !== "date-desc") && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setTimeFilter("all");
                    setSortBy("date-desc");
                  }}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {isLoading && <div className="text-gray-500">Loading events...</div>}

        {isError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">
            Failed to load events: {(error as any)?.message ?? "Unknown error"}{" "}
            <button className="underline" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {filteredAndSortedEvents.length === 0 && eventList.length > 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-200 mb-6">
                <p className="text-gray-500">
                  No events found for the selected filters.
                </p>
                <button
                  onClick={() => {
                    setTimeFilter("all");
                    setSortBy("date-desc");
                  }}
                  className="mt-3 text-purple-600 hover:text-purple-700 font-medium text-sm"
                >
                  Clear filters
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Add New Placeholder - LUÔN Ở ĐẦU TIÊN */}
              <div
                className="border-2 border-dashed border-gray-200 rounded-[32px] flex flex-col items-center justify-center min-h-[200px] text-gray-400 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600 transition-all cursor-pointer"
                onClick={openCreateModal}
              >
                <Plus size={32} />
                <span className="font-semibold mt-2">New Event</span>
              </div>

              {paginatedEvents.map((event: any, i: number) => {
                const eventName = event?.name ?? event?.title ?? "Untitled";
                const rawDate =
                  event?.createdAt ?? event?.created_at ?? event?.date;
                const dateLabel = rawDate
                  ? new Date(rawDate).toLocaleDateString("vi-VN")
                  : "-";

                return (
                  <div
                    key={event.id}
                    onClick={() => {
                      const id = String(event.id);
                      setActiveEventId(id);
                      navigate("/app/activity");
                    }}
                    className="bg-white p-6 rounded-[32px] border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group animate-enter"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <span className="px-3 py-1 rounded-full bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500 border border-gray-100">
                        EVENT
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                      {eventName}
                    </h3>

                    <div className="flex items-center gap-2 text-gray-400 text-sm mt-2 mb-6">
                      <Calendar size={14} />
                      <span>{dateLabel}</span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                        {(() => {
                          const eventData = balanceQueries.find(
                            (q) => q.data?.eventId === String(event.id),
                          )?.data;
                          const count = eventData?.participants?.length || 0;
                          return (
                            <>
                              <Users size={16} />
                              <span>
                                {count} {count === 1 ? "Member" : "Members"}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors">
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-100">
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
        )}
      </div>

      <CreateEventModal open={createOpen} onClose={closeCreateModal} />
    </div>
  );
}
