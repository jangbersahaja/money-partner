import { Card } from "@/components/ui/card";
import type { AccountWithDebt } from "@/lib/actions/accounts";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";

interface AccountCardProps {
  account: AccountWithDebt;
}

export const AccountCard = ({ account }: AccountCardProps) => {
  const isAsset = ["bank", "cash", "ewallet", "investment"].includes(
    account.type
  );
  const isLiability = ["credit", "loan"].includes(account.type);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      bank: "Bank",
      cash: "Cash",
      ewallet: "E-Wallet",
      investment: "Investment",
      credit: "Credit Card",
      loan: "Loan",
    };
    return labels[type] || type;
  };

  const getTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      bank: "bg-blue-100 text-blue-700",
      cash: "bg-green-100 text-green-700",
      ewallet: "bg-purple-100 text-purple-700",
      investment: "bg-indigo-100 text-indigo-700",
      credit: "bg-red-100 text-red-700",
      loan: "bg-orange-100 text-orange-700",
    };
    return colors[type] || "bg-slate-100 text-slate-700";
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 truncate">
              {account.name}
            </h3>
            {account.is_shared && (
              <Users className="w-4 h-4 text-slate-400 shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                getTypeBadgeColor(account.type)
              )}
            >
              {getTypeLabel(account.type)}
            </span>
            {!account.is_liquid && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
                Not Liquid
              </span>
            )}
          </div>
          {account.debts && (
            <div className="mt-2 text-xs text-slate-500">
              Interest: {account.debts.interest_rate}%
              {account.debts.due_day && ` • Due: ${account.debts.due_day}th`}
            </div>
          )}
        </div>

        <div className="text-right ml-3">
          <p
            className={cn(
              "text-xl font-bold",
              isAsset && "text-emerald-600",
              isLiability && "text-red-600"
            )}
          >
            {isLiability && "-"}RM{" "}
            {Math.abs(account.balance).toLocaleString("en-MY", {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>
    </Card>
  );
};
