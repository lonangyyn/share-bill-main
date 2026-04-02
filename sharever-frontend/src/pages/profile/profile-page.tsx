import { useEffect, useRef, useState } from "react";
import { User, Mail, Shield, Bell, LogOut, ChevronRight, CreditCard } from "lucide-react";

import { userApi } from "../../entities/user/api";
import { DEFAULT_AVATAR_URL } from "../../shared/lib/default-avatar";
import type { User as UserType } from "../../entities/user/types";

const ProfileItem = ({ icon: Icon, label, value, danger }: any) => (
  <div
    className={`flex items-center justify-between p-4 rounded-2xl transition-colors cursor-pointer ${
      danger ? "hover:bg-red-50" : "hover:bg-gray-50"
    }`}
  >
    <div className="flex items-center gap-4">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          danger ? "bg-red-100 text-red-500" : "bg-gray-100 text-gray-600"
        }`}
      >
        <Icon size={20} />
      </div>
      <span className={`font-semibold ${danger ? "text-red-500" : "text-gray-700"}`}>
        {label}
      </span>
    </div>
    <div className="flex items-center gap-3">
      {value && <span className="text-sm text-gray-400">{value}</span>}
      <ChevronRight size={16} className="text-gray-300" />
    </div>
  </div>
);

export default function ProfilePage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load profile
  useEffect(() => {
    userApi
      .me()
      .then(setUser)
      .catch(() => {
        // token lỗi thì auth guard sẽ xử lý
      });
  }, []);

  const handleChangeAvatar = async (file: File) => {
    try {
      setUploading(true);
      const updatedUser = await userApi.updateAvatar(file);
      setUser(updatedUser);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Upload avatar failed");
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return <div className="py-10 text-center text-gray-400">Loading profile...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto animate-enter py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Account</h1>

      {/* Avatar Section */}
      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm mb-6 flex items-center gap-6">
        <div className="w-24 h-24 rounded-full p-1 border-2 border-dashed border-purple-200">
          <img
            src={user.avatar ?? DEFAULT_AVATAR_URL}
            alt="Profile"
            className="w-full h-full rounded-full object-cover"
          />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
          <p className="text-gray-500">{user.email}</p>

          <button
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="text-sm text-purple-600 font-bold mt-2 hover:underline disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Change Picture"}
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleChangeAvatar(file);
            }}
          />
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white p-2 rounded-[32px] border border-gray-100 shadow-sm space-y-1">
        <ProfileItem icon={User} label="Personal Information" />
        <ProfileItem
          icon={CreditCard}
          label="Payment Methods"
          value={user.bankInfo ? user.bankInfo.bankName : "Not set"}
        />
        <ProfileItem icon={Bell} label="Notifications" value="On" />
        <ProfileItem icon={Shield} label="Security & Privacy" />
      </div>

      <div className="mt-6 bg-white p-2 rounded-[32px] border border-gray-100 shadow-sm">
        <ProfileItem icon={LogOut} label="Log out" danger />
      </div>
    </div>
  );
}
