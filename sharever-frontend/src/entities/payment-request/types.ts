export type PaymentParty = {
  id: string;
  name: string;
};

export type PaymentRequest = {
  id: string;
  eventId: string;
  payer: PaymentParty;
  receiver: PaymentParty;
  amount: number;
  status: "pending" | "confirmed" | "canceled";
  createdAt: string;
  updatedAt: string;
};

export type CreatePaymentRequestPayload = {
  payerId: string;
  receiverId: string;
  amount: number;
};
