import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Plus } from "lucide-react";
import { useAuth } from "../../features/auth/model/use-auth";
import { DEFAULT_AVATAR_URL } from "../../shared/lib/default-avatar";
import { getAvatarUrl } from "../../shared/lib/random-avatar";
import { useQuery } from "@tanstack/react-query";
import { useEventStore } from "../../stores/use-event-store";
import { http } from "../../shared/api/http";
import { endpoints } from "../../shared/api/endpoints";
import { CreateEventModal } from "../../features/event/ui/create-event-modal";

function Avatar({
  name,
  seed,
  avatarUrl,
}: {
  name: string;
  seed?: string;
  avatarUrl?: string;
}) {
  return (
    <img
      className="h-9 w-9 rounded-full object-cover"
      src={avatarUrl || getAvatarUrl(seed)}
      onError={(e) => {
        e.currentTarget.src = DEFAULT_AVATAR_URL;
      }}
      alt={name}
    />
  );
}

export function Header() {
  return (
    <header className="flex items-center justify-end px-6 py-4 border-b bg-white">
      <HeaderRight />
    </header>
  );
}

export function HeaderRight() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const [openProfile, setOpenProfile] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);

  // State for Create Event Modal
  const [createOpen, setCreateOpen] = useState(false);

  const navigate = useNavigate();
  const profileRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const setSelectedEventId = useEventStore((s) => s.setSelectedEventId);

  const displayName = user?.name ?? "Account";

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setOpenProfile(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setOpenNotif(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!user) {
    return (
      <Link
        to="/login"
        className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold"
      >
        Login
      </Link>
    );
  }

  // Real data for notifications via React Query
  const { data: notificationsData, refetch: refetchNotifs } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await http.get(endpoints.notifications.list());
      return res.data?.data ?? res.data ?? [];
    },
    enabled: !!user,
    refetchInterval: 10000, // auto-refresh every 10s
  });

  const notifications = Array.isArray(notificationsData)
    ? notificationsData
    : [];
  const hasUnread = notifications.some((n: any) => !n.isRead);

  const markAllAsRead = async () => {
    try {
      await http.post(endpoints.notifications.markRead());
      await refetchNotifs();
    } catch (error) {
      console.error(error);
    }
  };

  const handleNotificationClick = (notif: any) => {
    setOpenNotif(false);
    if (notif.eventId) {
      setSelectedEventId(String(notif.eventId));
      navigate("/app/activity");
    }
  };

  return (
    <div className="flex items-center gap-2 sm:gap-1">
      {/* Notifications Bell */}
      <div className="relative" ref={notifRef}>
        <button
          type="button"
          onClick={() => {
            setOpenNotif((v) => !v);
            setOpenProfile(false);
          }}
          className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Bell size={20} />
          {hasUnread && (
            <span className="absolute top-1.5 right-2 h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-white" />
          )}
        </button>

        {openNotif && (
          <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/80 backdrop-blur-sm">
              <span className="font-bold text-gray-900">Notifications</span>
              <button
                onClick={markAllAsRead}
                className="text-xs font-medium text-purple-600 hover:text-purple-800 transition-colors"
              >
                Mark all as read
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!n.isRead ? "bg-blue-50/30" : ""}`}
                >
                  <p
                    className={`text-sm ${!n.isRead ? "text-gray-900 font-semibold" : "text-gray-600"}`}
                  >
                    {n.text}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.createdAt || Date.now()).toLocaleString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                      },
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block" />

      {/* User Profile Dropdown */}
      <div className="relative" ref={profileRef}>
        <button
          type="button"
          onClick={() => {
            setOpenProfile((v) => !v);
            setOpenNotif(false);
          }}
          className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-gray-50 transition-colors"
        >
          <Avatar
            name={displayName}
            seed={user?.email ?? user?.id}
            avatarUrl={user?.avatarUrl || user?.avatar}
          />
          <span className="text-sm font-semibold text-gray-900 hidden sm:block">
            {displayName}
          </span>
        </button>

        {openProfile && (
          <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden z-50 py-1">
            <div className="px-4 py-2 border-b border-gray-50 mb-1">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {displayName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <button
              type="button"
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => {
                setOpenProfile(false);
                navigate("/app/accounts");
              }}
            >
              Account settings
            </button>

            <button
              type="button"
              className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
              onClick={() => {
                setOpenProfile(false);
                logout();
                navigate("/login", { replace: true });
              }}
            >
              Log out
            </button>
          </div>
        )}
      </div>

      {/* Global Create Event Modal */}
      <CreateEventModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}
