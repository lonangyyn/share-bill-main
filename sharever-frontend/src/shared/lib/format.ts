export function formatCurrencyVND(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + " VND";
}

export function formatDate(date: string | number | Date) {
  return new Intl.DateTimeFormat("vi-VN").format(new Date(date));
}
