import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 px-6 py-10">
        {/* Card giới thiệu bên trái */}
        <div className="rounded-[32px] bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white p-8 shadow-2xl shadow-purple-200 flex flex-col justify-between">
          <div className="space-y-4">
            <h1 className="text-3xl font-extrabold">Sharever</h1>
            <p className="text-sm text-purple-50/90">
              Split bills, track balances and settle up smoothly with your
              friends.
            </p>

            <div className="mt-6 rounded-3xl bg-white/10 backdrop-blur-md p-4 space-y-2">
              <div className="h-2.5 w-24 rounded-full bg-white/50" />
              <div className="h-2 w-40 rounded-full bg-white/40" />
              <div className="h-2 w-28 rounded-full bg-white/30" />
            </div>
          </div>

          <p className="mt-6 text-[11px] text-purple-100/90">
            Designed for trips, dinners, roommates and more.
          </p>
        </div>

        {/* Card trắng bên phải – chỗ render Login/Register */}
        <div className="rounded-[32px] bg-white shadow-xl shadow-slate-200 p-8 flex flex-col justify-center animate-enter">
          {children}
        </div>
      </div>
    </div>
  );
}
