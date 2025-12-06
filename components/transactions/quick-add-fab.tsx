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
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  addTransaction,
  getExpenseCategories,
  getLiquidAccounts,
  getTransferAccounts,
  type AddTransactionInput,
} from "@/lib/actions/transaction";
import { cn } from "@/lib/utils";
import { ArrowLeftRight, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

export const QuickAddFAB = () => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"expense" | "income" | "transfer">(
    "expense"
  );
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [targetAccount, setTargetAccount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [liquidAccounts, setLiquidAccounts] = useState<Account[]>([]);
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (open) {
      // Fetch all required data
      Promise.all([
        getLiquidAccounts(),
        getTransferAccounts(),
        getExpenseCategories(),
      ]).then(([liquidData, allData, expenseCats]) => {
        setLiquidAccounts(liquidData);
        setAllAccounts(allData);
        setExpenseCategories(expenseCats);

        // Mock income categories (you can add this to actions later)
        setIncomeCategories([
          { id: "salary", name: "Salary", icon: null, color: null },
          { id: "bonus", name: "Bonus", icon: null, color: null },
          { id: "freelance", name: "Freelance", icon: null, color: null },
        ]);

        if (liquidData.length > 0) {
          setSelectedAccount(liquidData[0].id);
        }
      });
    }
  }, [open]);

  const handleReset = () => {
    setAmount("");
    setSelectedCategory("");
    setSelectedAccount("");
    setTargetAccount("");
    setDescription("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === "transfer") {
      if (!amount || !selectedAccount || !targetAccount) return;
      if (selectedAccount === targetAccount) {
        alert("Source and target accounts must be different");
        return;
      }
    } else {
      if (!amount || !selectedCategory || !selectedAccount) return;
    }

    setLoading(true);

    const input: AddTransactionInput = {
      amount: parseFloat(amount),
      category: selectedCategory || "Transfer",
      accountId: selectedAccount,
      description: description || undefined,
      type: activeTab,
      targetAccountId: activeTab === "transfer" ? targetAccount : undefined,
    };

    const result = await addTransaction(input);

    setLoading(false);

    if (result.error) {
      alert(result.error);
      return;
    }

    // Reset form and close
    handleReset();
    setOpen(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-20 left-0 right-0 flex justify-center z-40 pointer-events-none">
        <button
          onClick={() => setOpen(true)}
          className="w-14 h-14 bg-slate-900 text-white rounded-full shadow-lg hover:bg-slate-800 transition-colors flex items-center justify-center pointer-events-auto"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Sheet Drawer */}
      <Sheet
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) handleReset();
        }}
      >
        <SheetContent
          side="bottom"
          className="h-[90vh] overflow-y-auto px-4 pb-10"
        >
          <SheetHeader>
            <SheetTitle>Add Transaction</SheetTitle>
            <SheetDescription>Expense, Income, or Transfer</SheetDescription>
          </SheetHeader>

          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v as typeof activeTab);
              handleReset();
            }}
            className="mt-6"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="expense">
                <TrendingDown className="w-4 h-4 mr-1" />
                Expense
              </TabsTrigger>
              <TabsTrigger value="income">
                <TrendingUp className="w-4 h-4 mr-1" />
                Income
              </TabsTrigger>
              <TabsTrigger value="transfer">
                <ArrowLeftRight className="w-4 h-4 mr-1" />
                Transfer
              </TabsTrigger>
            </TabsList>

            {/* Expense Tab */}
            <TabsContent value="expense" className="mt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="expense-amount">Amount (RM)</Label>
                  <Input
                    id="expense-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-3xl h-16 text-center font-bold mt-2"
                    required
                  />
                </div>

                <div>
                  <Label>Category</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {expenseCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.name)}
                        className={cn(
                          "p-3 rounded-lg border-2 text-sm font-medium transition-colors",
                          selectedCategory === cat.name
                            ? "border-slate-900 bg-slate-100"
                            : "border-slate-200 hover:border-slate-300"
                        )}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="expense-account">Pay From</Label>
                  <Select
                    value={selectedAccount}
                    onValueChange={setSelectedAccount}
                  >
                    <SelectTrigger id="expense-account" className="mt-2">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {liquidAccounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name} (RM{" "}
                          {acc.balance.toLocaleString("en-MY", {
                            minimumFractionDigits: 2,
                          })}
                          )
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="expense-description">
                    Description (Optional)
                  </Label>
                  <Input
                    id="expense-description"
                    type="text"
                    placeholder="e.g., Lunch at mamak"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-2"
                  />
                </div>

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
                    disabled={loading || !amount || !selectedCategory}
                    className="flex-1"
                  >
                    {loading ? "Adding..." : "Add Expense"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Income Tab */}
            <TabsContent value="income" className="mt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="income-amount">Amount (RM)</Label>
                  <Input
                    id="income-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-3xl h-16 text-center font-bold mt-2"
                    required
                  />
                </div>

                <div>
                  <Label>Category</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {incomeCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.name)}
                        className={cn(
                          "p-3 rounded-lg border-2 text-sm font-medium transition-colors",
                          selectedCategory === cat.name
                            ? "border-green-600 bg-green-50"
                            : "border-slate-200 hover:border-slate-300"
                        )}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="income-account">Receive To</Label>
                  <Select
                    value={selectedAccount}
                    onValueChange={setSelectedAccount}
                  >
                    <SelectTrigger id="income-account" className="mt-2">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {liquidAccounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name} (RM{" "}
                          {acc.balance.toLocaleString("en-MY", {
                            minimumFractionDigits: 2,
                          })}
                          )
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="income-description">
                    Description (Optional)
                  </Label>
                  <Input
                    id="income-description"
                    type="text"
                    placeholder="e.g., December salary"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-2"
                  />
                </div>

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
                    disabled={loading || !amount || !selectedCategory}
                    className="flex-1"
                  >
                    {loading ? "Adding..." : "Add Income"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Transfer Tab */}
            <TabsContent value="transfer" className="mt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="transfer-amount">Amount (RM)</Label>
                  <Input
                    id="transfer-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-3xl h-16 text-center font-bold mt-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="transfer-from">From</Label>
                  <Select
                    value={selectedAccount}
                    onValueChange={setSelectedAccount}
                  >
                    <SelectTrigger id="transfer-from" className="mt-2">
                      <SelectValue placeholder="Select source account" />
                    </SelectTrigger>
                    <SelectContent>
                      {liquidAccounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name} (RM{" "}
                          {acc.balance.toLocaleString("en-MY", {
                            minimumFractionDigits: 2,
                          })}
                          )
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="transfer-to">To</Label>
                  <Select
                    value={targetAccount}
                    onValueChange={setTargetAccount}
                  >
                    <SelectTrigger id="transfer-to" className="mt-2">
                      <SelectValue placeholder="Select target account" />
                    </SelectTrigger>
                    <SelectContent>
                      {allAccounts.map((acc) => (
                        <SelectItem
                          key={acc.id}
                          value={acc.id}
                          disabled={acc.id === selectedAccount}
                        >
                          {acc.name} ({acc.type}) - RM{" "}
                          {acc.balance.toLocaleString("en-MY", {
                            minimumFractionDigits: 2,
                          })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 mt-2">
                    Transfer to any account, including loans/credit cards for
                    payments
                  </p>
                </div>

                <div>
                  <Label htmlFor="transfer-description">
                    Description (Optional)
                  </Label>
                  <Input
                    id="transfer-description"
                    type="text"
                    placeholder="e.g., Top up TNG"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-2"
                  />
                </div>

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
                    disabled={
                      loading || !amount || !selectedAccount || !targetAccount
                    }
                    className="flex-1"
                  >
                    {loading ? "Transferring..." : "Transfer"}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </>
  );
};
