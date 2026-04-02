import { cn } from "../lib/utils";

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "good" | "bad";
}) {
  const toneCls =
    tone === "good"
      ? "bg-emerald-100 text-emerald-700"
      : tone === "bad"
      ? "bg-red-100 text-red-600"
      : "bg-gray-100 text-gray-700";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        toneCls,
        className
      )}
      {...props}
    />
  );
}
