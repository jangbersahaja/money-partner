"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  createBill,
  createBucket,
  type CreateBillInput,
  type CreateBucketInput,
} from "@/lib/actions/plan";
import type { Database } from "@/lib/supabase/database.types";
import { Plus } from "lucide-react";
import { useState } from "react";

type FrequencyType = Database["public"]["Enums"]["frequency_type"];

export const AddPlanSheet = () => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"bill" | "bucket" | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states...
  const [billData, setBillData] = useState({
    name: "",
    amount: "",
    frequency: "monthly" as FrequencyType,
    dueDay: "",
  });

  const [bucketData, setBucketData] = useState({
    name: "",
    targetAmount: "",
    targetDate: "",
  });

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setMode(null);
      setBillData({ name: "", amount: "", frequency: "monthly", dueDay: "" });
      setBucketData({ name: "", targetAmount: "", targetDate: "" });
    }
  };

  // ... handleBillSubmit and handleBucketSubmit functions remain EXACTLY the same as before ...
  const handleBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const input: CreateBillInput = {
      name: billData.name,
      amount: parseFloat(billData.amount),
      frequency: billData.frequency,
      dueDay: parseInt(billData.dueDay),
    };
    const result = await createBill(input);
    setLoading(false);
    if (result.error) {
      alert(result.error);
      return;
    }
    handleOpenChange(false);
  };

  const handleBucketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const input: CreateBucketInput = {
      name: bucketData.name,
      targetAmount: parseFloat(bucketData.targetAmount),
      targetDate: bucketData.targetDate || undefined,
    };
    const result = await createBucket(input);
    setLoading(false);
    if (result.error) {
      alert(result.error);
      return;
    }
    handleOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      {/* TRIGGER CHANGED: Standard Button instead of Fixed FAB */}
      <SheetTrigger asChild>
        <Button
          size="sm"
          className="gap-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4" />
          Add New
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        {/* ... The rest of the Content (Mode selection, Forms) remains EXACTLY the same ... */}
        {!mode ? (
          <>
            <SheetHeader>
              <SheetTitle>Add to Plan</SheetTitle>
              <SheetDescription>Choose what you want to add</SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-3">
              <Button
                onClick={() => setMode("bill")}
                variant="outline"
                className="w-full h-20 text-left justify-start"
              >
                <div>
                  <p className="font-semibold text-base">Add Bill</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Recurring payment like TNB, rent, or subscriptions
                  </p>
                </div>
              </Button>

              <Button
                onClick={() => setMode("bucket")}
                variant="outline"
                className="w-full h-20 text-left justify-start"
              >
                <div>
                  <p className="font-semibold text-base">Add Bucket</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Sinking fund goal like Road Tax or Emergency Fund
                  </p>
                </div>
              </Button>
            </div>
          </>
        ) : mode === "bill" ? (
          <>
            <SheetHeader>
              <SheetTitle>Add Bill</SheetTitle>
              <SheetDescription>Create a recurring payment</SheetDescription>
            </SheetHeader>

            <form onSubmit={handleBillSubmit} className="mt-6 space-y-5">
              <div>
                <Label htmlFor="billName">Bill Name</Label>
                <Input
                  id="billName"
                  placeholder="e.g., TNB, Rent, Netflix"
                  value={billData.name}
                  onChange={(e) =>
                    setBillData({ ...billData, name: e.target.value })
                  }
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="billAmount">Amount (RM)</Label>
                <Input
                  id="billAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={billData.amount}
                  onChange={(e) =>
                    setBillData({ ...billData, amount: e.target.value })
                  }
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={billData.frequency}
                  onValueChange={(value: FrequencyType) =>
                    setBillData({ ...billData, frequency: value })
                  }
                >
                  <SelectTrigger id="frequency" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dueDay">Due Day</Label>
                <Input
                  id="dueDay"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="e.g., 25"
                  value={billData.dueDay}
                  onChange={(e) =>
                    setBillData({ ...billData, dueDay: e.target.value })
                  }
                  className="mt-2"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Day of the month (1-31)
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMode(null)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !billData.name || !billData.amount}
                  className="flex-1"
                >
                  {loading ? "Creating..." : "Create Bill"}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle>Add Bucket</SheetTitle>
              <SheetDescription>Create a sinking fund goal</SheetDescription>
            </SheetHeader>

            <form onSubmit={handleBucketSubmit} className="mt-6 space-y-5">
              <div>
                <Label htmlFor="bucketName">Bucket Name</Label>
                <Input
                  id="bucketName"
                  placeholder="e.g., Road Tax, Emergency Fund"
                  value={bucketData.name}
                  onChange={(e) =>
                    setBucketData({ ...bucketData, name: e.target.value })
                  }
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="targetAmount">Target Amount (RM)</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={bucketData.targetAmount}
                  onChange={(e) =>
                    setBucketData({
                      ...bucketData,
                      targetAmount: e.target.value,
                    })
                  }
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="targetDate">Target Date (Optional)</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={bucketData.targetDate}
                  onChange={(e) =>
                    setBucketData({
                      ...bucketData,
                      targetDate: e.target.value,
                    })
                  }
                  className="mt-2"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMode(null)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={
                    loading || !bucketData.name || !bucketData.targetAmount
                  }
                  className="flex-1"
                >
                  {loading ? "Creating..." : "Create Bucket"}
                </Button>
              </div>
            </form>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
