import { cn } from "../lib/utils";

export function Tabs({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative flex gap-10 border-b border-gray-200">
      {items.map((it) => (
        <button
          key={it}
          onClick={() => onChange(it)}
          className={cn(
            "py-3 text-sm font-semibold border-b-2",
            it === value
              ? "border-purple-600 text-purple-700"
              : "border-transparent text-gray-400 hover:text-gray-600"
          )}
        >
          {it}
        </button>
      ))}
    </div>
  );
}
