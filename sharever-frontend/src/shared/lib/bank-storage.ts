export type LocalBankAccount = {
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault?: boolean;
};

function key(userKey: string) {
  return `sharever.bankAccounts.${userKey}`;
}

export function loadBankAccounts(userKey: string): LocalBankAccount[] {
  try {
    const raw = localStorage.getItem(key(userKey));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveBankAccounts(userKey: string, banks: LocalBankAccount[]) {
  localStorage.setItem(key(userKey), JSON.stringify(banks));
}
