export function formatMoney(v: number) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(v);
}

export function isEmailLike(value?: string) {
  return !!value && value.includes("@");
}

export function normalizeParticipantName(
  rawName?: string,
  fallbackName?: string,
  preferFallback?: boolean,
) {
  const fallback = fallbackName?.trim() ?? "";
  if (preferFallback && fallback && !isEmailLike(fallback)) return fallback;

  const cleaned = rawName?.trim() ?? "";
  if (cleaned && !isEmailLike(cleaned)) return cleaned;

  if (fallback && !isEmailLike(fallback)) return fallback;

  return "Member";
}

export function formatDate(input?: string) {
  if (!input) return "-";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("vi-VN");
}

export function roundMoney(v: number) {
  return Math.round(v);
}

export function computeExpenseNetByParticipant(detail: any) {
  const amount = Number(detail?.amount ?? 0);
  const payers = Array.isArray(detail?.payers) ? detail.payers : [];
  const beneficiaries = Array.isArray(detail?.beneficiaries)
    ? detail.beneficiaries
    : [];

  const payerCount = payers.length || 0;
  const paidEach = payerCount > 0 ? amount / payerCount : 0;

  const totalWeight =
    beneficiaries.reduce(
      (sum: number, b: any) => sum + Number(b.weight ?? 0),
      0,
    ) || 1;

  const shareByPid = new Map<string, number>();
  beneficiaries.forEach((b: any) => {
    const pid = String(b.participantId ?? b.id ?? "");
    if (!pid) return;
    const w = Number(b.weight ?? 0);
    const share = amount * (w / totalWeight);
    shareByPid.set(pid, (shareByPid.get(pid) ?? 0) + share);
  });

  const netByPid = new Map<string, number>();
  beneficiaries.forEach((b: any) => {
    const pid = String(b.participantId ?? "");
    if (!pid) return;
    netByPid.set(pid, -(shareByPid.get(pid) ?? 0));
  });
  payers.forEach((p: any) => {
    const pid = String(p.id ?? p.participantId ?? "");
    if (!pid) return;
    netByPid.set(pid, (netByPid.get(pid) ?? 0) + paidEach);
  });

  return netByPid;
}
