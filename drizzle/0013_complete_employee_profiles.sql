WITH ranked AS (
  SELECT u.*,
    ROW_NUMBER() OVER (ORDER BY u.created_at,u.id) AS employee_no
  FROM admin_users u
  WHERE u.role IN ('manager','sales','consultant','warranty','repair')
)
INSERT INTO employee_profiles (
  admin_user_id,date_of_birth,joined_date,citizen_id_encrypted,permanent_address_encrypted,
  temporary_address_encrypted,photo_key,bank_name,bank_account_name_encrypted,
  bank_account_number_encrypted,monthly_salary,updated_at
)
SELECT
  id,
  printf('19%02d-%02d-%02d',80 + (employee_no % 19),1 + (employee_no % 12),1 + (employee_no % 27)),
  COALESCE(date(created_at / 1000,'unixepoch'),'2024-01-08'),
  printf('079%09d',employee_no),
  printf('%d Nguyễn Văn Trỗi, Quận Phú Nhuận, TP. Hồ Chí Minh',12 + employee_no),
  CASE WHEN branch <> '' THEN branch || ', TP. Hồ Chí Minh' ELSE 'TP. Hồ Chí Minh' END,
  '',
  CASE employee_no % 4 WHEN 0 THEN 'Vietcombank' WHEN 1 THEN 'Techcombank' WHEN 2 THEN 'MB Bank' ELSE 'ACB' END,
  UPPER(name),
  printf('1903%010d',employee_no),
  CASE role WHEN 'manager' THEN 38000000 WHEN 'sales' THEN 15000000 WHEN 'consultant' THEN 12000000 WHEN 'warranty' THEN 20000000 WHEN 'repair' THEN 20000000 ELSE 0 END,
  CAST(strftime('%s','now') AS INTEGER) * 1000
FROM ranked
WHERE true
ON CONFLICT(admin_user_id) DO UPDATE SET
  date_of_birth=CASE WHEN employee_profiles.date_of_birth='' THEN excluded.date_of_birth ELSE employee_profiles.date_of_birth END,
  joined_date=CASE WHEN employee_profiles.joined_date='' THEN excluded.joined_date ELSE employee_profiles.joined_date END,
  citizen_id_encrypted=CASE WHEN employee_profiles.citizen_id_encrypted='' THEN excluded.citizen_id_encrypted ELSE employee_profiles.citizen_id_encrypted END,
  permanent_address_encrypted=CASE WHEN employee_profiles.permanent_address_encrypted='' THEN excluded.permanent_address_encrypted ELSE employee_profiles.permanent_address_encrypted END,
  temporary_address_encrypted=CASE WHEN employee_profiles.temporary_address_encrypted='' THEN excluded.temporary_address_encrypted ELSE employee_profiles.temporary_address_encrypted END,
  bank_name=CASE WHEN employee_profiles.bank_name='' THEN excluded.bank_name ELSE employee_profiles.bank_name END,
  bank_account_name_encrypted=CASE WHEN employee_profiles.bank_account_name_encrypted='' THEN excluded.bank_account_name_encrypted ELSE employee_profiles.bank_account_name_encrypted END,
  bank_account_number_encrypted=CASE WHEN employee_profiles.bank_account_number_encrypted='' THEN excluded.bank_account_number_encrypted ELSE employee_profiles.bank_account_number_encrypted END,
  monthly_salary=excluded.monthly_salary,
  updated_at=excluded.updated_at;
