import { cn } from "../lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-2xl bg-gray-100 px-4 text-sm text-gray-800 outline-none border border-transparent focus:border-purple-400 focus:bg-white focus:shadow-[0_0_0_1px_rgba(139,92,246,0.2)]",
        className
      )}
      {...props}
    />
  );
}
