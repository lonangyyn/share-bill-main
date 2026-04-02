import { http } from "../../shared/api/http";
import { endpoints } from "../../shared/api/endpoints";
import type { CreatePaymentRequestPayload, PaymentRequest } from "./types";

export const paymentRequestApi = {
  async list(eventId: string): Promise<PaymentRequest[]> {
    const res = await http.get(endpoints.paymentRequests.list(eventId));
    return res.data.data ?? res.data;
  },

  async create(eventId: string, payload: CreatePaymentRequestPayload): Promise<PaymentRequest> {
    const res = await http.post(endpoints.paymentRequests.create(eventId), payload);
    return res.data.data ?? res.data;
  },

  async confirm(eventId: string, requestId: string): Promise<PaymentRequest> {
    const res = await http.post(endpoints.paymentRequests.confirm(eventId, requestId));
    return res.data.data ?? res.data;
  },

  async cancel(eventId: string, requestId: string): Promise<PaymentRequest> {
    const res = await http.post(endpoints.paymentRequests.cancel(eventId, requestId));
    return res.data.data ?? res.data;
  },
};
