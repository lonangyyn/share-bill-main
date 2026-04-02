export type Transaction = {
  id: string;
  description: string;
  amount: number;
  date?: string;
  payerNames?: string[];
};

export type TransactionPayer = {
  id: string;
  name: string;
};

export type TransactionBeneficiary = {
  participantId: string;
  weight: number;
};

export type TransactionDetail = {
  id: string;
  description: string;
  amount: number;
  date?: string;
  payers: TransactionPayer[];
  beneficiaries: TransactionBeneficiary[];
  attachment?: string;
};

export type CreateTransactionPayload = {
  description: string;
  amount: number;
  payers: string[];
  beneficiaries: Array<{ participantId: string; weight: number }>;
  attachment?: string;
};
