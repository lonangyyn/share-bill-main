import { useState } from "react";
import { Eye, EyeOff } from "lucide-react"; // Import thêm 2 icon này
import { cn } from "../../shared/lib/utils"; // Giả định bạn có hàm cn này

export function Input({
  className,
  type,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  // Xác định type thực tế sẽ truyền vào input
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="relative w-full">
      <input
        type={inputType}
        className={cn(
          "h-11 w-full rounded-2xl bg-gray-100 px-4 text-sm text-gray-800 outline-none border border-transparent transition-all",
          "focus:border-purple-400 focus:bg-white focus:shadow-[0_0_0_1px_rgba(139,92,246,0.2)]",
          isPassword && "pr-12",
          className,
        )}
        {...props}
      />

      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500 transition-colors"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
}
