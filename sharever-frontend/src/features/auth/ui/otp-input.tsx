import { useEffect, useRef } from "react";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
}: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (value.length === length && onComplete) {
      onComplete(value);
    }
  }, [value, length, onComplete]);

  function handleChange(index: number, digit: string) {
    const clean = digit.replace(/\D/g, "").slice(-1); // chỉ lấy 1 số cuối
    const chars = value.split("");
    chars[index] = clean;
    const nextValue = chars.join("").slice(0, length);
    onChange(nextValue);

    if (clean && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          inputMode="numeric"
          maxLength={1}
          className="h-11 w-10 text-center rounded-2xl bg-gray-100 text-lg font-semibold text-gray-800 outline-none border border-transparent focus:bg-white focus:border-purple-400 focus:shadow-[0_0_0_1px_rgba(139,92,246,0.2)]"
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, i)}
        />
      ))}
    </div>
  );
}
