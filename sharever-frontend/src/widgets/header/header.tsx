import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/model/use-auth";
import { DEFAULT_AVATAR_URL } from "../../shared/lib/default-avatar";
import { getAvatarUrl } from "../../shared/lib/random-avatar";


function Avatar({ name, seed }: { name: string; seed?: string }) {
  return (
    <img
      className="h-9 w-9 rounded-full object-cover"
      src={getAvatarUrl(seed)}
      onError={(e) => {
        e.currentTarget.src = DEFAULT_AVATAR_URL;
      }}
      alt={name}
    />
  );
}


// ✅ MainLayout import { Header } OK
export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b bg-white">
      <Link to="/app" className="font-bold text-gray-900 hover:opacity-80">
        Sharever
      </Link>
      <HeaderRight />
    </header>
  );
}

export function HeaderRight() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement | null>(null);

  const displayName = user?.name ?? "Account";

  // đóng dropdown khi click ra ngoài
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // chưa login -> hiện nút Login
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

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-gray-50"
      >
        <Avatar
          name={displayName}
          seed={user?.email ?? user?.id}
        />

        <span className="text-sm font-semibold text-gray-900">
          {displayName}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl border bg-white shadow-lg overflow-hidden z-50">
          <button
            type="button"
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
            onClick={() => {
              setOpen(false);
              navigate("/app/accounts");
            }}
          >
            Account
          </button>

          <button
            type="button"
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            onClick={() => {
              setOpen(false);
              logout();
              navigate("/login", { replace: true });
            }}
          >
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
