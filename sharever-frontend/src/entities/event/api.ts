import { http } from "../../shared/api/http";
import { endpoints } from "../../shared/api/endpoints";
import type { Event, EventDetail } from "./types";

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

function unwrap<T>(res: any): T {
  const body: ApiResponse<T> = res?.data ?? {};
  if (body?.success === false) throw new Error(body.message || "Request failed");
  if (body?.data === undefined) {
    // fallback nếu backend trả thẳng T
    return res.data as T;
  }
  return body.data;
}

export const eventApi = {
  async list(): Promise<Event[]> {
    const res = await http.get(endpoints.events.list());
    return unwrap<Event[]>(res);
  },

  async detail(eventId: string): Promise<EventDetail> {
    const res = await http.get(endpoints.events.detail(eventId));
    return unwrap<EventDetail>(res);
  },

  async create(payload: { name: string; currency: string; description?: string }): Promise<Event> {
    const res = await http.post(endpoints.events.create(), payload);
    return unwrap<Event>(res);
  },

  async update(eventId: string, payload: Partial<Event>): Promise<Event> {
    const res = await http.put(endpoints.events.update(eventId), payload);
    return unwrap<Event>(res);
  },

  async remove(eventId: string): Promise<void> {
    await http.delete(endpoints.events.remove(eventId));
  },
};
