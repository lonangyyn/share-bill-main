import { useState, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { Home, Activity, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEventStore } from "../../stores/use-event-store";
import { eventApi } from "../../entities/event/api";
import { CreateEventModal } from "../../features/event/ui/create-event-modal";
import { Plus } from "lucide-react";

const navItems = [
  { to: "/app", end: true, label: "Home", icon: Home },
  { to: "/app/activity", label: "Events", icon: Activity },
  { to: "/app/accounts", label: "Accounts", icon: Users },
];

export function Sidebar() {
  const navigate = useNavigate();
  const { selectedEventId, setSelectedEventId } = useEventStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: eventApi.list,
  });

  const eventList = Array.isArray(events) ? events : [];

  const totalPages = Math.ceil(eventList.length / ITEMS_PER_PAGE);
  const paginatedEvents = eventList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <aside className="w-[280px] h-full bg-white border-r border-gray-100 flex flex-col z-20">
      <div className="flex flex-col h-full p-6">
        {/* LOGO */}
        <Link
          to="/app"
          className="flex items-center gap-3 mb-10 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-sky-400 to-purple-500 flex items-center justify-center text-white font-bold">
            S
          </div>
          <span className="text-2xl font-bold italic tracking-tight font-display text-gray-900">
            Sharever
          </span>
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

        {/* QUICKHAND EVENTS LIST */}
        <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-2 flex-1 overflow-y-auto pb-4">
          <div className="flex justify-between items-center mb-2 px-1 gap-1.5">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Your Activities
            </span>
            <button
              className="bg-gray-900 text-xs text-white px-2 py-2 rounded-2xl font-semibold hover:scale-105 transition-transform flex items-center gap-1"
              onClick={() => setCreateOpen(true)}
            >
              <Plus size={15} />
              <span>NEW EVENT</span>
            </button>
            <CreateEventModal
              open={createOpen}
              onClose={() => setCreateOpen(false)}
            />
          </div>

          {eventList.length === 0 ? (
            <div className="text-sm text-gray-500 px-2">No activities yet.</div>
          ) : (
            paginatedEvents.map((event: any) => {
              const isActive = String(event.id) === String(selectedEventId);
              return (
                <button
                  key={event.id}
                  onClick={() => {
                    setSelectedEventId(String(event.id));
                    navigate("/app/activity");
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-colors text-left truncate ${
                    isActive
                      ? "bg-purple-900 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <div
                    className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-xs ${isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"}`}
                  >
                    {event.name?.charAt(0)?.toUpperCase() || "E"}
                  </div>
                  <span className="truncate">{event.name}</span>
                </button>
              );
            })
          )}

          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-auto px-2 pt-3 border-t border-gray-50 shrink-0">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="text-xs font-semibold text-gray-500 hover:text-gray-900 disabled:opacity-50 transition-colors"
              >
                Prev
              </button>
              <span className="text-[10px] font-medium text-gray-400">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="text-xs font-semibold text-gray-500 hover:text-gray-900 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
