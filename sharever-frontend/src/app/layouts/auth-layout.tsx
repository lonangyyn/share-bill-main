import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 px-6 py-10">
        {/* CỘT BÊN TRÁI: DASHBOARD THU NHỎ */}
        <div className="rounded-[32px] bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white p-8 shadow-2xl shadow-purple-200 flex flex-col justify-between min-h-[580px] relative overflow-hidden">
          {/* 1. Header & Intro */}
          <div className="relative z-10 space-y-4">
            <h1 className="text-3xl font-extrabold tracking-tight">Sharever</h1>
            <p className="text-sm text-purple-50/90 leading-relaxed max-w-[280px]">
              Split bills, track balances and settle up smoothly with your
              friends.
            </p>
          </div>

          {/* 2. MINI DASHBOARD (Phần thiết kế mới) */}
          <div className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[28px] p-6 shadow-2xl">
            {/* Balance Preview */}
            <div className="flex justify-between items-end mb-8">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-white/60">
                  Total Balance
                </p>
                <p className="text-3xl font-bold">+$1,240.50</p>
              </div>
              {/* Biểu đồ cột mini */}
              <div className="flex gap-1 items-end h-10">
                <div className="w-1.5 h-[40%] bg-white/20 rounded-full" />
                <div className="w-1.5 h-[70%] bg-white/40 rounded-full" />
                <div className="w-1.5 h-[50%] bg-white/20 rounded-full" />
                <div className="w-1.5 h-[90%] bg-white/60 rounded-full" />
              </div>
            </div>

            {/* Transaction List Skeleton */}
            <div className="space-y-4">
              {[
                {
                  label: "Trip to Da Lat",
                  amount: "-$120.00",
                  opacity: "bg-white/20",
                },
                {
                  label: "Dinner at BBQ",
                  amount: "+$45.50",
                  opacity: "bg-white/10",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl ${item.opacity} border border-white/10`}
                    />
                    <div className="space-y-1.5">
                      <div className="h-2 w-20 bg-white/30 rounded-full" />
                      <div className="h-1.5 w-12 bg-white/10 rounded-full" />
                    </div>
                  </div>
                  <div className="h-2 w-10 bg-white/20 rounded-full" />
                </div>
              ))}
            </div>

            {/* Trang trí thêm: Ánh sáng quét qua */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          </div>

          {/* 3. Footer bên trái */}
          <div className="relative z-10">
            <p className="text-[11px] text-purple-100/90 font-medium uppercase tracking-wider">
              Designed for trips, dinners, roommates and more.
            </p>
          </div>

          {/* Các hình khối mờ trang trí chạy nền */}
          <div className="absolute top-[-10%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[20%] left-[-10%] w-32 h-32 bg-purple-400/20 rounded-full blur-2xl" />
        </div>

        {/* Card trắng bên phải – Giữ nguyên 100% */}
        <div className="rounded-[32px] bg-white shadow-xl shadow-slate-200 p-8 flex flex-col justify-center">
          {children}
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-enter {
          animation: enter 0.5s ease-out;
        }
        @keyframes enter {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
