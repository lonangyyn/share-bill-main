import { useEffect, useMemo, useState, useRef, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { User, LogOut, Edit3 } from "lucide-react";

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

import { AvatarCropModal } from "./avatar_drop_modal";
import { BankSection } from "./bank_section";

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
  if (!hasDefault) return next.map((b, i) => ({ ...b, isDefault: i === 0 }));
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
    className={`flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer group ${danger ? "hover:bg-red-50" : "hover:bg-gray-50"}`}
    onClick={onClick}
  >
    <div className="flex items-center gap-4">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${danger ? "bg-red-100 text-red-500 group-hover:bg-red-200" : "bg-gray-100 text-gray-600 group-hover:bg-white group-hover:shadow-sm"}`}
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

  const bankInfo = user?.bankInfo ?? {
    bankName: (user as any)?.bankName ?? "",
    accountNumber: (user as any)?.accountNumber ?? "",
    accountName: (user as any)?.accountName ?? "",
  };
  const hasBankInfo =
    !!bankInfo?.bankName &&
    !!bankInfo?.accountNumber &&
    !!bankInfo?.accountName;

  const userKey = user?.email ?? user?.id ?? "guest";
  const [bankAccounts, setBankAccounts] = useState<LocalBankAccount[]>([]);

  useEffect(() => {
    setBankAccounts(loadBankAccounts(userKey));
  }, [userKey]);

  // Change password state
  const [pwd, setPwd] = useState<ChangePasswordPayload>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);

  // Avatar upload state
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarCropOpen, setAvatarCropOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropScale, setCropScale] = useState(1);
  const [cropRotate, setCropRotate] = useState(0);
  const [avatarRefresh, setAvatarRefresh] = useState(0);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  //const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sync Functions (Duy trì y nguyên logic sync gốc của bạn)
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
            if (match && match.name !== name)
              await participantApi.update(String(match.id), { name });
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
            if (match)
              await participantApi.update(String(match.id), {
                name: match.name ?? user?.name ?? "Member",
                bankInfo: { ...bankPayload },
              });
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

  // Handlers
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
      setPwdError(parsed.error.issues[0]?.message ?? "Invalid data");
      return;
    }
    try {
      setPwdSaving(true);
      await userApi.changePassword(parsed.data);
      toast.push("Password changed. Please login again.");
      logout();
      queryClient.clear();
      navigate("/login", { replace: true });
    } catch (err) {
      setPwdError(normalizeError(err));
    } finally {
      setPwdSaving(false);
    }
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.push("Avatar file size must be less than 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string);
      setSelectedFile(file);
      setCropScale(1);
      setCropRotate(0);
      setAvatarCropOpen(true);
    };
    reader.readAsDataURL(file);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  }

  async function handleCropAvatar(
    canvas: HTMLCanvasElement,
    cropOffset: { x: number; y: number },
    containerWidth: number,
  ) {
    if (!selectedFile || !previewUrl) return;
    setAvatarUploading(true);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = async () => {
      canvas.width = 300;
      canvas.height = 300;
      ctx.save();
      const ratio = 300 / (containerWidth || 300);
      ctx.translate(150 + cropOffset.x * ratio, 150 + cropOffset.y * ratio);
      ctx.rotate((cropRotate * Math.PI) / 180);
      ctx.scale(cropScale, cropScale);
      ctx.drawImage(
        img,
        -img.width / 2,
        -img.height / 2,
        img.width,
        img.height,
      );
      ctx.restore();
      canvas.toBlob(
        async (blob) => {
          if (!blob) return;
          try {
            const croppedFile = new File([blob], selectedFile.name, {
              type: "image/jpeg",
            });
            const updated = await userApi.updateAvatar(croppedFile);
            setUser(updated);
            toast.push("Avatar updated successfully");
            setAvatarCropOpen(false);
            setAvatarRefresh((prev) => prev + 1);
          } catch (err) {
            toast.push(normalizeError(err));
          } finally {
            setAvatarUploading(false);
          }
        },
        "image/jpeg",
        0.9,
      );
    };
    img.src = previewUrl;
  }

  // Personal Modal Logic
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

  const displayedBanks = useMemo(() => {
    if (bankAccounts.length > 0) return bankAccounts;
    if (hasBankInfo) return [{ ...bankInfo, isDefault: true }];
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
          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-teal-400 to-purple-400 opacity-20" />
            <div className="relative z-10 mt-8 mb-4">
              <div className="w-28 h-28 mx-auto rounded-full p-1 bg-white shadow-md">
                <img
                  key={avatarRefresh}
                  src={
                    user?.avatarUrl || user?.avatar || getAvatarUrl(user?.email)
                  }
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_AVATAR_URL;
                  }}
                  className="w-full h-full rounded-full object-cover border-4 border-white"
                  alt="Profile"
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
            <button
              className="w-full py-3 rounded-xl border border-gray-200 font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors mt-2"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
            >
              {avatarUploading ? "Uploading..." : "Upload avatar"}
            </button>
          </div>

          <BankSection
            banks={displayedBanks}
            bankAccounts={bankAccounts} // Truyền mảng state gốc
            onAdd={() => {
              setEditingBankIndex(null);
              setBankOpen(true);
            }}
            onEdit={(idx) => {
              setEditingBankIndex(idx);
              setBankOpen(true);
            }}
            onDelete={async (idx) => {
              const wasDefault = bankAccounts[idx].isDefault;
              const next = bankAccounts.filter((_, i) => i !== idx);
              const normalized = normalizeBanks(next);
              setBankAccounts(normalized);
              saveBankAccounts(userKey, normalized);
              toast.push("Bank removed.");

              if (wasDefault) {
                const newDef = normalized.find((x) => x.isDefault);
                try {
                  if (newDef) {
                    await userApi.updateProfile({
                      bankName: newDef.bankName,
                      accountNumber: newDef.accountNumber,
                      accountName: newDef.accountName,
                    });
                    await syncParticipantBankInfo(
                      String(user?.id ?? ""),
                      newDef,
                    );
                  } else {
                    await userApi.updateProfile({
                      bankName: "",
                      accountNumber: "",
                      accountName: "",
                    });
                    await syncParticipantBankInfo(String(user?.id ?? ""), {
                      bankName: "",
                      accountNumber: "",
                      accountName: "",
                    });
                  }
                } catch (e) {
                  console.error(e);
                }
              }
            }}
            onSetDefault={async (idx) => {
              const next = normalizeBanks(
                bankAccounts.map((x, i) => ({ ...x, isDefault: i === idx })),
              );
              setBankAccounts(next);
              saveBankAccounts(userKey, next);
              const def = next.find((x) => x.isDefault) ?? next[0];
              if (def) {
                try {
                  await userApi.updateProfile({
                    bankName: def.bankName,
                    accountNumber: def.accountNumber,
                    accountName: def.accountName,
                  });
                  await syncParticipantBankInfo(String(user?.id ?? ""), def);
                  toast.push("Default bank updated.");
                } catch (err) {
                  toast.push(normalizeError(err));
                }
              }
            }}
          />
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
              onClick={() => {
                logout();
                queryClient.clear();
                navigate("/login", { replace: true });
              }}
            />
          </div>
        </div>
      </div>

      <Modal
        open={personalOpen}
        onClose={() => setPersonalOpen(false)}
        title="Personal Information"
      >
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-4">
              <img
                key={avatarRefresh}
                src={
                  user?.avatarUrl || user?.avatar || getAvatarUrl(user?.email)
                }
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
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </div>

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
                    key={String(ev.id ?? ev.eventId ?? ev.event_id)}
                    className="w-full text-left rounded-xl border border-gray-100 p-3 hover:bg-gray-50"
                    onClick={() => {
                      setSelectedEventId(
                        String(ev.id ?? ev.eventId ?? ev.event_id),
                      );
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
        </div>
      </Modal>

      {/* Edit Name Modal (Dành cho flow ở Profile Card) */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Update full name"
      >
        <form className="space-y-4" onSubmit={handleSaveName}>
          <Input
            placeholder="Your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          {error && <div className="text-sm text-rose-600">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
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

      {/* Avatar Crop Modal */}
      {avatarCropOpen && previewUrl && (
        <AvatarCropModal
          previewUrl={previewUrl}
          cropScale={cropScale}
          cropRotate={cropRotate}
          loading={avatarUploading}
          onScaleChange={setCropScale}
          onRotateChange={setCropRotate}
          onClose={() => setAvatarCropOpen(false)}
          onSave={handleCropAvatar}
        />
      )}
      {/* Bank info form */}
      <BankInfoForm
        open={bankOpen}
        onClose={() => setBankOpen(false)}
        initial={
          editingBankIndex !== null ? bankAccounts[editingBankIndex] : {}
        }
        onSubmit={async (payload) => {
          try {
            let next: LocalBankAccount[];
            if (editingBankIndex !== null) {
              next = bankAccounts.map((b, i) =>
                i === editingBankIndex ? { ...b, ...payload } : b,
              );
            } else {
              next = [
                ...bankAccounts,
                { ...payload, isDefault: bankAccounts.length === 0 },
              ];
            }
            next = normalizeBanks(next);
            setBankAccounts(next);
            saveBankAccounts(userKey, next);
            toast.push(
              editingBankIndex !== null
                ? "Bank info updated locally"
                : "Bank info added locally",
            );
            setBankOpen(false);

            const def = next.find((b) => b.isDefault) ?? next[0];
            const isEditingDefault =
              editingBankIndex !== null &&
              bankAccounts[editingBankIndex].isDefault;
            const isFirstBank = bankAccounts.length === 0;

            // Chỉ lưu lên Database nếu Bank vừa thêm/sửa là Default Bank
            if (def && (isEditingDefault || isFirstBank)) {
              await userApi.updateProfile({
                bankName: def.bankName,
                accountNumber: def.accountNumber,
                accountName: def.accountName,
              });
              await syncParticipantBankInfo(String(user?.id ?? ""), def);
            }
          } catch (err) {
            toast.push(normalizeError(err));
          }
        }}
      />

      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarChange}
        className="hidden"
      />
    </div>
  );
}
