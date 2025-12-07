-- Create recurring_rules table safely
create table if not exists recurring_rules (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  amount numeric(12, 2) default 0 not null,
  category text, -- Can classify bills (Rent, Utilities)
  frequency text default 'monthly', -- monthly, yearly, weekly
  next_due_date timestamptz not null,
  is_active boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Index for recurring_rules
create index if not exists recurring_rules_owner_id_idx on recurring_rules(owner_id);
create index if not exists recurring_rules_next_due_date_idx on recurring_rules(next_due_date);

-- Enable RLS for recurring_rules
alter table recurring_rules enable row level security;

-- recurring_rules policies (Drop first to ensure update)
drop policy if exists "Users can view own rules" on recurring_rules;
create policy "Users can view own rules"
  on recurring_rules for select
  using (owner_id = auth.uid());

drop policy if exists "Users can view household rules" on recurring_rules;
create policy "Users can view household rules"
  on recurring_rules for select
  using (
    owner_id in (
      select id from profiles
      where household_id = (
        select household_id from profiles where id = auth.uid()
      )
    )
  );

drop policy if exists "Users can manage own rules" on recurring_rules;
create policy "Users can manage own rules"
  on recurring_rules for all
  using (owner_id = auth.uid());

-- Trigger for updated_at
drop trigger if exists update_recurring_rules_updated_at on recurring_rules;
create trigger update_recurring_rules_updated_at before update on recurring_rules
  for each row execute function update_updated_at_column();

-- Add pay_day to profiles safely
alter table profiles add column if not exists pay_day integer check (pay_day >= 1 and pay_day <= 31) default 25;
