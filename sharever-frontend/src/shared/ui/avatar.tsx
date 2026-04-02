import { cn } from "../lib/utils";
import { DEFAULT_AVATAR_URL } from "../lib/default-avatar";

export function Avatar({
  src,
  name,
  className,
}: {
  src?: string;
  name: string;
  className?: string;
}) {
  return (
    <div className={cn("h-10 w-10 rounded-full overflow-hidden bg-gray-200", className)}>
      <img
        src={src || DEFAULT_AVATAR_URL}
        className="h-full w-full object-cover"
        alt={name}
      />
    </div>
  );
}
