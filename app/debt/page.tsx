import { DebtSimulator } from "@/components/debt/debt-simulator";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getDebtAccounts } from "@/lib/actions/debt";
import { PartyPopper } from "lucide-react";
import { Suspense } from "react";

export default function DebtPage() {
  return (
    // ADDED p-4 className here
    <div className="p-4">
      {/* Header with Side-by-Side Title and Button */}
      <header className="pt-4 mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Debt</h1>
        <p className="text-sm text-slate-600">Payoff Strategy & Timeline</p>
      </header>

      <Suspense fallback={<DebtSkeleton />}>
        <DebtContent />
      </Suspense>
    </div>
  );
}

async function DebtContent() {
  const debts = await getDebtAccounts();

  if (debts.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <PartyPopper className="w-10 h-10 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Debt Free!</h2>
            <p className="text-slate-600 mt-2">You have no outstanding debts</p>
          </div>
          <div className="pt-4 text-sm text-slate-500 space-y-1">
            <p>🎉 No credit card balances</p>
            <p>🎉 No loans to pay off</p>
            <p>🎉 Your money is truly yours</p>
          </div>
        </div>
      </Card>
    );
  }

  return <DebtSimulator initialDebts={debts} />;
}

function DebtSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-48 w-full" />
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}
