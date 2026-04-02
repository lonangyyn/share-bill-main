export function splitEqual(amount: number, userIds: string[]) {
  const n = Math.max(userIds.length, 1);
  const each = Math.floor(amount / n);
  return userIds.map((id) => ({ userId: id, share: each }));
}
