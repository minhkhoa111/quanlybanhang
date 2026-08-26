WITH service_branch AS (
  SELECT id, name
  FROM branches
  WHERE active = 1
    AND (UPPER(code) LIKE 'BH%' OR name LIKE '%BẢO HÀNH%')
  ORDER BY CASE WHEN UPPER(code) = 'BH1-1' THEN 0 ELSE 1 END, created_at
  LIMIT 1
)
UPDATE admin_users
SET
  branch_id = (SELECT id FROM service_branch),
  branch = (SELECT name FROM service_branch)
WHERE role IN ('warranty', 'repair')
  AND EXISTS (SELECT 1 FROM service_branch);
