export type BankInfo = {
  bankName: string;
  accountNumber: string;
  accountName: string;
};

export type User = {
  id: string;
  email?: string;
  name: string;
  avatar?: string;
  avatarUrl?: string;
  bankInfo?: BankInfo;

  bankName?: string;
  accountNumber?: string;
  accountName?: string;
};
