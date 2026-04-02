import { Badge } from "../../shared/ui/badge";
import { Button } from "../../shared/ui/button";

export function EventHeader() {
  return (
    <div className="rounded-[36px] bg-gradient-to-r from-[#fcd9c6] to-[#f7c7b8] p-8 flex items-center justify-between animate-enter">
      <div className="flex items-center gap-6">
        <div className="h-24 w-24 rounded-full bg-white/70 flex items-center justify-center shadow-md">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 flex items-center justify-center">
            🚴
          </div>
        </div>

        <div>
          <div className="text-xs font-bold text-gray-600">
            EVENT ID: 9999 • 13/11/2025
          </div>
          <div className="mt-1 text-4xl font-extrabold text-gray-900">
            Da Lat trip
          </div>
          <div className="mt-1 text-sm text-gray-600">
            Mountain biking &amp; coffee tour
          </div>
          <div className="mt-4">
            <Badge className="bg-white text-gray-900 border border-gray-200">
              TRIP
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button className="min-w-[150px] bg-[#ff6a2b]">
          New expense
        </Button>
        <Button className="min-w-[150px] bg-[#12d7b5] shadow-[0_12px_30px_rgba(18,215,181,0.35)] text-white">
          Settle up
        </Button>
      </div>
    </div>
  );
}
