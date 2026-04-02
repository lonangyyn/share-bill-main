import { http } from "../../shared/api/http";
import { endpoints } from "../../shared/api/endpoints";
import type { Participant } from "./types";
import type { BankInfo } from "../user/types";

export const participantApi = {
  async list(eventId: string): Promise<Participant[]> {
    const res = await http.get(endpoints.participants.list(eventId));
    const data = res.data.data ?? res.data;
    if (Array.isArray(data)) return data;
    return data.participants ?? [];
  },

  async add(eventId: string, payload: { name: string; bankInfo?: BankInfo }): Promise<Participant> {
    const res = await http.post(endpoints.participants.add(eventId), payload);
    return res.data.data ?? res.data;
  },

  async inviteByEmail(eventId: string, payload: {email: string}): Promise<Participant> {
    const res = await http.post(endpoints.participants.add(eventId), payload);
    return res.data.data ?? res.data;
  },

  async update(
    participantId: string,
    payload: { name?: string; bankInfo?: BankInfo }
  ): Promise<Participant> {
    const res = await http.put(endpoints.participants.update(participantId), payload);
    return res.data.data ?? res.data;
  },

  async joinByLink(eventId: string, payload?: { name: string }): Promise<void> {
    await http.post(endpoints.participants.joinByLink(eventId), payload ?? {});
  },
};
