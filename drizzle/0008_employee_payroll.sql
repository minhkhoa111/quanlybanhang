CREATE TABLE IF NOT EXISTS employee_payroll_records (
  id TEXT PRIMARY KEY,
  admin_user_id TEXT NOT NULL,
  payroll_month TEXT NOT NULL,
  base_salary INTEGER NOT NULL DEFAULT 0,
  payable_amount INTEGER NOT NULL DEFAULT 0,
  work_days INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  paid_at INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS employee_payroll_user_month_idx ON employee_payroll_records(admin_user_id, payroll_month);
CREATE INDEX IF NOT EXISTS employee_payroll_month_idx ON employee_payroll_records(payroll_month, status);
