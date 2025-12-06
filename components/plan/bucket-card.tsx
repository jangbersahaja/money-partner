import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Database } from "@/lib/supabase/database.types";

type Bucket = Database["public"]["Tables"]["buckets"]["Row"];

export const BucketCard = ({ bucket }: { bucket: Bucket }) => {
  const percentage = Math.min(
    100,
    Math.max(0, (bucket.current_amount / bucket.target_amount) * 100)
  );

  return (
    <Card className="p-4 flex flex-col justify-between h-full">
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-slate-900">{bucket.name}</h3>
          <span className="text-xs text-slate-500">
            Target: RM {bucket.target_amount.toLocaleString("en-MY")}
          </span>
        </div>

        <Progress value={percentage} className="h-2 mb-2" />
      </div>

      <div className="mt-2">
        <p className="text-sm text-slate-500">Saved so far</p>
        <p className="text-2xl font-bold text-blue-600">
          RM {bucket.current_amount.toLocaleString("en-MY")}
        </p>
      </div>
    </Card>
  );
};
