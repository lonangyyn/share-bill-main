import { useState } from "react";
import { Modal } from "../../../shared/ui/modal";
import { Input } from "../../../shared/ui/input";
import { Button } from "../../../shared/ui/button";
import { useToast } from "../../../shared/ui/toast";
import { normalizeError } from "../../../shared/lib/errors";

export interface AddMemberPayload {
  name: string;
  email?: string;
}

interface AddMemberDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (data: AddMemberPayload) => Promise<void> | void;
}

export function AddMemberDialog({
  open,
  onClose,
  onSubmit,
}: AddMemberDialogProps) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!onSubmit) return;

    setLoading(true);
    try {
      await onSubmit({ name, email: email || undefined });
      toast.push("Member added.");
      setName("");
      setEmail("");
      onClose();
    } catch (err) {
      toast.push(normalizeError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add member">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Name</label>
          <Input
            placeholder="Sky, Firefly..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Email (optional)
          </label>
          <Input
            type="email"
            placeholder="friend@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            className="text-gray-600"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
