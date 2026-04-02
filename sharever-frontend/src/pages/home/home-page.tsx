import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../features/auth/model/use-auth";
import { useEventStore } from "../../stores/use-event-store";

import { eventApi } from "../../entities/event/api";
import { settlementApi } from "../../entities/settlement/api";
import { participantApi } from "../../entities/participant/api";

export default function HomePage() {
  const navigate = useNavigate();

  const user = useAuth((s) => s.user);
  const isAuthed = useAuth((s) => s.isAuthed);

  const { selectedEventId, setSelectedEventId } = useEventStore();

  // ====== Codex hooks: events -> auto select -> summary + participants ======
  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: eventApi.list,
    enabled: !!isAuthed, // chỉ fetch khi đã login (tránh 401 ở landing)
  });

  useEffect(() => {
    if (!selectedEventId && events.length) {
      setSelectedEventId(String((events as any[])[0].id));
    }
  }, [events, selectedEventId, setSelectedEventId]);

  const { data: summary } = useQuery({
    queryKey: ["summary", selectedEventId],
    queryFn: () => settlementApi.summary(selectedEventId as string),
    enabled: !!isAuthed && !!selectedEventId,
  });

  const { data: participants = [] } = useQuery({
    queryKey: ["participants", selectedEventId],
    queryFn: () => participantApi.list(selectedEventId as string),
    enabled: !!isAuthed && !!selectedEventId,
  });

  const selectedEvent = useMemo(() => {
    return (events as any[]).find((e) => String(e.id) === String(selectedEventId));
  }, [events, selectedEventId]);

  const myParticipant = useMemo(() => {
    if (!user) return null;
    return (participants as any[]).find((p) => p.userId === user.id) ?? null;
  }, [participants, user]);

  const myBalance = useMemo(() => {
    const list = summary?.participants ?? [];
    const row = list.find((p: any) => p.id === myParticipant?.id);
    return row?.balance ?? 0;
  }, [summary, myParticipant]);

  const currency = summary?.event?.currency ?? selectedEvent?.currency ?? "VND";

  const youOwe = myBalance < 0 ? Math.abs(myBalance) : 0;
  const youAreOwed = myBalance > 0 ? myBalance : 0;

  const fmtMoney = (v: number) =>
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v);

  const fmtDate = (d: any) => {
    if (!d) return "";
    const dt = typeof d === "string" || typeof d === "number" ? new Date(d) : d;
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toLocaleDateString("vi-VN");
  };

  // Dùng để render “Member balances” (lấy từ summary.participants)
  const topBalances = useMemo(() => {
    const list = (summary?.participants ?? []) as any[];
    // ưu tiên show 2 người khác ngoài "me"
    const others = list
      .filter((p) => p.id !== myParticipant?.id)
      .sort((a, b) => Math.abs(b.balance ?? 0) - Math.abs(a.balance ?? 0))
      .slice(0, 2);

    // row "You"
    const meRow = myParticipant
      ? list.find((p) => p.id === myParticipant.id)
      : null;

    return { meRow, others };
  }, [summary, myParticipant]);

  // ====== UI ======
  // Nếu chưa login: giữ nguyên landing page marketing
  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex flex-col">
        {/* Top bar */}
        <header className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-sky-400 to-purple-500 flex items-center justify-center text-white font-bold">
              S
            </div>
            <span className="font-semibold text-lg text-gray-900">Sharever</span>
          </div>

          <div className="flex items-center gap-3">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900">
              How it works
            </a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">
              Pricing
            </a>
            <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900">
              Log in
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold text-white bg-purple-600 px-4 py-2 rounded-full shadow-glow hover:bg-purple-700 hover-bounce"
            >
              Get started
            </Link>
          </div>
        </header>

        {/* Hero section */}
        <main className="flex-1 flex flex-col lg:flex-row items-center gap-10 px-8 lg:px-16 py-10">
          <section className="max-w-xl space-y-6 animate-enter delay-100">
            <p className="inline-flex items-center text-xs font-semibold text-purple-700 bg-purple-50 rounded-full px-3 py-1 border border-purple-100">
              ✨ Split bills without headaches
            </p>

            <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
              Split trips, dinners and bills{" "}
              <span className="text-purple-600">in seconds.</span>
            </h1>

            <p className="text-sm text-gray-600">
              Sharever keeps track of who paid what, who owes whom, and helps you
              settle up smoothly with friends. Designed for trips, roommates and
              group hangouts.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/register"
                className="hover-bounce inline-flex items-center justify-center px-5 py-3 rounded-full text-sm font-semibold text-white bg-purple-600 shadow-glow hover:bg-purple-700"
              >
                Start for free
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-5 py-3 rounded-full text-sm font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100"
              >
                I already have an account
              </Link>
            </div>

            <p className="text-xs text-gray-500">
              No credit card required. Perfect for Da Lat trips, birthday dinners
              or monthly house bills.
            </p>
          </section>

          {/* Fake screenshot card (marketing) */}
          <section className="flex-1 flex justify-center animate-enter delay-200">
            <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl shadow-purple-100 p-5 border border-purple-50">
              <div className="h-3 w-16 rounded-full bg-purple-100 mb-4" />
              <div className="rounded-3xl bg-gradient-to-r from-amber-200 via-pink-100 to-purple-100 p-5 flex justify-between items-center">
                <div>
                  <div className="text-xs text-gray-700 font-semibold">
                    EVENT ID: 9999 · 13/11/2025
                  </div>
                  <div className="text-2xl font-extrabold text-gray-900 mt-1">
                    Da Lat trip
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Mountain biking &amp; coffee tour
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 hover-bounce">
                    New expense
                  </button>
                  <button className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-teal-400 hover:bg-teal-500 hover-bounce">
                    Settle up
                  </button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-2xl bg-gray-50 p-3">
                  <div className="font-semibold text-gray-800 mb-1">Your events</div>
                  <ul className="space-y-1 text-gray-600">
                    <li>Da Lat trip</li>
                    <li>Anna&apos;s birthday</li>
                    <li>Fine dining</li>
                  </ul>
                </div>

                <div className="rounded-2xl bg-gray-50 p-3 col-span-2">
                  <div className="font-semibold text-gray-800 mb-1">Member balances</div>
                  <ul className="space-y-1">
                    <li className="flex justify-between">
                      <span>You</span>
                      <span className="text-xs text-gray-500">settled up</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Sky</span>
                      <span className="text-xs font-semibold text-emerald-600">
                        +25.000 VND
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Firefly</span>
                      <span className="text-xs font-semibold text-rose-600">
                        -25.000 VND
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // ====== Logged-in version: thay fake screenshot bằng data thật ======
  const eventIdLabel = selectedEvent?.id ? String(selectedEvent.id) : "—";
  const eventDateLabel =
    fmtDate(selectedEvent?.createdAt) || fmtDate(summary?.meta?.generatedAt) || "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex flex-col">
      {/* Top bar (logged in) */}
      <header className="px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-sky-400 to-purple-500 flex items-center justify-center text-white font-bold">
            S
          </div>
          <span className="font-semibold text-lg text-gray-900">Sharever</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-700">
            Hi, <span className="font-semibold">{user?.name ?? "buddy"}</span>
          </div>
          <button
            onClick={() => navigate("/app")}
            className="text-sm font-semibold text-white bg-purple-600 px-4 py-2 rounded-full shadow-glow hover:bg-purple-700 hover-bounce"
          >
            Go to App
          </button>
        </div>
      </header>

      {/* Hero section (logged in) */}
      <main className="flex-1 flex flex-col lg:flex-row items-center gap-10 px-8 lg:px-16 py-10">
        <section className="max-w-xl space-y-6 animate-enter delay-100">
          <p className="inline-flex items-center text-xs font-semibold text-purple-700 bg-purple-50 rounded-full px-3 py-1 border border-purple-100">
            🎉 Welcome to Sharever
          </p>

          <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
            Welcome back{" "}
            <span className="text-purple-600">{user?.name ?? "buddy"}</span>
          </h1>

          <p className="text-sm text-gray-600">
            Your current event context is synced across Sidebar → Home → Activity → Expenses.
            Pick an event in Sidebar and everything updates automatically.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate("/app/expenses")}
              className="hover-bounce inline-flex items-center justify-center px-5 py-3 rounded-full text-sm font-semibold text-white bg-purple-600 shadow-glow hover:bg-purple-700"
            >
              Open Expenses
            </button>
            <button
              onClick={() => navigate("/app/activity")}
              className="inline-flex items-center justify-center px-5 py-3 rounded-full text-sm font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100"
            >
              View Activity
            </button>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <div>
              You owe: <span className="font-semibold text-rose-600">-{fmtMoney(youOwe)} {currency}</span>
            </div>
            <div>
              You are owed: <span className="font-semibold text-emerald-600">+{fmtMoney(youAreOwed)} {currency}</span>
            </div>
          </div>
        </section>

        {/* Real screenshot card */}
        <section className="flex-1 flex justify-center animate-enter delay-200">
          <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl shadow-purple-100 p-5 border border-purple-50">
            <div className="h-3 w-16 rounded-full bg-purple-100 mb-4" />

            <div className="rounded-3xl bg-gradient-to-r from-amber-200 via-pink-100 to-purple-100 p-5 flex justify-between items-center">
              <div>
                <div className="text-xs text-gray-700 font-semibold">
                  EVENT ID: {eventIdLabel} {eventDateLabel ? `· ${eventDateLabel}` : ""}
                </div>
                <div className="text-2xl font-extrabold text-gray-900 mt-1">
                  {selectedEvent?.name ?? "Pick an event in Sidebar"}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {selectedEvent?.description ?? "—"}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => navigate("/app/activity")}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 hover-bounce"
                >
                  New expense
                </button>
                <button
                  onClick={() => navigate("/app/activity")}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-teal-400 hover:bg-teal-500 hover-bounce"
                >
                  Settle up
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
              {/* Your events (real) */}
              <div className="rounded-2xl bg-gray-50 p-3">
                <div className="font-semibold text-gray-800 mb-1">Your events</div>
                <ul className="space-y-1 text-gray-600">
                  {(events as any[]).slice(0, 3).map((e) => (
                    <li key={e.id}>
                      <button
                        className={`text-left hover:underline ${
                          String(e.id) === String(selectedEventId) ? "font-semibold text-gray-900" : ""
                        }`}
                        onClick={() => {
                          setSelectedEventId(String(e.id));
                          navigate("/app/activity");
                        }}
                      >
                        {e.name}
                      </button>
                    </li>
                  ))}
                  {(events as any[]).length === 0 && <li>No events yet</li>}
                </ul>
              </div>

              {/* Member balances (real, from summary) */}
              <div className="rounded-2xl bg-gray-50 p-3 col-span-2">
                <div className="font-semibold text-gray-800 mb-1">Member balances</div>
                <ul className="space-y-1">
                  <li className="flex justify-between">
                    <span>You</span>
                    {myParticipant ? (
                      myBalance === 0 ? (
                        <span className="text-xs text-gray-500">settled up</span>
                      ) : myBalance > 0 ? (
                        <span className="text-xs font-semibold text-emerald-600">
                          +{fmtMoney(myBalance)} {currency}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-rose-600">
                          -{fmtMoney(Math.abs(myBalance))} {currency}
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-gray-500">not in event</span>
                    )}
                  </li>

                  {topBalances.others.map((p: any) => (
                    <li key={p.id} className="flex justify-between">
                      <span>{p.name}</span>
                      {p.balance >= 0 ? (
                        <span className="text-xs font-semibold text-emerald-600">
                          +{fmtMoney(p.balance)} {currency}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-rose-600">
                          -{fmtMoney(Math.abs(p.balance))} {currency}
                        </span>
                      )}
                    </li>
                  ))}

                  {!selectedEventId && (
                    <li className="text-xs text-gray-500">Pick an event in Sidebar</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
