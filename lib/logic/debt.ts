/**
 * Logic for Rule of 78 (Hire Purchase / Car Loans)
 * 
 * Formula for Rebate:
 * R = [ n(n+1) / N(N+1) ] * I
 * 
 * Where:
 * R = Rebate (Interest saved)
 * n = Remaining tenure in months
 * N = Original tenure in months
 * I = Total Interest payable over the whole tenure
 */

export function calculateRuleOf78(
  principal: number,
  flatInterestRate: number, // Annual Rate (e.g. 3.5 for 3.5%)
  tenureMonths: number,
  monthsPaid: number
) {
  // 1. Calculate Total Interest
  // Total Interest = Principal * (Rate/100) * (Tenure/12)
  const totalInterest = principal * (flatInterestRate / 100) * (tenureMonths / 12);
  const totalAmount = principal + totalInterest;
  const monthlyInstallment = totalAmount / tenureMonths;

  // 2. Remaining Months (n)
  const monthsRemaining = Math.max(0, tenureMonths - monthsPaid);

  // 3. Calculate Rebate
  // Denominator: Sum of digits for original tenure = N(N+1)
  const denominator = tenureMonths * (tenureMonths + 1);
  
  // Numerator: Sum of digits for remaining tenure = n(n+1)
  const numerator = monthsRemaining * (monthsRemaining + 1);

  const rebate = (numerator / denominator) * totalInterest;

  // 4. Settlement Amount
  // Settlement = (Monthly Installment * monthsRemaining) - Rebate
  // Wait, standard settlement formula is:
  // Settlement = (Balance Pending via Installments) - Rebate
  // Balance Pending = MonthlyInstallment * monthsRemaining (Assuming up to date)
  // But strictly: Settlement = OriginalLoan + TotalInterest - TotalPaid - Rebate
  // Use simplified:
  const balanceToPay = monthlyInstallment * monthsRemaining;
  const settlementAmount = balanceToPay - rebate;

  return {
    totalInterest,
    monthlyInstallment,
    rebate,
    settlementAmount,
    monthsRemaining
  };
}

/**
 * Logic for Credit Card Interest
 * 
 * Estimate next month's interest if only minimum is paid.
 * Daily Interest = Balance * (Rate / 365)
 * Monthly ~ Balance * (Rate / 12)
 */
export function calculateCreditCardInterest(
  currentBalance: number,
  annualRate: number = 15 // Default 15% or 18%
) {
  const monthlyRate = annualRate / 100 / 12;
  const estimatedInterest = currentBalance * monthlyRate;
  
  // Min Payment: Usually 5% of balance or RM50
  const minPayment = Math.max(50, currentBalance * 0.05);

  return {
    estimatedInterest,
    minPayment
  };
}
