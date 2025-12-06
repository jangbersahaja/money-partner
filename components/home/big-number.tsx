import { cn } from "@/lib/utils";

interface BigNumberProps {
  amount: number;
  label?: string;
  className?: string;
}

export const BigNumber = ({
  amount,
  label = "Safe to Spend Today",
  className,
}: BigNumberProps) => {
  const isPositive = amount >= 0;
  const isNegative = amount < 0;

  return (
    <div className={cn("rounded-xl p-6", className)}>
      <p className="text-sm text-slate-400 mb-2">{label}</p>
      <p
        className={cn(
          "text-5xl font-bold",
          isPositive && "text-emerald-500",
          isNegative && "text-red-500"
        )}
      >
        RM{" "}
        {Math.abs(amount).toLocaleString("en-MY", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>
      {isNegative && (
        <p className="text-sm text-red-400 mt-2">
          You're over budget. Review your expenses.
        </p>
      )}
    </div>
  );
};
