ALTER TABLE todos ADD COLUMN due_time TEXT;
ALTER TABLE todos ADD COLUMN position REAL NOT NULL DEFAULT 0;
UPDATE todos SET position = rowid;
