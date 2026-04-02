-- name: CreateExpense :one
INSERT INTO expenses (
    event_id, description, total_amount, created_at, expense_uuid
) VALUES (
    $1, $2, $3, NOW(), gen_random_uuid()
) RETURNING *;

-- name: CreateExpensePayer :exec
INSERT INTO expense_payers (
    expense_id, participant_id, paid_amount, payer_uuid
) VALUES (
    $1, $2, $3, gen_random_uuid()
);

-- name: CreateExpenseBeneficiary :exec
INSERT INTO expense_beneficiaries (
    expense_id, participant_id, split_ratio, beneficiary_uuid
) VALUES (
    $1, $2, $3, gen_random_uuid()
);

-- name: GetExpenseByUUID :one
SELECT * FROM expenses WHERE expense_uuid = $1;

-- name: GetExpensePayers :many
SELECT ep.paid_amount, p.participant_uuid, p.name
FROM expense_payers ep
JOIN participants p ON ep.participant_id = p.participant_id
WHERE ep.expense_id = $1;

-- name: GetExpenseBeneficiaries :many
SELECT eb.split_ratio, p.participant_uuid, p.name
FROM expense_beneficiaries eb
JOIN participants p ON eb.participant_id = p.participant_id
WHERE eb.expense_id = $1;

-- name: UpdateExpense :one
UPDATE expenses
SET 
    description = $2,
    total_amount = $3
WHERE expense_id = $1
RETURNING *;

-- name: DeleteExpensePayers :exec
DELETE FROM expense_payers WHERE expense_id = $1;

-- name: DeleteExpenseBeneficiaries :exec
DELETE FROM expense_beneficiaries WHERE expense_id = $1;

-- name: DeleteExpense :exec
DELETE FROM expenses WHERE expense_id = $1;

-- name: ListExpensesByEventID :many
SELECT 
    x.expense_id, x.expense_uuid, x.description, x.total_amount, x.created_at,
    (SELECT p.name FROM expense_payers ep JOIN participants p ON ep.participant_id = p.participant_id WHERE ep.expense_id = x.expense_id LIMIT 1) as payer_name
FROM expenses x
WHERE x.event_id = $1
ORDER BY x.created_at DESC;