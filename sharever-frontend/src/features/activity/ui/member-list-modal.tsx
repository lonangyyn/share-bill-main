import { Trash2 } from "lucide-react";
import { Modal } from "../../../shared/ui/modal";
import { normalizeParticipantName } from "./helpers";

interface MemberListModalProps {
  open: boolean;
  onClose: () => void;
  participants: any[];
  user: any;
  isCreator: boolean;
  removingParticipantId: string | null;
  handleRemoveParticipant: (p: any) => void;
  listParticipant: string;
}

export function MemberListModal({
  open,
  onClose,
  participants,
  user,
  isCreator,
  removingParticipantId,
  handleRemoveParticipant,
  listParticipant,
}: MemberListModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Member List">
      <div className="space-y-6">
        {participants.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>{listParticipant}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">
                This event has:{" "}
                <span className="font-bold">{participants.length}</span>{" "}
                member(s)
              </div>
            </div>

            <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-2">
              {participants.map((p: any) => {
                const isCurrentUser =
                  String(p.userId) === String(user?.id) ||
                  (!!p.email &&
                    !!user?.email &&
                    String(p.email) === String(user.email));
                const displayName = normalizeParticipantName(
                  p.name,
                  user?.name,
                  isCurrentUser,
                );

                return (
                  <div
                    key={p.id}
                    className="rounded-xl border border-gray-200 bg-white px-5 py-4 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-semibold text-gray-900 flex items-center gap-2">
                        {displayName}
                        {isCurrentUser && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                            Bạn
                          </span>
                        )}
                      </div>
                      {p.email && (
                        <div className="text-sm text-gray-500 mt-1 truncate">
                          {p.email}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {p.bankInfo?.accountNumber ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 whitespace-nowrap">
                          Bank linked
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 hidden sm:block">
                          Not linked
                        </span>
                      )}
                      {!isCurrentUser && isCreator && (
                        <button
                          onClick={() => handleRemoveParticipant(p)}
                          disabled={removingParticipantId === p.id}
                          className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors disabled:opacity-50"
                          title="Remove member"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
