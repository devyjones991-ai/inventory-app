-- Enable Row Level Security and add policies for authenticated users

-- Objects table
alter table objects enable row level security;
create policy "allow_authenticated" on objects
  for all using (auth.role() = 'authenticated');

-- Hardware table
alter table hardware enable row level security;
create policy "allow_authenticated" on hardware
  for all using (auth.role() = 'authenticated');

-- Tasks table
alter table tasks enable row level security;
create policy "allow_authenticated" on tasks
  for all using (auth.role() = 'authenticated');

-- Chat messages table
alter table chat_messages enable row level security;
create policy "allow_authenticated" on chat_messages
  for all using (auth.role() = 'authenticated');
