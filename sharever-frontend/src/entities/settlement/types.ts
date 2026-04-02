export type BankInfo = {
  bankName: string;
  accountNumber: string;
  accountName: string;
};

export type SettlementEvent = {
  id: string;
  name: string;
  totalExpenses: number;
  averagePerPerson: number;
  totalParticipants: number;
  currency: string;
  status: string;
};

export type SummaryInfo = {
  totalPaidByAll: number;
  collector?: {
    id: string;
    name: string;
    bankInfo: BankInfo;
  };
};

export type ParticipantBalance = {
  id: string;
  name: string;
  avatar?: string;
  totalPaid: number;
  totalBenefit: number;
  balance: number;
  balanceType: "credit" | "debit";
  qrCodeUrl?: string;
  settlementInfo?: {
    action: string;
    description: string;
  };
};

export type SettlementPlanItem = {
  from: { id: string; name: string };
  to: { id: string; name: string };
  amount: number;
};

export type EventSummaryResponse = {
  event: SettlementEvent;
  summary: SummaryInfo;
  participants: ParticipantBalance[];
  settlementPlan: SettlementPlanItem[];
  meta: { generatedAt: string };
};

export type PaymentQR = {
  qrCodeUrl: string;
  bankInfo: BankInfo;
  amount: number;
  content: string;
};
