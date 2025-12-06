# Project Context: Malaysian Financial Co-Pilot (PWA)

## 1. Project Vision

A mobile-first, "Anti-Dashboard" money management Progressive Web App (PWA) designed specifically for Malaysian households.

- **Core Goal:** Shift from "Tracking" to "Actionable Advice". Answer "How much can I spend today?" and "How do I kill my debt?"
- **Key Behavior:** Users enter data quickly (mobile). The app handles complex logic (Rule of 78, BNPL fees, Splitwise-style partner transfers).
- **Target Audience:** Malaysian couples/individuals managing debt (PTPTN, Car Loans, Credit Cards).

## 2. Tech Stack (Strict Constraints)

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand (Client state) + React Query (Server state)
- **Icons:** Lucide React
- **PWA:** `next-pwa` configuration for "Add to Home Screen" capability.

## 3. Domain Logic & Rules (Malaysian Context)

### A. The "Safe to Spend" Algorithm

The Home Screen shows **ONE** large number.
**Formula:**
SafeSpend = (Sum of "Liquid" Asset Accounts) - (Sum of Bills due before next Salary Date) - (Sum of Sinking Fund Bucket Targets)

- _Note:_ Investments (ASB, Tabung Haji, EPF) are Assets, but must be marked `is_liquid = false`. They are excluded from this calculation.

### B. Account & Transfer Logic (Double-Entry Lite)

To support "Money in TNG" vs "Money in Bank", we use specific Account Types:

1. **Account Types:**
   - `Asset`: Cash, Bank (Maybank/CIMB/Public), E-Wallet (TNG/Grab/ShopeePay).
   - `Liability`: Credit Card, BNPL, Loan (Car/PTPTN/Mortgage).
2. **Partner Transfers:**
   - When User A transfers RM100 to User B (Partner):
     - Create Transaction 1: `Account A` -> Type `Transfer_Out` (-100).
     - Create Transaction 2: `Account B` -> Type `Transfer_In` (+100).
   - _Result:_ Household Net Worth change is 0. Individual "Safe to Spend" updates reflecting reality.

### C. The Debt Engine (Malaysian Specifics)

1. **Credit Cards:**
   - Calculate `Minimum Payment`: Max(5% of Balance, RM50).
   - Warning System: If user pays minimum, calculate & display "Interest Cost Next Month" (approx 15-18% p.a.).
2. **Buy Now Pay Later (BNPL):**
   - Providers: SPayLater, GrabPayLater, Atome.
   - Logic: Treated as a **Debt** (Liability), not an expense.
   - Fees: Support "Processing Fee" addition (e.g., 1.5%/month) to the principal.
3. **Hire Purchase (Car Loans):**
   - **Rule of 78:** Implement the "Sum of Digits" formula to calculate the _Rebate_ and _Settlement Amount_ for early payoff.
   - _Input:_ Loan Amount, Flat Rate (%), Tenure (Months).
   - _Formula:_ `Rebate = (Total Interest) * [(Remaining Months * (Remaining Months + 1)) / (Original Months * (Original Months + 1))]`.

## 4. Database Schema Strategy (Supabase)

### `profiles`

- `id` (uuid, PK) - Matches Auth ID
- `household_id` (uuid, FK) - Links partners together.
- `username` (text)
- `avatar_url` (text)

### `accounts`

- `id` (uuid, PK)
- `owner_id` (uuid, FK) - Which partner owns this?
- `name` (text) - e.g., "Maybank Savings", "TNG eWallet".
- `type` (enum) - 'bank', 'cash', 'ewallet', 'credit', 'loan'.
- `balance` (numeric) - Current holding.
- `is_liquid` (bool) - True for spending accounts, False for ASB/EPF/Fixed Deposits.
- `is_shared` (bool) - If True, partner can see balance and transactions.

### `transactions`

- `id` (uuid, PK)
- `account_id` (uuid, FK)
- `amount` (numeric) - Negative for expense, Positive for income.
- `category` (text) - e.g., "Food", "Transport", "Toll".
- `description` (text)
- `date` (timestamptz)
- `type` (enum) - 'income', 'expense', 'transfer'.
- `is_debt_payment` (bool) - Helper to identify debt payoffs.

### `debts` (Extension of Accounts)

- `account_id` (uuid, FK)
- `interest_rate` (numeric)
- `interest_type` (enum) - 'reducing_balance' (Credit Card), 'flat_rate' (Car Loan).
- `min_payment_amount` (numeric)
- `due_day` (int) - Day of month (e.g., 25th).
- `start_date` (date) - Required for Loan tenure calculations.
- `tenure_months` (int) - For loans.

### `buckets` (Sinking Funds)

- `id` (uuid, PK)
- `household_id` (uuid, FK)
- `name` (text) - e.g., "Road Tax", "Emergency Fund".
- `target_amount` (numeric)
- `current_amount` (numeric)

## 5. UI/UX Guidelines (Mobile-First)

- **Navigation:** Bottom Tab Bar (Home, Accounts, Plan, Debt).
- **Input:** "Lazy Entry" via Floating Action Button (FAB).
- **Visuals:**
  - Avoid complex charts on Home. Use "Feed" cards.
  - Use `skeleton` loaders for Optimistic UI.
  - Color coded amounts: Green (Income), Red (Expense), Gray (Transfer).

## 6. Seed Data (Malaysian Categories)

- **Transport:** `Grab`, `Petrol (Shell/Petronas)`, `Toll (RFID/TNG)`, `Parking`.
- **Food:** `Mamak`, `Groceries (Jaya Grocer/Lotus/99Speedmart)`, `Foodpanda`, `GrabFood`.
- **Bills:** `TNB`, `Air Selangor`, `Indah Water`, `Unifi`, `Maxis/Celcom/Digi`.
- **Debts:** `PTPTN`, `Maybank Visa`, `CIMB MasterCard`, `Public Bank Car Loan`, `SPayLater`.
