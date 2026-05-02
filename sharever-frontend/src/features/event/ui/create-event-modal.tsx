import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Modal } from "../../../shared/ui/modal";
import { Input } from "../../../shared/ui/input";
import { Button } from "../../../shared/ui/button";
import { useToast } from "../../../shared/ui/toast";
import { eventApi } from "../../../entities/event/api";
import { useEventStore } from "../../../stores/use-event-store";
import { normalizeError } from "../../../shared/lib/errors";

interface CreateEventModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateEventModal({ open, onClose }: CreateEventModalProps) {
  const [createName, setCreateName] = useState("");
  const [createCurrency, setCreateCurrency] = useState("VND");
  const [createDescription, setCreateDescription] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const setSelectedEventId = useEventStore((s) => s.setSelectedEventId);

  const handleClose = () => {
    setCreateName("");
    setCreateCurrency("VND");
    setCreateDescription("");
    setCreateError(null);
    onClose();
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) {
      setCreateError("Event name is required.");
      return;
    }
    setCreateError(null);
    setCreateLoading(true);
    try {
      const res: any = await eventApi.create({
        name: createName.trim(),
        currency: createCurrency,
        description: createDescription.trim() || undefined,
      });
      const newEventId = res?.event?.id || res?.id;

      toast.push("Event created successfully!");
      await queryClient.invalidateQueries({ queryKey: ["events"] });

      handleClose();

      if (newEventId) {
        setSelectedEventId(String(newEventId));
        navigate("/app/activity");
      }
    } catch (err: any) {
      setCreateError(normalizeError(err) || "Failed to create event.");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Create New Event">
      <form onSubmit={handleCreateEvent} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Event name <span className="text-rose-500">*</span>
          </label>
          <Input
            placeholder="E.g., Da Lat trip"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Currency</label>
          <select
            className="h-11 w-full rounded-2xl bg-white px-4 text-sm text-gray-800 outline-none border border-gray-200 focus:border-purple-400"
            value={createCurrency}
            onChange={(e) => setCreateCurrency(e.target.value)}
          >
            <option value="VND">VND</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Description{" "}
            <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <textarea
            className="w-full min-h-[96px] rounded-2xl bg-white px-4 py-3 text-sm text-gray-800 outline-none border border-gray-200 focus:border-purple-400 resize-none"
            placeholder="What is this event about?"
            value={createDescription}
            onChange={(e) => setCreateDescription(e.target.value)}
          />
        </div>

        {createError && (
          <div className="text-sm text-rose-600">{createError}</div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            className="text-gray-600"
            onClick={handleClose}
            disabled={createLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createLoading}>
            {createLoading ? "Creating..." : "Create Event"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
