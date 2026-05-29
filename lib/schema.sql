create table if not exists settings (
  id int primary key default 1,
  timezone text not null default 'UTC',
  constraint settings_singleton check (id = 1)
);
insert into settings (id, timezone) values (1, 'UTC') on conflict (id) do nothing;

create table if not exists medicines (
  id serial primary key,
  name text not null,
  type text not null check (type in ('interval', 'daily')),
  interval_hours numeric,
  daily_times text[],
  start_at timestamptz not null,
  end_at timestamptz,
  next_due_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists doses (
  id serial primary key,
  medicine_id int not null references medicines(id) on delete cascade,
  scheduled_at timestamptz not null,
  status text not null default 'due' check (status in ('due', 'taken', 'skipped')),
  taken_at timestamptz,
  created_at timestamptz not null default now(),
  unique (medicine_id, scheduled_at)
);

create table if not exists push_subscriptions (
  endpoint text primary key,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_medicines_due on medicines (active, next_due_at);
create index if not exists idx_doses_medicine on doses (medicine_id, scheduled_at desc);
