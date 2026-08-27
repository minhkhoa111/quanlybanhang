CREATE TABLE IF NOT EXISTS work_tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'normal',
  due_date TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'assigned',
  branch_id TEXT NOT NULL DEFAULT '',
  branch_name TEXT NOT NULL DEFAULT '',
  assigned_to TEXT NOT NULL,
  assigned_name TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_by_name TEXT NOT NULL,
  attachment_key TEXT NOT NULL DEFAULT '',
  attachment_name TEXT NOT NULL DEFAULT '',
  attachment_type TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS work_tasks_assignee_idx ON work_tasks(assigned_to,status,due_date);
CREATE INDEX IF NOT EXISTS work_tasks_branch_idx ON work_tasks(branch_id,status,due_date);

CREATE TABLE IF NOT EXISTS work_task_reports (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  message TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  attachment_key TEXT NOT NULL DEFAULT '',
  attachment_name TEXT NOT NULL DEFAULT '',
  attachment_type TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS work_task_reports_task_idx ON work_task_reports(task_id,created_at);
