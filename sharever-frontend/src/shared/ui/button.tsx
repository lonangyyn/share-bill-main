import { cn } from "../lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "danger";
};

export function Button({ variant = "primary", className, ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold hover-bounce disabled:opacity-60 disabled:cursor-not-allowed";
  const variantCls =
    variant === "primary"
      ? "bg-[#ff6a2b] text-white shadow-[0_12px_30px_rgba(255,106,43,0.35)]"
      : variant === "outline"
      ? "border border-gray-200 bg-white text-gray-800"
      : variant === "danger"
      ? "bg-red-500 text-white"
      : "bg-transparent text-gray-700 hover:bg-gray-100";

  return <button className={cn(base, variantCls, className)} {...props} />;
}
