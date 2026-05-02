import { Check, Copy } from "lucide-react";
import { Modal } from "../../../shared/ui/modal";
import { Input } from "../../../shared/ui/input";
import { normalizeParticipantName } from "./helpers";

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  selectedEvent: any;
  inviteUrl: string;
  inviteCopied: boolean;
  handleCopyInvite: () => void;
  participants: any[];
  user: any;
}

export function InviteModal({
  open,
  onClose,
  selectedEvent,
  inviteUrl,
  inviteCopied,
  handleCopyInvite,
  participants,
  user,
}: InviteModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Invite people">
      <div className="space-y-4">
        <div className="rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-rose-50 p-4">
          <div className="text-xs font-semibold text-orange-700">
            Share this link
          </div>
          <div className="text-lg font-extrabold text-gray-900 mt-1">
            {selectedEvent?.name ?? "Selected activity"}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Anyone with this link can join the activity{" "}
            <span className="font-bold">after signing in.</span>
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Invite link
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              readOnly
              value={inviteUrl}
              placeholder="Select an activity to generate link"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              onClick={handleCopyInvite}
              disabled={!inviteUrl}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {inviteCopied ? <Check size={16} /> : <Copy size={16} />}
              {inviteCopied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="text-xs text-gray-500">
            Send this link to your friends. It works on mobile and desktop.
          </div>
        </div>

        {/* Danh sách participants hiện tại */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Current participants
            </label>
            <span className="text-xs text-gray-400">
              {participants.length} members
            </span>
          </div>

          {participants.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-4">
              No participants yet. Add some!
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {participants.map((p: any) => {
                const isCurrentUser =
                  String(p.userId) === String(user?.id) ||
                  (p.email &&
                    user?.email &&
                    String(p.email) === String(user.email));
                const displayName = normalizeParticipantName(
                  p.name,
                  user?.name,
                  isCurrentUser,
                );

                return (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {displayName}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs font-normal text-gray-500">
                            (You)
                          </span>
                        )}
                      </div>
                      {p.email && (
                        <div className="text-xs text-gray-500 truncate mt-0.5">
                          {p.email}
                        </div>
                      )}
                    </div>

                    {p.bankInfo?.accountNumber && (
                      <div className="ml-3 flex-shrink-0">
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                          Bank linked
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
