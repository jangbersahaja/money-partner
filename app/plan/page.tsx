import { AddPlanSheet } from "@/components/plan/add-plan-sheet"; // Updated import
import { BillRow } from "@/components/plan/bill-row";
import { BucketCard } from "@/components/plan/bucket-card";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPlanData } from "@/lib/actions/plan";
import { Suspense } from "react";

// ... PlanContent function remains same ...
async function PlanContent() {
  const { bills, buckets, totalMonthlyCommitments } = await getPlanData();

  return (
    <Tabs defaultValue="bills" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="bills">Bills</TabsTrigger>
        <TabsTrigger value="goals">Goals (Buckets)</TabsTrigger>
      </TabsList>

      <TabsContent value="bills" className="space-y-4">
        <Card className="p-6 bg-slate-900 text-white">
          <p className="text-sm text-slate-400 mb-1">
            Total Monthly Commitments
          </p>
          <p className="text-3xl font-bold">
            RM {totalMonthlyCommitments.toLocaleString("en-MY")}
          </p>
        </Card>

        <div className="space-y-3 pb-24">
          {bills.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              No recurring bills added.
            </p>
          ) : (
            bills.map((bill) => <BillRow key={bill.id} bill={bill} />)
          )}
        </div>
      </TabsContent>

      <TabsContent value="goals">
        <div className="grid grid-cols-1 gap-4 pb-24">
          {buckets.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              No sinking funds created.
            </p>
          ) : (
            buckets.map((bucket) => (
              <BucketCard key={bucket.id} bucket={bucket} />
            ))
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}

function PlanSkeleton() {
  return <div className="p-4 text-slate-400">Loading plan...</div>;
}

export default function PlanPage() {
  return (
    <div className="p-4">
      {/* Header with Side-by-Side Title and Button */}
      <header className="pt-4 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Plan</h1>
          <p className="text-sm text-slate-600">Bills & Sinking Funds</p>
        </div>

        {/* Button Moved Here */}
        <AddPlanSheet />
      </header>

      <Suspense fallback={<PlanSkeleton />}>
        <PlanContent />
      </Suspense>
    </div>
  );
}
