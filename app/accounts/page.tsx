import { AccountCard } from "@/components/accounts/account-card";
import { AddAccountSheet } from "@/components/accounts/add-account-sheet";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getAccountsData } from "@/lib/actions/accounts";
import { Suspense } from "react";

async function AccountsContent() {
  const { assets, liabilities, netWorth } = await getAccountsData();

  return (
    <>
      {/* Net Worth Card */}
      <Card className="p-6 bg-slate-900 text-white">
        <p className="text-sm text-slate-400 mb-2">Net Worth</p>
        <p className="text-4xl font-bold">
          RM{" "}
          {netWorth.toLocaleString("en-MY", {
            minimumFractionDigits: 2,
          })}
        </p>
        <div className="flex gap-4 mt-4 text-sm">
          <div>
            <p className="text-slate-400">Assets</p>
            <p className="font-semibold text-emerald-400">
              RM{" "}
              {assets
                .reduce((sum, acc) => sum + acc.balance, 0)
                .toLocaleString("en-MY", { minimumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Liabilities</p>
            <p className="font-semibold text-red-400">
              RM{" "}
              {liabilities
                .reduce((sum, acc) => sum + Math.abs(acc.balance), 0)
                .toLocaleString("en-MY", { minimumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </Card>

      {/* Assets Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Cash & Assets</h2>
        {assets.length === 0 ? (
          <Card className="p-6 text-center text-slate-500">
            <p className="text-sm">No asset accounts yet</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {assets.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Liabilities Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Debts & Liabilities
        </h2>
        {liabilities.length === 0 ? (
          <Card className="p-6 text-center text-slate-500">
            <p className="text-sm">No debt accounts</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {liabilities.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        )}
      </div>

      {/* Add Account Button */}
      <AddAccountSheet />
    </>
  );
}

function AccountsSkeleton() {
  return (
    <>
      <Card className="p-6">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-10 w-40" />
        <div className="flex gap-4 mt-4">
          <div>
            <Skeleton className="h-3 w-16 mb-1" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div>
            <Skeleton className="h-3 w-16 mb-1" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-6 w-24" />
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

export default function AccountsPage() {
  return (
    <div className="p-4">
      <header className="pt-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Accounts</h1>
        <p className="text-sm text-slate-600">Manage your money locations</p>
      </header>

      <div className="flex flex-col gap-6">
        <Suspense fallback={<AccountsSkeleton />}>
          <AccountsContent />
        </Suspense>
      </div>
    </div>
  );
}
