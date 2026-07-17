-- Apply with: npx wrangler d1 migrations apply life-app-db --remote (or --local for dev)

CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  part TEXT NOT NULL DEFAULT 'anytime',   -- morning|afternoon|evening|anytime
  days TEXT NOT NULL DEFAULT '',           -- comma-sep weekday 0(Sun)-6(Sat), '' = every day
  active INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  position REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- One row per habit done on a day. UNIQUE makes "done" idempotent.
CREATE TABLE IF NOT EXISTS habit_logs (
  id TEXT PRIMARY KEY,
  habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date TEXT NOT NULL,                     -- YYYY-MM-DD, local day
  done_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (habit_id, date)
);

CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs (date);
