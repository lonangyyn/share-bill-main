-- name: CreateCollector :one
INSERT INTO collectors (
    event_id, participant_id, bank_name, bank_account, bank_owner, is_active
) VALUES (
    $1, $2, $3, $4, $5, TRUE
) RETURNING *;

-- name: GetActiveCollectorByEventID :one
SELECT 
    c.collector_id, 
    c.bank_name, 
    c.bank_account, 
    c.bank_owner,
    p.participant_uuid, 
    p.name as participant_name
FROM collectors c
JOIN participants p ON c.participant_id = p.participant_id
WHERE c.event_id = $1 AND c.is_active = TRUE
LIMIT 1;

-- name: DeactivateCollector :exec
UPDATE collectors
SET is_active = FALSE, ended_at = NOW()
WHERE collector_id = $1;

-- name: CreateSettlement :one
INSERT INTO settlements (
    event_id, settlement_uuid, payer_id, receiver_id, amount
) VALUES (
    $1, gen_random_uuid(), $2, $3, $4
) RETURNING *;

-- name: DeleteSettlement :exec
DELETE FROM settlements WHERE settlement_id = $1;

-- name: ListSettlementsByEvent :many
SELECT 
    s.settlement_id, s.settlement_uuid, s.amount, s.created_at,
    p_payer.name as payer_name, p_payer.participant_uuid as payer_uuid,
    p_receiver.name as receiver_name, p_receiver.participant_uuid as receiver_uuid
FROM settlements s
JOIN participants p_payer ON s.payer_id = p_payer.participant_id
JOIN participants p_receiver ON s.receiver_id = p_receiver.participant_id
WHERE s.event_id = $1
ORDER BY s.created_at DESC;

-- name: GetEventBalances :many
SELECT 
    p.participant_id,
    p.participant_uuid,
    p.name,
    p.user_id,
    COALESCE((
        SELECT SUM(ep.paid_amount) 
        FROM expense_payers ep 
        JOIN expenses e ON ep.expense_id = e.expense_id 
        WHERE ep.participant_id = p.participant_id AND e.event_id = $1
    ), 0)::numeric as total_paid,
    COALESCE((
        SELECT SUM(e.total_amount * eb.split_ratio) 
        FROM expense_beneficiaries eb 
        JOIN expenses e ON eb.expense_id = e.expense_id 
        WHERE eb.participant_id = p.participant_id AND e.event_id = $1
    ), 0)::numeric as total_share,
    COALESCE((
        SELECT SUM(s.amount) 
        FROM settlements s 
        WHERE s.payer_id = p.participant_id AND s.event_id = $1
    ), 0)::numeric as total_settled_sent,
    COALESCE((
        SELECT SUM(s.amount) 
        FROM settlements s 
        WHERE s.receiver_id = p.participant_id AND s.event_id = $1
    ), 0)::numeric as total_settled_received
FROM participants p
WHERE p.event_id = $1;