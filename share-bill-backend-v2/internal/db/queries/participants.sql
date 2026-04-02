-- name: AddParticipant :one
INSERT INTO participants (
    event_id, user_id, name, bank_name, bank_account, bank_owner
) VALUES (
    $1, sqlc.narg('user_id'), $2, sqlc.narg('bank_name'), sqlc.narg('bank_account'), sqlc.narg('bank_owner')
) RETURNING *;

-- name: GetParticipantByEventAndUser :one
SELECT * FROM participants
WHERE event_id = $1 AND user_id = $2 LIMIT 1;

-- name: GetParticipantByID :one
SELECT * FROM participants
WHERE participant_id = $1 LIMIT 1;

-- name: GetParticipantByUUID :one
SELECT * FROM participants WHERE participant_uuid = $1 LIMIT 1;

-- name: ListParticipantsByEventID :many
SELECT 
    p.*,
    u.user_uuid as user_global_uuid,
    u.email as user_email
FROM participants p
LEFT JOIN users u ON p.user_id = u.user_id
WHERE p.event_id = $1
ORDER BY p.joined_at ASC;

-- name: UpdateParticipant :one
UPDATE participants
SET 
    name = COALESCE(sqlc.narg('name'), name),
    bank_name = COALESCE(sqlc.narg('bank_name'), bank_name),
    bank_account = COALESCE(sqlc.narg('bank_account'), bank_account),
    bank_owner = COALESCE(sqlc.narg('bank_owner'), bank_owner)
WHERE participant_id = $1
RETURNING *;

-- name: RemoveParticipantByID :exec
DELETE FROM participants WHERE participant_id = $1;

-- name: RemoveParticipant :exec
DELETE FROM participants WHERE event_id = $1 AND user_id = $2;

-- name: GetParticipantBalance :one
SELECT 
    (
        -- 1. Tổng tiền người này đã chi (Paid)
        COALESCE((
            SELECT SUM(ep.paid_amount)
            FROM expense_payers ep
            -- JOIN bảng participants để xác định đúng user_id và event_id
            JOIN participants p_payer ON ep.participant_id = p_payer.participant_id
            WHERE p_payer.event_id = $1 AND p_payer.user_id = $2
        ), 0) 
        - 
        -- 2. Tổng tiền người này phải chịu (Owed/Benefit)
        -- Công thức: Tổng (Giá trị Hóa đơn * Tỷ lệ chia)
        COALESCE((
            SELECT SUM(e.total_amount * eb.split_ratio)
            FROM expense_beneficiaries eb
            JOIN expenses e ON eb.expense_id = e.expense_id
            JOIN participants p_ben ON eb.participant_id = p_ben.participant_id
            WHERE p_ben.event_id = $1 AND p_ben.user_id = $2
        ), 0)
    )::numeric AS balance;