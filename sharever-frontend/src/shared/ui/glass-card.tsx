import { cn } from "../lib/utils";

export function GlassCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[32px] bg-white/80 backdrop-blur border border-white shadow-sm",
        className
      )}
      {...props}
    />
  );
}
