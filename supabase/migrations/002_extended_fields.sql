-- Adds MVP app-specific fields to promises that weren't in the initial schema.

ALTER TABLE public.promises
  ADD COLUMN IF NOT EXISTS mode          text    DEFAULT 'positive'
    CHECK (mode IN ('positive', 'negative')),
  ADD COLUMN IF NOT EXISTS time_slot     text    DEFAULT 'allday'
    CHECK (time_slot IN ('allday', 'morning', 'afternoon', 'evening')),
  ADD COLUMN IF NOT EXISTS slot_order    int,
  ADD COLUMN IF NOT EXISTS schedule_mode text    DEFAULT 'daily'
    CHECK (schedule_mode IN ('daily', 'specific_days', 'weekly_count')),
  ADD COLUMN IF NOT EXISTS schedule_days int[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS weekly_target int;
