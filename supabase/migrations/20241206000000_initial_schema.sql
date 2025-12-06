-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create enums
create type account_type as enum ('bank', 'cash', 'ewallet', 'credit', 'loan', 'investment');
create type transaction_type as enum ('income', 'expense', 'transfer');
create type interest_type as enum ('reducing_balance', 'flat_rate', 'none');

-- =====================================================
-- PROFILES TABLE
-- =====================================================
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  household_id uuid,
  username text not null,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Create index for household_id lookups
create index profiles_household_id_idx on profiles(household_id);

-- =====================================================
-- ACCOUNTS TABLE
-- =====================================================
create table accounts (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  type account_type not null,
  balance numeric(12, 2) default 0 not null,
  is_liquid boolean default true not null,
  is_shared boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Create indexes
create index accounts_owner_id_idx on accounts(owner_id);
create index accounts_type_idx on accounts(type);
create index accounts_is_liquid_idx on accounts(is_liquid);

-- =====================================================
-- TRANSACTIONS TABLE
-- =====================================================
create table transactions (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references accounts(id) on delete cascade,
  amount numeric(12, 2) not null,
  category text,
  description text,
  date timestamptz default now() not null,
  type transaction_type not null,
  is_debt_payment boolean default false not null,
  linked_transaction_id uuid references transactions(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Create indexes
create index transactions_account_id_idx on transactions(account_id);
create index transactions_date_idx on transactions(date desc);
create index transactions_type_idx on transactions(type);
create index transactions_category_idx on transactions(category);
create index transactions_linked_transaction_id_idx on transactions(linked_transaction_id);

-- =====================================================
-- DEBTS TABLE (Extension of Accounts)
-- =====================================================
create table debts (
  account_id uuid primary key references accounts(id) on delete cascade,
  interest_rate numeric(5, 2) default 0 not null,
  interest_type interest_type default 'none' not null,
  min_payment_amount numeric(12, 2),
  due_day integer check (due_day >= 1 and due_day <= 31),
  start_date date,
  tenure_months integer,
  original_amount numeric(12, 2),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Create index
create index debts_account_id_idx on debts(account_id);

-- =====================================================
-- BUCKETS TABLE (Sinking Funds)
-- =====================================================
create table buckets (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null,
  name text not null,
  target_amount numeric(12, 2) not null,
  current_amount numeric(12, 2) default 0 not null,
  target_date date,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Create index
create index buckets_household_id_idx on buckets(household_id);

-- =====================================================
-- CATEGORIES TABLE (Malaysian Specific)
-- =====================================================
create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  type transaction_type not null,
  icon text,
  color text,
  is_default boolean default false not null,
  created_at timestamptz default now() not null
);

-- Create index
create index categories_type_idx on categories(type);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
alter table profiles enable row level security;
alter table accounts enable row level security;
alter table transactions enable row level security;
alter table debts enable row level security;
alter table buckets enable row level security;
alter table categories enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can view household members"
  on profiles for select
  using (
    household_id in (
      select household_id from profiles where id = auth.uid()
    )
  );

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Accounts policies
create policy "Users can view own accounts"
  on accounts for select
  using (owner_id = auth.uid());

create policy "Users can view shared household accounts"
  on accounts for select
  using (
    is_shared = true and
    owner_id in (
      select id from profiles
      where household_id = (
        select household_id from profiles where id = auth.uid()
      )
    )
  );

create policy "Users can manage own accounts"
  on accounts for all
  using (owner_id = auth.uid());

-- Transactions policies
create policy "Users can view own transactions"
  on transactions for select
  using (
    account_id in (
      select id from accounts where owner_id = auth.uid()
    )
  );

create policy "Users can view shared account transactions"
  on transactions for select
  using (
    account_id in (
      select id from accounts
      where is_shared = true and owner_id in (
        select id from profiles
        where household_id = (
          select household_id from profiles where id = auth.uid()
        )
      )
    )
  );

create policy "Users can manage own transactions"
  on transactions for all
  using (
    account_id in (
      select id from accounts where owner_id = auth.uid()
    )
  );

-- Debts policies
create policy "Users can view own debts"
  on debts for select
  using (
    account_id in (
      select id from accounts where owner_id = auth.uid()
    )
  );

create policy "Users can view shared household debts"
  on debts for select
  using (
    account_id in (
      select id from accounts
      where is_shared = true and owner_id in (
        select id from profiles
        where household_id = (
          select household_id from profiles where id = auth.uid()
        )
      )
    )
  );

create policy "Users can manage own debts"
  on debts for all
  using (
    account_id in (
      select id from accounts where owner_id = auth.uid()
    )
  );

-- Buckets policies
create policy "Users can view household buckets"
  on buckets for select
  using (
    household_id = (
      select household_id from profiles where id = auth.uid()
    )
  );

create policy "Users can manage household buckets"
  on buckets for all
  using (
    household_id = (
      select household_id from profiles where id = auth.uid()
    )
  );

-- Categories policies (read-only for users)
create policy "Anyone can view categories"
  on categories for select
  using (true);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger update_profiles_updated_at before update on profiles
  for each row execute function update_updated_at_column();

create trigger update_accounts_updated_at before update on accounts
  for each row execute function update_updated_at_column();

create trigger update_transactions_updated_at before update on transactions
  for each row execute function update_updated_at_column();

create trigger update_debts_updated_at before update on debts
  for each row execute function update_updated_at_column();

create trigger update_buckets_updated_at before update on buckets
  for each row execute function update_updated_at_column();

-- Function to handle new user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, household_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.id -- User becomes their own household initially
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =====================================================
-- SEED DATA: Malaysian Categories
-- =====================================================

insert into categories (name, type, icon, color, is_default) values
-- Transport
('Grab', 'expense', 'car', '#10B981', true),
('Petrol', 'expense', 'fuel', '#EF4444', true),
('Toll', 'expense', 'highway', '#F59E0B', true),
('Parking', 'expense', 'parking-square', '#6B7280', true),

-- Food
('Mamak', 'expense', 'utensils', '#F97316', true),
('Groceries', 'expense', 'shopping-cart', '#8B5CF6', true),
('Foodpanda', 'expense', 'bike', '#EC4899', true),
('GrabFood', 'expense', 'utensils', '#10B981', true),

-- Bills
('TNB', 'expense', 'zap', '#FACC15', true),
('Water Bill', 'expense', 'droplet', '#3B82F6', true),
('Internet', 'expense', 'wifi', '#6366F1', true),
('Mobile', 'expense', 'smartphone', '#8B5CF6', true),

-- Debts
('PTPTN', 'expense', 'graduation-cap', '#EF4444', true),
('Credit Card', 'expense', 'credit-card', '#DC2626', true),
('Car Loan', 'expense', 'car', '#F59E0B', true),
('BNPL', 'expense', 'wallet', '#EC4899', true),

-- Income
('Salary', 'income', 'briefcase', '#10B981', true),
('Bonus', 'income', 'gift', '#F59E0B', true),
('Side Income', 'income', 'dollar-sign', '#8B5CF6', true),

-- Others
('Entertainment', 'expense', 'film', '#EC4899', true),
('Healthcare', 'expense', 'heart-pulse', '#EF4444', true),
('Shopping', 'expense', 'shopping-bag', '#F97316', true),
('Transfer', 'transfer', 'arrow-right-left', '#6B7280', true);
