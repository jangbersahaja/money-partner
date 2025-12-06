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
import { Switch } from "@/components/ui/switch";
import { createAccount, type CreateAccountInput } from "@/lib/actions/accounts";
import type { Database } from "@/lib/supabase/database.types";
import { Plus } from "lucide-react";
import { useState } from "react";

type AccountType = Database["public"]["Enums"]["account_type"];

export const AddAccountSheet = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "bank" as AccountType,
    balance: "",
    isLiquid: true,
    isShared: false,
    interestRate: "",
    creditLimit: "",
    dueDay: "",
  });

  const isDebtAccount = ["loan", "credit"].includes(formData.type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.balance) {
      return;
    }

    setLoading(true);

    const isDebt = ["loan", "credit"].includes(formData.type);
    const rawBalance = parseFloat(formData.balance);

    const input: CreateAccountInput = {
      name: formData.name,
      type: formData.type,
      // If it's a debt, force it to be negative. If asset, keep positive.
      balance: isDebt ? -Math.abs(rawBalance) : Math.abs(rawBalance),
      isLiquid: formData.isLiquid,
      isShared: formData.isShared,
      interestRate: formData.interestRate
        ? parseFloat(formData.interestRate)
        : undefined,
      creditLimit: formData.creditLimit
        ? parseFloat(formData.creditLimit)
        : undefined,
      dueDay: formData.dueDay ? parseInt(formData.dueDay) : undefined,
    };

    const result = await createAccount(input);

    setLoading(false);

    if (result.error) {
      alert(result.error);
      return;
    }

    // Reset form and close
    setFormData({
      name: "",
      type: "bank",
      balance: "",
      isLiquid: true,
      isShared: false,
      interestRate: "",
      creditLimit: "",
      dueDay: "",
    });
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Account
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add New Account</SheetTitle>
          <SheetDescription>
            Create a new account to track your money
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Name */}
          <div>
            <Label htmlFor="name">Account Name</Label>
            <Input
              id="name"
              placeholder="e.g., Maybank Savings"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="mt-2"
              required
            />
          </div>

          {/* Type */}
          <div>
            <Label htmlFor="type">Account Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: AccountType) =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger id="type" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank">Bank Account</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="ewallet">E-Wallet (TNG/Grab)</SelectItem>
                <SelectItem value="investment">Investment (ASB/EPF)</SelectItem>
                <SelectItem value="credit">Credit Card</SelectItem>
                <SelectItem value="loan">Loan (Car/PTPTN)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Balance */}
          <div>
            <Label htmlFor="balance">
              {isDebtAccount ? "Outstanding Balance" : "Initial Balance"} (RM)
            </Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.balance}
              onChange={(e) =>
                setFormData({ ...formData, balance: e.target.value })
              }
              className="mt-2"
              required
            />
            {isDebtAccount && (
              <p className="text-xs text-slate-500 mt-1">
                Enter as a positive number (e.g., 5000 for RM5,000 debt)
              </p>
            )}
          </div>

          {/* Debt-specific fields */}
          {isDebtAccount && (
            <>
              <div>
                <Label htmlFor="interestRate">Interest Rate (%)</Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 15.00"
                  value={formData.interestRate}
                  onChange={(e) =>
                    setFormData({ ...formData, interestRate: e.target.value })
                  }
                  className="mt-2"
                />
              </div>

              {formData.type === "credit" && (
                <div>
                  <Label htmlFor="creditLimit">Credit Limit (RM)</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 10000"
                    value={formData.creditLimit}
                    onChange={(e) =>
                      setFormData({ ...formData, creditLimit: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="dueDay">Payment Due Day</Label>
                <Input
                  id="dueDay"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="e.g., 25"
                  value={formData.dueDay}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDay: e.target.value })
                  }
                  className="mt-2"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Day of the month (1-31)
                </p>
              </div>
            </>
          )}

          {/* Is Liquid */}
          <div className="flex items-center justify-between py-2">
            <div>
              <Label htmlFor="isLiquid">Liquid Account</Label>
              <p className="text-xs text-slate-500 mt-1">
                Include in &ldquo;Safe to Spend&rdquo; calculation
              </p>
            </div>
            <Switch
              id="isLiquid"
              checked={formData.isLiquid}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isLiquid: checked })
              }
            />
          </div>

          {/* Is Shared */}
          <div className="flex items-center justify-between py-2">
            <div>
              <Label htmlFor="isShared">Shared Account</Label>
              <p className="text-xs text-slate-500 mt-1">
                Visible to household partner
              </p>
            </div>
            <Switch
              id="isShared"
              checked={formData.isShared}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isShared: checked })
              }
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name || !formData.balance}
              className="flex-1"
            >
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};
