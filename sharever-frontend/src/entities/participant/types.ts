import type { BankInfo } from "../user/types";

export type Participant = {
  id: string;
  name: string;
  joinedAt?: string;
  avatar?: string;
  bankInfo?: BankInfo;
  userId?: string;
  email?: string;
  isGuest?: boolean;

  displayName?: string;
  avatarUrl?: string;
  balance?: number;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
};
