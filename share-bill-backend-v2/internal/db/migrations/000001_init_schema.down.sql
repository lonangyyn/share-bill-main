-- 1. Xóa các bảng phụ thuộc (Transaction & Settlement)
DROP TABLE IF EXISTS "settlements";
DROP TABLE IF EXISTS "expense_beneficiaries";
DROP TABLE IF EXISTS "expense_payers";
DROP TABLE IF EXISTS "expenses";

-- 2. Xóa bảng trung gian (Participant)
DROP TABLE IF EXISTS "participants";

-- 3. Xóa các bảng chính (Event & Verify)
DROP TABLE IF EXISTS "events";
DROP TABLE IF EXISTS "verify_emails";

-- 4. Xóa bảng gốc (User)
DROP TABLE IF EXISTS "users";