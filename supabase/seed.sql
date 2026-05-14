-- Badge catalog seed data
-- Run once after the migration, or include in Supabase Studio > SQL Editor

insert into public.badges (id, name, description, condition_type, condition_value) values
  ('first_step',   'First Step',   'Keep your first promise',                'first_keep',          null),
  ('on_a_roll',    'On a Roll',    '7-day habit streak',                     'habit_streak',         7),
  ('committed',    'Committed',    '30-day habit streak',                    'habit_streak',         30),
  ('word_is_bond', 'Word is Bond', 'Keep 10 one-time pledges',               'pledge_count',         10),
  ('consistent',   'Consistent',   'Keep promises on 30 days in a month',    'monthly_consistency',  30),
  ('comeback_kid', 'Comeback Kid', 'Resume a habit after breaking a streak', 'comeback',             null)
on conflict (id) do nothing;
