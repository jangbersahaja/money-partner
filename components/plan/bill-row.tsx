import type { Database } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

type RecurringRule = Database["public"]["Tables"]["recurring_rules"]["Row"];

export const BillRow = ({ bill }: { bill: RecurringRule }) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 bg-white border rounded-lg",
        !bill.is_active && "opacity-50 grayscale"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Date Badge */}
        <div className="flex flex-col items-center justify-center w-10 h-10 bg-slate-100 rounded-md border border-slate-200">
          <span className="text-xs font-bold text-slate-700">
            {bill.due_day}
          </span>
          <span className="text-[9px] uppercase text-slate-400">Due</span>
        </div>

        {/* Details */}
        <div>
          <p className="font-semibold text-slate-900">{bill.name}</p>
          <p className="text-xs text-slate-500 capitalize">{bill.frequency}</p>
        </div>
      </div>

      {/* Amount */}
      <div className="text-right">
        <p className="font-bold text-slate-900">
          RM {bill.amount.toLocaleString("en-MY")}
        </p>
      </div>
    </div>
  );
};
