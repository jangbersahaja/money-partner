import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { RecentTransaction } from "@/lib/actions/home";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ArrowDownRight, ArrowRightLeft, ArrowUpRight } from "lucide-react";

interface FeedListProps {
  transactions: RecentTransaction[];
}

export const FeedList = ({ transactions }: FeedListProps) => {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p className="text-sm">No transactions yet.</p>
        <p className="text-xs mt-1">Start tracking by adding an account.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <Card key={transaction.id} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div
                className={cn(
                  "rounded-full p-2 mt-0.5",
                  transaction.type === "income" && "bg-emerald-100",
                  transaction.type === "expense" && "bg-red-100",
                  transaction.type === "transfer" && "bg-slate-100"
                )}
              >
                {transaction.type === "income" && (
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                )}
                {transaction.type === "expense" && (
                  <ArrowDownRight className="w-4 h-4 text-red-600" />
                )}
                {transaction.type === "transfer" && (
                  <ArrowRightLeft className="w-4 h-4 text-slate-600" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">
                  {transaction.category || "Uncategorized"}
                </p>
                {transaction.description && (
                  <p className="text-sm text-slate-500 truncate">
                    {transaction.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-slate-400">
                    {transaction.account_name}
                  </p>
                  <span className="text-xs text-slate-300">•</span>
                  <p className="text-xs text-slate-400">
                    {format(new Date(transaction.date), "dd MMM")}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p
                className={cn(
                  "font-semibold",
                  transaction.type === "income" && "text-emerald-600",
                  transaction.type === "expense" && "text-red-600",
                  transaction.type === "transfer" && "text-slate-600"
                )}
              >
                {transaction.type === "expense" && "-"}
                {transaction.type === "income" && "+"}
                RM{" "}
                {Math.abs(transaction.amount).toLocaleString("en-MY", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export const FeedListSkeleton = () => {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-5 w-20" />
          </div>
        </Card>
      ))}
    </div>
  );
};
