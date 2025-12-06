"use client";

import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DebtAccount } from "@/lib/actions/debt";
import { Target, TrendingDown } from "lucide-react";
import { useMemo, useState } from "react";

interface DebtSimulatorProps {
  initialDebts: DebtAccount[];
}

interface SimulationResult {
  totalMonths: number;
  totalInterestPaid: number;
  priorityOrder: {
    id: string;
    name: string;
    balance: number;
    interestRate: number;
    minPayment: number;
    isFocus: boolean;
  }[];
}

export const DebtSimulator = ({ initialDebts }: DebtSimulatorProps) => {
  const [strategy, setStrategy] = useState<"snowball" | "avalanche">(
    "avalanche"
  );
  const [extraPayment, setExtraPayment] = useState(0);

  const simulation = useMemo<SimulationResult>(() => {
    if (initialDebts.length === 0) {
      return {
        totalMonths: 0,
        totalInterestPaid: 0,
        priorityOrder: [],
      };
    }

    // Clone debts for simulation
    const debts = initialDebts.map((d) => ({
      id: d.id,
      name: d.name,
      balance: Math.abs(d.balance), // Debts are negative balances
      interestRate: d.debt.interest_rate,
      interestType: d.debt.interest_type,
      minPayment:
        d.debt.min_payment_amount || Math.max(Math.abs(d.balance) * 0.05, 50), // Default: 5% or RM50
    }));

    // Sort based on strategy
    const sortedDebts =
      strategy === "snowball"
        ? [...debts].sort((a, b) => a.balance - b.balance) // Smallest balance first
        : [...debts].sort((a, b) => b.interestRate - a.interestRate); // Highest rate first

    // Month-by-month simulation
    let month = 0;
    let totalInterest = 0;
    const MAX_MONTHS = 360; // 30 years safety limit

    while (month < MAX_MONTHS) {
      month++;
      let hasActiveDebt = false;

      // Step 1: Apply interest and minimum payments
      for (const debt of sortedDebts) {
        if (debt.balance <= 0) continue;

        hasActiveDebt = true;

        // Add monthly interest for reducing balance (credit cards)
        if (debt.interestType === "reducing_balance") {
          const monthlyInterest = (debt.balance * debt.interestRate) / 100 / 12;
          debt.balance += monthlyInterest;
          totalInterest += monthlyInterest;
        }

        // Deduct minimum payment
        const payment = Math.min(debt.minPayment, debt.balance);
        debt.balance -= payment;
      }

      // Step 2: Apply extra payment to the focus debt (first active debt in sorted list)
      if (extraPayment > 0) {
        const focusDebt = sortedDebts.find((d) => d.balance > 0);
        if (focusDebt) {
          const extraApplied = Math.min(extraPayment, focusDebt.balance);
          focusDebt.balance -= extraApplied;
        }
      }

      // Stop if all debts are paid off
      if (!hasActiveDebt) break;
    }

    // Build priority order with focus marker
    const priorityOrder = sortedDebts.map((debt, index) => ({
      id: debt.id,
      name: debt.name,
      balance: Math.abs(
        initialDebts.find((d) => d.id === debt.id)?.balance || 0
      ),
      interestRate: debt.interestRate,
      minPayment: debt.minPayment,
      isFocus: index === 0, // First debt is the focus
    }));

    return {
      totalMonths: month,
      totalInterestPaid: totalInterest,
      priorityOrder,
    };
  }, [initialDebts, strategy, extraPayment]);

  if (initialDebts.length === 0) {
    return (
      <Card className="p-6 text-center text-slate-500">
        <p>No debts found</p>
        <p className="text-sm mt-1">You&apos;re debt-free! 🎉</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Strategy Controls */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">
          Payoff Strategy
        </h3>
        <Tabs
          value={strategy}
          onValueChange={(v) => setStrategy(v as "snowball" | "avalanche")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="avalanche">
              <TrendingDown className="w-4 h-4 mr-2" />
              Avalanche
            </TabsTrigger>
            <TabsTrigger value="snowball">
              <Target className="w-4 h-4 mr-2" />
              Snowball
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="text-xs text-slate-500">
          {strategy === "avalanche"
            ? "Pay off highest interest rate first (saves money)"
            : "Pay off smallest balance first (quick wins)"}
        </p>
      </div>

      {/* Extra Payment Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">
            Extra Monthly Payment
          </h3>
          <span className="text-lg font-bold text-blue-600">
            RM {extraPayment}
          </span>
        </div>
        <Slider
          value={[extraPayment]}
          onValueChange={(values) => setExtraPayment(values[0])}
          max={2000}
          step={50}
          className="w-full"
        />
        <p className="text-xs text-slate-500">
          Additional RM0 - RM2,000 per month
        </p>
      </div>

      {/* Hero Card: Debt Free Timeline */}
      <Card className="p-6 bg-linear-to-br from-blue-50 to-slate-50 border-blue-200">
        <div className="text-center space-y-3">
          <p className="text-sm text-slate-600">Debt Free In</p>
          <div className="space-y-1">
            <p className="text-5xl font-bold text-blue-600">
              {simulation.totalMonths}
            </p>
            <p className="text-sm text-slate-600">
              {simulation.totalMonths === 1 ? "month" : "months"}
            </p>
          </div>
          <div className="pt-3 border-t border-blue-200">
            <p className="text-xs text-slate-500">Total Interest Paid</p>
            <p className="text-2xl font-bold text-red-600">
              RM{" "}
              {simulation.totalInterestPaid.toLocaleString("en-MY", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      </Card>

      {/* Priority List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">
          Payoff Priority Order
        </h3>
        <div className="space-y-3">
          {simulation.priorityOrder.map((debt, index) => (
            <Card
              key={debt.id}
              className={`p-4 ${
                debt.isFocus
                  ? "border-2 border-blue-600 bg-blue-50"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Priority Number */}
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${
                    debt.isFocus
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <span className="text-lg font-bold">{index + 1}</span>
                </div>

                {/* Debt Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-900 truncate">
                      {debt.name}
                    </h4>
                    {debt.isFocus && (
                      <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                        FOCUS
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span>
                      RM{" "}
                      {debt.balance.toLocaleString("en-MY", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    <span>•</span>
                    <span>{debt.interestRate.toFixed(2)}% p.a.</span>
                    <span>•</span>
                    <span>
                      Min: RM{" "}
                      {debt.minPayment.toLocaleString("en-MY", {
                        minimumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Strategy Tips */}
      <Card className="p-4 bg-slate-50 border-slate-200">
        <h4 className="text-sm font-semibold text-slate-900 mb-2">
          💡 Strategy Tips
        </h4>
        <ul className="text-xs text-slate-600 space-y-1">
          <li>
            • Pay minimum on all debts, then attack the{" "}
            <span className="font-semibold">FOCUS</span> debt
          </li>
          <li>• Even RM50 extra per month can save thousands in interest</li>
          <li>• Switch strategies anytime to see what works best for you</li>
        </ul>
      </Card>
    </div>
  );
};
