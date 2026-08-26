ALTER TABLE employee_payroll_records ADD COLUMN bonus_amount INTEGER NOT NULL DEFAULT 0;
ALTER TABLE employee_payroll_records ADD COLUMN social_insurance_amount INTEGER NOT NULL DEFAULT 0;
ALTER TABLE employee_payroll_records ADD COLUMN personal_income_tax_amount INTEGER NOT NULL DEFAULT 0;
