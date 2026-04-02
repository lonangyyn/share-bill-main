import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { User, LogOut, Edit3, Trash2 } from "lucide-react";

import { useAuth } from "../../features/auth/model/use-auth";
import { userApi } from "../../entities/user/api";
import { eventApi } from "../../entities/event/api";
import { participantApi } from "../../entities/participant/api";
import type { Event } from "../../entities/event/types";
import { Modal } from "../../shared/ui/modal";
import { Input } from "../../shared/ui/input";
import { Button } from "../../shared/ui/button";
import { useToast } from "../../shared/ui/toast";
import { normalizeError } from "../../shared/lib/errors";
import { DEFAULT_AVATAR_URL } from "../../shared/lib/default-avatar";
import {
  BankInfoForm,
  type BankInfoPayload,
} from "../../features/bank-update/ui/bank-info-form";

import {
  changePasswordSchema,
  type ChangePasswordPayload,
} from "../../features/auth/model/schemas";
import { useEventStore } from "../../stores/use-event-store";

import { getAvatarUrl } from "../../shared/lib/random-avatar";

type LocalBankAccount = {
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault?: boolean;
};

function bankStorageKey(userKey: string) {
  return `sharever.bankAccounts.${userKey}`;
}

function loadBankAccounts(userKey: string): LocalBankAccount[] {
  try {
    const raw = localStorage.getItem(bankStorageKey(userKey));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveBankAccounts(userKey: string, banks: LocalBankAccount[]) {
  localStorage.setItem(bankStorageKey(userKey), JSON.stringify(banks));
}

function normalizeBanks(next: LocalBankAccount[]) {
  if (next.length === 0) return [];
  const hasDefault = next.some((b) => b.isDefault);
  if (!hasDefault) {
    return next.map((b, i) => ({ ...b, isDefault: i === 0 }));
  }
  // if multiple defaults -> keep first
  let seen = false;
  return next.map((b) => {
    if (b.isDefault) {
      if (!seen) {
        seen = true;
        return b;
      }
      return { ...b, isDefault: false };
    }
    return b;
  });
}

const SettingItem = ({ icon: Icon, label, danger, onClick }: any) => (
  <div
    className={`flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer group ${
      danger ? "hover:bg-red-50" : "hover:bg-gray-50"
    }`}
    onClick={onClick}
  >
    <div className="flex items-center gap-4">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
          danger
            ? "bg-red-100 text-red-500 group-hover:bg-red-200"
            : "bg-gray-100 text-gray-600 group-hover:bg-white group-hover:shadow-sm"
        }`}
      >
        <Icon size={20} />
      </div>
      <span
        className={`font-semibold ${danger ? "text-red-500" : "text-gray-700"}`}
      >
        {label}
      </span>
    </div>
  </div>
);

export default function AccountsPage() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const logout = useAuth((s) => s.logout);
  const queryClient = useQueryClient();
  const toast = useToast();
  const setSelectedEventId = useEventStore((s) => s.setSelectedEventId);

  const [editOpen, setEditOpen] = useState(false);
  const [personalOpen, setPersonalOpen] = useState(false);

  const [bankOpen, setBankOpen] = useState(false);
  const [editingBankIndex, setEditingBankIndex] = useState<number | null>(null);

  const [fullName, setFullName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayName = user?.name ?? "Account";
  const displayEmail = user?.email ?? "Unknown";

  // legacy bank info from BE (still works as fallback)
  const bankInfo = user?.bankInfo ?? {
    bankName: (user as any)?.bankName ?? "",
    accountNumber: (user as any)?.accountNumber ?? "",
    accountName: (user as any)?.accountName ?? "",
  };

  const hasBankInfo =
    !!bankInfo?.bankName &&
    !!bankInfo?.accountNumber &&
    !!bankInfo?.accountName;

  // local bank list (no BE changes)
  const userKey = user?.email ?? user?.id ?? "guest";
  const [bankAccounts, setBankAccounts] = useState<LocalBankAccount[]>([]);

  useEffect(() => {
    setBankAccounts(loadBankAccounts(userKey));
  }, [userKey]);

  const defaultLocalBank =
    bankAccounts.find((b) => b.isDefault) ?? bankAccounts[0] ?? null;

  // ===== Change password state =====
  const [pwd, setPwd] = useState<ChangePasswordPayload>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);

  async function syncParticipantNames(userId: string, name: string) {
    if (!userId) return;
    let hadError = false;

    try {
      const events = await eventApi.list();

      await Promise.all(
        (events as any[]).map(async (event) => {
          try {
            const participantsData = await participantApi.list(
              String(event.id),
            );
            const participants = Array.isArray(participantsData)
              ? participantsData
              : ((participantsData as any)?.participants ?? []);
            const match = participants.find(
              (p: any) => String(p.userId) === String(userId),
            );
            if (match && match.name !== name) {
              await participantApi.update(String(match.id), { name });
            }
          } catch {
            hadError = true;
          }
        }),
      );

      await queryClient.invalidateQueries({ queryKey: ["participants"] });
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
    } catch {
      hadError = true;
    }

    if (hadError) toast.push("Name updated, but some events did not sync.");
  }

  async function syncParticipantBankInfo(
    userId: string,
    bankPayload: BankInfoPayload,
  ) {
    if (!userId) return;
    let hadError = false;

    try {
      const events = await eventApi.list();

      await Promise.all(
        (events as any[]).map(async (event) => {
          try {
            const participantsData = await participantApi.list(
              String(event.id),
            );
            const participants = Array.isArray(participantsData)
              ? participantsData
              : ((participantsData as any)?.participants ?? []);
            const match = participants.find(
              (p: any) => String(p.userId) === String(userId),
            );
            if (match) {
              await participantApi.update(String(match.id), {
                name: match.name ?? user?.name ?? "Member",
                bankInfo: {
                  bankName: bankPayload.bankName,
                  accountNumber: bankPayload.accountNumber,
                  accountName: bankPayload.accountName,
                },
              });
            }
          } catch {
            hadError = true;
          }
        }),
      );

      await queryClient.invalidateQueries({ queryKey: ["participants"] });
    } catch {
      hadError = true;
    }

    if (hadError)
      toast.push("Bank info updated, but some events did not sync.");
  }

  async function handleSaveName(e: FormEvent) {
    e.preventDefault();
    const nextName = fullName.trim();
    if (!nextName) {
      setError("Full name is required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await userApi.updateProfile({ name: nextName });
      setUser(updated);
      await syncParticipantNames(String(updated?.id ?? ""), nextName);
      toast.push("Name updated.");
      setEditOpen(false);
      setPersonalOpen(false);
    } catch (err) {
      setError(normalizeError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPwdError(null);

    const parsed = changePasswordSchema.safeParse(pwd);
    if (!parsed.success) {
      setPwdError(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ");
      return;
    }

    try {
      setPwdSaving(true);
      await userApi.changePassword(parsed.data);
      toast.push("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");

      logout();
      queryClient.clear();
      navigate("/login", { replace: true });
    } catch (err) {
      setPwdError(normalizeError(err));
    } finally {
      setPwdSaving(false);
    }
  }

  function handleLogout() {
    // Nếu bạn muốn logout là xóa luôn bank local của user hiện tại thì mở comment dòng dưới:
    // localStorage.removeItem(bankStorageKey(userKey));

    logout();
    queryClient.clear();
    navigate("/login", { replace: true });
  }

  // ===== Personal modal: events list =====
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  useEffect(() => {
    if (!personalOpen) return;
    let mounted = true;

    (async () => {
      try {
        setEventsLoading(true);
        setEventsError(null);
        const list = await eventApi.list();
        if (mounted) setEvents(Array.isArray(list) ? list : []);
      } catch (e) {
        if (mounted) setEventsError(normalizeError(e));
      } finally {
        if (mounted) setEventsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [personalOpen]);

  const displayedBanks: LocalBankAccount[] = useMemo(() => {
    if (bankAccounts.length > 0) return bankAccounts;
    if (hasBankInfo) {
      return [
        {
          bankName: bankInfo.bankName,
          accountNumber: bankInfo.accountNumber,
          accountName: bankInfo.accountName,
          isDefault: true,
        },
      ];
    }
    return [];
  }, [bankAccounts, hasBankInfo, bankInfo]);

  return (
    <div className="animate-enter space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 font-display">
          Account Settings
        </h1>
        <p className="text-gray-500 mt-1">
          Manage your profile and bank transfer info.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-4 space-y-6">
          {/* Profile Card */}
          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-teal-400 to-purple-400 opacity-20" />

            <div className="relative z-10 mt-8 mb-4">
              <div className="w-28 h-28 mx-auto rounded-full p-1 bg-white shadow-md">
                <img
                  src={getAvatarUrl(user?.email ?? user?.id)}
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_AVATAR_URL;
                  }}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover border-4 border-white"
                />
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
            <p className="text-gray-500 text-sm mb-6">{displayEmail}</p>

            <button
              className="w-full py-3 rounded-xl border border-gray-200 font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
              onClick={() => {
                setFullName(user?.name ?? "");
                setError(null);
                setEditOpen(true);
              }}
            >
              <Edit3 size={16} /> Edit name
            </button>
          </div>

          {/* Bank transfer (local list) */}
          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Bank transfer</h3>

              <button
                className="text-purple-600 text-sm font-bold hover:underline"
                onClick={() => {
                  setEditingBankIndex(null);
                  setBankOpen(true);
                }}
              >
                Add
              </button>
            </div>

            {displayedBanks.length > 0 ? (
              <div className="mt-4 space-y-3">
                {displayedBanks.map((b, idx) => (
                  <div
                    key={`${b.bankName}-${b.accountNumber}-${idx}`}
                    className="rounded-2xl border border-gray-100 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                          {b.bankName}
                          {b.isDefault && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="text-gray-700 text-sm">
                          {b.accountNumber}
                        </div>
                        <div className="text-gray-500 text-sm">
                          {b.accountName}
                        </div>
                      </div>

                      {/* Only allow edit/delete/default for LOCAL banks */}
                      {bankAccounts.length > 0 && (
                        <div className="flex items-center gap-2">
                          <button
                            className="text-sm font-semibold text-gray-700 hover:underline"
                            onClick={() => {
                              setEditingBankIndex(idx);
                              setBankOpen(true);
                            }}
                          >
                            Edit
                          </button>

                          <button
                            className="text-sm font-semibold text-rose-600 hover:underline flex items-center gap-1"
                            onClick={() => {
                              const next = bankAccounts.filter(
                                (_, i) => i !== idx,
                              );
                              const normalized = normalizeBanks(next);
                              setBankAccounts(normalized);
                              saveBankAccounts(userKey, normalized);
                              toast.push("Bank removed.");
                            }}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>

                    {bankAccounts.length > 0 && !b.isDefault && (
                      <button
                        className="mt-3 text-sm font-bold text-purple-600 hover:underline"
                        onClick={async () => {
                          const next = normalizeBanks(
                            bankAccounts.map((x, i) => ({
                              ...x,
                              isDefault: i === idx,
                            })),
                          );
                          setBankAccounts(next);
                          saveBankAccounts(userKey, next);
                          toast.push("Default bank updated.");

                          const def = next.find((x) => x.isDefault) ?? next[0];
                          if (def) {
                            await syncParticipantBankInfo(
                              String(user?.id ?? ""),
                              {
                                bankName: def.bankName,
                                accountNumber: def.accountNumber,
                                accountName: def.accountName,
                              },
                            );
                          }
                        }}
                      >
                        Set as default
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 text-sm text-gray-500">
                Add bank info to receive VietQR payments.
              </div>
            )}

            <div className="mt-3 text-xs text-gray-400">
              Use VietQR bank code (VCB, ACB, TCB).
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-2 rounded-[32px] border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-50">
              <h3 className="font-bold text-gray-900">Account</h3>
            </div>

            <div className="p-2 space-y-1">
              <SettingItem
                icon={User}
                label="Personal Information"
                onClick={() => setPersonalOpen(true)}
              />
            </div>
          </div>

          <div className="bg-white p-2 rounded-[32px] border border-gray-100 shadow-sm">
            <SettingItem
              icon={LogOut}
              label="Log out"
              danger
              onClick={handleLogout}
            />
          </div>

          <div className="text-center text-sm text-gray-400 pt-4">
            Sharever App v1.0.2
          </div>
        </div>
      </div>

      {/* Personal Information modal */}
      <Modal
        open={personalOpen}
        onClose={() => setPersonalOpen(false)}
        title="Personal Information"
      >
        <div className="space-y-6">
          {/* Profile */}
          <div className="rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-4">
              <img
                src={getAvatarUrl(user?.email ?? user?.id)}
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_AVATAR_URL;
                }}
                className="w-12 h-12 rounded-full object-cover border"
                alt="avatar"
              />
              <div className="min-w-0">
                <div className="font-bold text-gray-900 truncate">
                  {displayName}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {displayEmail}
                </div>
              </div>
            </div>
          </div>

          {/* Edit name */}
          <div className="rounded-2xl border border-gray-100 p-4">
            <div className="font-bold text-gray-900 mb-3">Edit name</div>
            <form className="space-y-3" onSubmit={handleSaveName}>
              <Input
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              {error && <div className="text-sm text-rose-600">{error}</div>}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-gray-600"
                  onClick={() => setPersonalOpen(false)}
                  disabled={saving}
                >
                  Close
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </div>

          {/* Events */}
          <div className="rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-gray-900">Your events</div>
              <button
                className="text-sm font-bold text-purple-600 hover:underline"
                onClick={async () => {
                  try {
                    setEventsLoading(true);
                    setEventsError(null);
                    const list = await eventApi.list();
                    setEvents(Array.isArray(list) ? list : []);
                  } catch (e) {
                    setEventsError(normalizeError(e));
                  } finally {
                    setEventsLoading(false);
                  }
                }}
              >
                Refresh
              </button>
            </div>

            {eventsLoading ? (
              <div className="text-sm text-gray-500">Loading events...</div>
            ) : eventsError ? (
              <div className="text-sm text-rose-600">{eventsError}</div>
            ) : events.length === 0 ? (
              <div className="text-sm text-gray-500">No events found.</div>
            ) : (
              <div className="space-y-2">
                {events.map((ev: any) => (
                  <button
                    key={String(
                      ev.id ?? ev.eventId ?? ev.event_id ?? ev.event_uuid,
                    )}
                    className="w-full text-left rounded-xl border border-gray-100 p-3 hover:bg-gray-50"
                    onClick={() => {
                      const id = String(
                        ev.id ?? ev.eventId ?? ev.event_id ?? ev.event_uuid,
                      );
                      setSelectedEventId(id);
                      navigate("/app/activity");
                      setPersonalOpen(false);
                    }}
                  >
                    <div className="font-semibold text-gray-900">
                      {ev.name ?? "Untitled event"}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bank accounts summary */}
          <div className="rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-gray-900">Bank accounts</div>
              <button
                className="text-sm font-bold text-purple-600 hover:underline"
                onClick={() => {
                  setEditingBankIndex(null);
                  setBankOpen(true);
                }}
              >
                Add
              </button>
            </div>

            {displayedBanks.length === 0 ? (
              <div className="text-sm text-gray-500">No bank accounts yet.</div>
            ) : (
              <div className="space-y-2">
                {displayedBanks.map((b, idx) => (
                  <div
                    key={`${b.bankName}-${b.accountNumber}-${idx}`}
                    className="rounded-xl border border-gray-100 p-3"
                  >
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      {b.bankName}
                      {b.isDefault && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-700">
                      {b.accountNumber}
                    </div>
                    <div className="text-sm text-gray-500">{b.accountName}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* ===== Change password ===== */}
        <div className="rounded-2xl border border-gray-100 p-4">
          <div className="font-bold text-gray-900 mb-3">Change password</div>

          <form className="space-y-3" onSubmit={handleChangePassword}>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Current password
              </label>
              <Input
                type="password"
                value={pwd.currentPassword}
                onChange={(e) =>
                  setPwd((s) => ({ ...s, currentPassword: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                New password
              </label>
              <Input
                type="password"
                value={pwd.newPassword}
                onChange={(e) =>
                  setPwd((s) => ({ ...s, newPassword: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Confirm new password
              </label>
              <Input
                type="password"
                value={pwd.confirmPassword}
                onChange={(e) =>
                  setPwd((s) => ({ ...s, confirmPassword: e.target.value }))
                }
                required
              />
            </div>

            {pwdError && (
              <div className="text-sm text-rose-600">{pwdError}</div>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={pwdSaving}>
                {pwdSaving ? "Updating..." : "Update password"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Edit name modal (kept for old flow) */}
      <Modal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setError(null);
        }}
        title="Update full name"
      >
        <form className="space-y-4" onSubmit={handleSaveName}>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Full name
            </label>
            <Input
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          {error && <div className="text-sm text-rose-600">{error}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="text-gray-600"
              onClick={() => setEditOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bank info form (local save) */}
      <BankInfoForm
        open={bankOpen}
        onClose={() => setBankOpen(false)}
        initial={{
          bankName:
            editingBankIndex !== null
              ? (bankAccounts[editingBankIndex]?.bankName ?? "")
              : "",
          accountNumber:
            editingBankIndex !== null
              ? (bankAccounts[editingBankIndex]?.accountNumber ?? "")
              : "",
          accountName:
            editingBankIndex !== null
              ? (bankAccounts[editingBankIndex]?.accountName ?? "")
              : "",
        }}
        onSubmit={async (payload) => {
          const bankPayload: LocalBankAccount = {
            bankName: payload.bankName.trim(),
            accountNumber: payload.accountNumber.trim(),
            accountName: payload.accountName.trim(),
          };

          if (
            !bankPayload.bankName ||
            !bankPayload.accountNumber ||
            !bankPayload.accountName
          ) {
            toast.push("Please fill all bank fields.");
            return;
          }

          let next: LocalBankAccount[];

          if (editingBankIndex !== null) {
            next = bankAccounts.map((b, i) =>
              i === editingBankIndex ? { ...b, ...bankPayload } : b,
            );
          } else {
            next = [
              ...bankAccounts,
              { ...bankPayload, isDefault: bankAccounts.length === 0 },
            ];
          }

          next = normalizeBanks(next);
          setBankAccounts(next);
          saveBankAccounts(userKey, next);

          toast.push(
            editingBankIndex !== null
              ? "Bank info updated"
              : "Bank info updated",
          );
          setBankOpen(false);

          // sync participant with default bank (optional)
          const def = next.find((b) => b.isDefault) ?? next[0];
          if (def) {
            await syncParticipantBankInfo(String(user?.id ?? ""), {
              bankName: def.bankName,
              accountNumber: def.accountNumber,
              accountName: def.accountName,
            });
          }
        }}
      />
    </div>
  );
}
