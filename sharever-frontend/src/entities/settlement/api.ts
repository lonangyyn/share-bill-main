import { http } from "../../shared/api/http";
import { endpoints } from "../../shared/api/endpoints";
import type { EventSummaryResponse, PaymentQR } from "./types";

export const settlementApi = {
  async summary(eventId: string): Promise<EventSummaryResponse> {
    const res = await http.get(endpoints.settlement.summary(eventId));
    return res.data.data ?? res.data;
  },

  async generateQr(eventId: string, payload: { receiverId?: string; amount: number }): Promise<PaymentQR> {
    const res = await http.get(endpoints.settlement.generateQr(eventId), {
      params: { receiverId: payload.receiverId, amount: payload.amount },
    });
    return res.data.data ?? res.data;
  },

  async settleUp(
    eventId: string,
    payload: { payerId: string; receiverId: string; amount: number }
  ): Promise<void> {
    await http.post(endpoints.settlement.settleUp(eventId), payload);
  },
};
