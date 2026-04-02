import { Avatar } from "../../shared/ui/avatar";
import { formatCurrencyVND } from "../../shared/lib/format";

export function MemberList() {
  return (
    <div className="rounded-[32px] bg-white p-6 border border-gray-100 animate-enter delay-200">
      <div className="text-xs font-bold text-gray-700 tracking-wide">
        MEMBER BALANCES
      </div>

      <div className="mt-4 space-y-3">
        <MemberRow name="You" sub="settled up" amount={0} />
        <MemberRow name="Sky" sub="gets back" amount={25000} positive />
        <MemberRow name="Firefly" sub="owes" amount={-25000} />
      </div>
    </div>
  );
}

function MemberRow({
  name,
  sub,
  amount,
  positive,
}: {
  name: string;
  sub: string;
  amount: number;
  positive?: boolean;
}) {
  const color =
    amount > 0 ? "text-emerald-600" : amount < 0 ? "text-red-500" : "text-gray-400";

  return (
    <div className="flex items-center justify-between rounded-2xl bg-white border border-gray-100 px-4 py-3 hover-bounce">
      <div className="flex items-center gap-3">
        <Avatar name={name} />
        <div>
          <div className="text-sm font-semibold text-gray-900">{name}</div>
          <div
            className={`text-xs ${
              positive ? "text-emerald-500" : "text-gray-500"
            }`}
          >
            {sub}
          </div>
        </div>
      </div>

      <div className={`text-sm font-extrabold ${color}`}>
        {amount === 0 ? "--" : formatCurrencyVND(Math.abs(amount))}
      </div>
    </div>
  );
}
