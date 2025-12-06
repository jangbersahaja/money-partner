import { BigNumber } from "@/components/home/big-number";
import { FeedList, FeedListSkeleton } from "@/components/home/feed-list";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getHomeData } from "@/lib/actions/home";
import { UserCircle } from "lucide-react"; // Import this icon
import Link from "next/link"; // Import Link
import { Suspense } from "react";

async function HomeContent() {
  const { safeToSpendData, recentTransactions } = await getHomeData();

  return (
    <>
      <BigNumber
        amount={safeToSpendData.safeToSpend}
        className="bg-slate-900 text-white"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <p className="text-xs text-slate-500 mb-1">Liquid Cash</p>
          <p className="text-sm font-semibold text-slate-900">
            RM{" "}
            {safeToSpendData.liquidCash.toLocaleString("en-MY", {
              minimumFractionDigits: 0,
            })}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-slate-500 mb-1">Bills Due</p>
          <p className="text-sm font-semibold text-red-600">
            RM{" "}
            {safeToSpendData.upcomingBills.toLocaleString("en-MY", {
              minimumFractionDigits: 0,
            })}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-slate-500 mb-1">Buckets</p>
          <p className="text-sm font-semibold text-blue-600">
            RM{" "}
            {safeToSpendData.sinkingFunds.toLocaleString("en-MY", {
              minimumFractionDigits: 0,
            })}
          </p>
        </Card>
      </div>

      {/* Recent Transactions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">
            Recent Activity
          </h2>
        </div>
        <FeedList transactions={recentTransactions} />
      </div>
    </>
  );
}

function HomeSkeleton() {
  return (
    <>
      <Card className="p-6">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-12 w-48" />
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-3">
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-4 w-full" />
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <FeedListSkeleton />
      </div>
    </>
  );
}

export default function Home() {
  return (
    <div className="p-4">
      <div className="flex flex-col gap-6">
        <header className="pt-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Money Partner</h1>
            <p className="text-sm text-slate-600">
              Your Malaysian Financial Co-Pilot
            </p>
          </div>

          {/* Add this Profile Link */}
          <Link href="/profile">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
              <UserCircle className="w-6 h-6 text-slate-600" />
            </div>
          </Link>
        </header>

        <Suspense fallback={<HomeSkeleton />}>
          <HomeContent />
        </Suspense>
      </div>
    </div>
  );
}
