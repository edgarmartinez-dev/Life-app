-- Apply with: npx wrangler d1 migrations apply life-app-db --remote (or --local for dev)
CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 500),
  completed INTEGER NOT NULL DEFAULT 0,
  due_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
