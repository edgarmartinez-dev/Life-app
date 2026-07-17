-- Apply with: npx wrangler d1 migrations apply life-app-db --remote (or --local for dev)

CREATE TABLE IF NOT EXISTS medications (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  dose TEXT,                              -- free text, e.g. "500 mg", "2 tablets"
  times TEXT NOT NULL DEFAULT '',         -- comma-sep HH:MM, e.g. "08:00,20:00"
  active INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  position REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- One row per dose actually taken. UNIQUE makes "mark taken" idempotent and
-- blocks double-logging the same scheduled dose on the same day.
CREATE TABLE IF NOT EXISTS medication_logs (
  id TEXT PRIMARY KEY,
  medication_id TEXT NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  date TEXT NOT NULL,                     -- YYYY-MM-DD, local day
  slot INTEGER NOT NULL,                  -- index into the med's times list
  taken_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (medication_id, date, slot)
);

CREATE INDEX IF NOT EXISTS idx_med_logs_date ON medication_logs (date);
