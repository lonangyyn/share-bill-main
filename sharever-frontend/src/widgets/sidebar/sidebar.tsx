import { useEffect, useMemo, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Home, Activity, CreditCard, Users, Plus } from "lucide-react";

import { eventApi } from "../../entities/event/api";
import { useEventStore } from "../../stores/use-event-store";

// 1) Menu với Icon Lucide
const navItems = [
  { to: "/app", end: true, label: "Home", icon: Home },
  { to: "/app/activity", label: "Events", icon: Activity },
  // { to: "/app/expenses", label: "Expenses", icon: CreditCard },
  { to: "/app/accounts", label: "Accounts", icon: Users },
];

type SortMode = "date_desc" | "date_asc" | "name_asc" | "name_desc";

function parseEventDate(ev: any) {
  // ưu tiên createdAt; fallback updatedAt
  const raw = ev?.createdAt ?? ev?.updatedAt;
  const t = raw ? Date.parse(raw) : 0;
  return Number.isFinite(t) ? t : 0;
}

function formatDate(raw?: string) {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  // DD/MM/YYYY theo kiểu VN
  return d.toLocaleDateString("vi-VN");
}

export function Sidebar() {
  const navigate = useNavigate();
  const { selectedEventId, setSelectedEventId } = useEventStore();
  const [sortMode, setSortMode] = useState<SortMode>("date_desc");

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: eventApi.list,
  });

  // sort events (FE-only)
  const sortedEvents = useMemo(() => {
    const arr = Array.isArray(events) ? [...events] : [];
    arr.sort((a: any, b: any) => {
      if (sortMode === "name_asc") {
        return String(a?.name ?? "").localeCompare(String(b?.name ?? ""), "vi", {
          sensitivity: "base",
        });
      }
      if (sortMode === "name_desc") {
        return String(b?.name ?? "").localeCompare(String(a?.name ?? ""), "vi", {
          sensitivity: "base",
        });
      }

      const ta = parseEventDate(a);
      const tb = parseEventDate(b);
      return sortMode === "date_asc" ? ta - tb : tb - ta;
    });
    return arr;
  }, [events, sortMode]);

  // auto-select event đầu tiên nếu chưa có
  useEffect(() => {
    if (!sortedEvents.length) {
      if (selectedEventId) setSelectedEventId(null);
      return;
    }

    const match = sortedEvents.find(
      (event: any) => String(event.id) === String(selectedEventId)
    );
    if (!match) {
      setSelectedEventId(String(sortedEvents[0].id));
    }
  }, [sortedEvents, selectedEventId, setSelectedEventId]);

  function handleSelect(eventId: string) {
    setSelectedEventId(String(eventId));
    // chọn event xong -> nhảy sang activity
    navigate("/app/activity");
  }

  return (
    <aside className="w-[280px] h-full bg-white border-r border-gray-100 flex flex-col z-20">
      <div className="flex flex-col h-full p-6">
        {/* LOGO */}
        <Link
          to="/app"
          className="flex items-center gap-3 mb-10 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-200">
            S
          </div>
          <div className="text-2xl font-bold italic tracking-tight font-display text-gray-900">
            Sharever
          </div>
        </Link>

        {/* NAV */}
        <nav className="space-y-2 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-gray-100 text-gray-900 font-bold"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={24}
                    strokeWidth={isActive ? 2.5 : 2}
                    className="transition-all"
                  />
                  <span className="text-sm font-medium">{item.label}</span>

                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-3/5 w-1 bg-gray-900 rounded-r-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/*EVENTS*/} 
        <div className="mt-8">
          {/*
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-bold text-gray-900">Your events</div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setSortMode((m) => (m.startsWith("date") ? "name_asc" : "date_desc"));
                }}
                title={sortMode.startsWith("date") ? "Sorting: Date" : "Sorting: A-Z"}
              >
                {sortMode.startsWith("date") ? "Date" : "A-Z"}
              </button>

              <button
                className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg shadow-purple-200 hover:scale-105 transition-transform"
                onClick={() => navigate("/app?create=1")}
              >
                <Plus size={14} /> New
              </button>
            </div>
          </div>
          */}

          {isLoading && (
            <div className="text-xs text-gray-400">Loading events...</div>
          )}

          {!isLoading && sortedEvents.length === 0 && (
            <div className="text-xs text-gray-400">No events yet.</div>
          )}

          {/* Scrollable list */}
          {/*
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {sortedEvents.map((event: any) => {
              const isActiveEvent = String(event.id) === String(selectedEventId);
              const iconChar = (event.name || "?").slice(0, 1).toUpperCase();

              return (
                <button
                  key={event.id}
                  onClick={() => handleSelect(event.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${
                    isActiveEvent
                      ? "bg-purple-50 text-purple-700 font-semibold border border-purple-100"
                      : "bg-transparent text-gray-600 border border-transparent hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${
                      isActiveEvent ? "bg-purple-200" : "bg-gray-200"
                    }`}
                  >
                    {iconChar}
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm truncate">{event.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {formatDate(event.createdAt)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          */}

          {/* Optional: click to switch sort direction (if you want) */}
          {/* 
          <div className="mt-2 text-[11px] text-gray-400">
            Tip: Click “Date” or “A-Z” to toggle sort mode.
          </div> 
          */}
        </div>
      </div>
    </aside>
  );
}
