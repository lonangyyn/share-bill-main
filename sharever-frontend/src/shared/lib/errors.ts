import axios from "axios";

export function normalizeError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as any)?.message || err.message || "Request failed";
  }
  if (err instanceof Error) return err.message;
  return "Unknown error";
}
