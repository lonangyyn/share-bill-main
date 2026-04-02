import { http } from "../../shared/api/http";
import { endpoints } from "../../shared/api/endpoints";
import type {
  Transaction,
  TransactionDetail,
  CreateTransactionPayload,
} from "./types";

export const transactionApi = {
  async list(eventId: string): Promise<Transaction[]> {
    const res = await http.get(endpoints.transactions.list(eventId));
    const data = res.data.data ?? res.data;
    return Array.isArray(data) ? data : data.transactions ?? [];
  },
  async detail(txnId: string): Promise<TransactionDetail> {
    const res = await http.get(endpoints.transactions.detail(txnId));
    return res.data.data ?? res.data;
  },
  async create(eventId: string, payload: CreateTransactionPayload): Promise<Transaction> {
    const res = await http.post(endpoints.transactions.create(eventId), payload);
    return res.data.data ?? res.data;
  },
  async update(txnId: string, payload: CreateTransactionPayload): Promise<void> {
    await http.put(endpoints.transactions.update(txnId), payload);
  },
  async remove(eventId: string, txnId: string): Promise<void> {
    await http.delete(endpoints.transactions.remove(eventId, txnId));
  },
};
