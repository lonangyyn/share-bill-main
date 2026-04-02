import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Link2, Users } from "lucide-react";

import { useAuth } from "../../features/auth/model/use-auth";
import { useEventStore } from "../../stores/use-event-store";
import { eventApi } from "../../entities/event/api";
import { participantApi } from "../../entities/participant/api";
import { Button } from "../../shared/ui/button";
import { useToast } from "../../shared/ui/toast";
import { normalizeError } from "../../shared/lib/errors";

export default function InvitePage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthed = useAuth((s) => s.isAuthed);
  const user = useAuth((s) => s.user);
  const setSelectedEventId = useEventStore((s) => s.setSelectedEventId);
  const toast = useToast();
  const [joinLoading, setJoinLoading] = useState(false);

  const returnTo = useMemo(
    () => `${location.pathname}${location.search}`,
    [location.pathname, location.search]
  );

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["event-detail", eventId],
    queryFn: () => eventApi.detail(eventId as string),
    enabled: !!eventId && isAuthed,
  });

  const eventData = (detail as any)?.event ?? detail;
  const eventName = eventData?.name ?? "This activity";
  const eventDescription = eventData?.description ?? "";

  async function handleJoin() {
    if (!eventId) return;
    setJoinLoading(true);
    try {
      const joinName = user?.name?.trim() || "Member";
      await participantApi.joinByLink(eventId, { name: joinName });
      toast.push("Joined activity.");
      setSelectedEventId(String(eventId));
      navigate("/app/activity");
    } catch (err) {
      toast.push(normalizeError(err));
    } finally {
      setJoinLoading(false);
    }
  }

  const loginLink = `/login?redirect=${encodeURIComponent(returnTo)}`;
  const registerLink = `/register?redirect=${encodeURIComponent(returnTo)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-2xl">
        <div className="rounded-[36px] bg-white border border-gray-100 shadow-xl shadow-orange-100/40 p-8 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-orange-100/80 blur-3xl" />
          <div className="absolute -bottom-28 -left-28 h-64 w-64 rounded-full bg-purple-100/80 blur-3xl" />

          <div className="relative space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-500 text-white font-bold flex items-center justify-center shadow-md">
                S
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Invite link
                </div>
                <h1 className="text-3xl font-extrabold text-gray-900">
                  Join this activity
                </h1>
              </div>
            </div>

            {!eventId && (
              <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-rose-700">
                Invalid invite link. Please check the URL and try again.
              </div>
            )}

            {eventId && (
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                  <Users size={14} />
                  You are invited to
                </div>
                <div className="text-xl font-extrabold text-gray-900">
                  {detailLoading ? "Loading activity..." : eventName}
                </div>
                {eventDescription && (
                  <div className="text-sm text-gray-500">{eventDescription}</div>
                )}
                <div className="text-xs text-gray-400 flex items-center gap-2">
                  <Link2 size={12} />
                  Event ID: {String(eventId)}
                </div>
              </div>
            )}

            {eventId && !isAuthed && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Sign in to join the activity and start splitting expenses.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to={loginLink}
                    className="inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800"
                  >
                    Log in
                  </Link>
                  <Link
                    to={registerLink}
                    className="inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
                  >
                    Create account
                  </Link>
                </div>
                <div className="text-xs text-gray-500">
                  After signing in, return to this link to accept the invite.
                </div>
              </div>
            )}

            {eventId && isAuthed && (
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  className="gap-2"
                  onClick={handleJoin}
                  disabled={joinLoading}
                >
                  {joinLoading ? "Joining..." : "Join activity"}
                  {!joinLoading && <ArrowRight size={16} />}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/app/activity")}
                >
                  Open activity
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-gray-500">
          Need help? Ask the organizer to send you the invite link again.
        </div>
      </div>
    </div>
  );
}
