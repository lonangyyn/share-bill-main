-- name: CreateEvent :one
INSERT INTO events (
    name, currency, description, creator_id, event_uuid, created_at, last_updated_at, is_closed
) VALUES (
    $1, $2, sqlc.narg('description'), $3, gen_random_uuid(), NOW(), NOW(), FALSE
) RETURNING *;

-- name: GetEventByUUID :one
SELECT * FROM events
WHERE event_uuid = $1 LIMIT 1;

-- name: GetEventByID :one
SELECT * FROM events
WHERE event_id = $1 LIMIT 1;

-- name: ListEventsByUserID :many
-- Lấy danh sách event mà user đã tham gia
SELECT e.*
FROM events e
JOIN participants p ON e.event_id = p.event_id
WHERE p.user_id = $1
ORDER BY e.last_updated_at DESC;

-- name: UpdateEvent :one
UPDATE events
SET 
    name = COALESCE(sqlc.narg('name'), name),
    description = COALESCE(sqlc.narg('description'), description),
    status = COALESCE(sqlc.narg('status'), status),
    currency = COALESCE(sqlc.narg('currency'), currency),
    is_closed = COALESCE(sqlc.narg('is_closed'), is_closed),
    last_updated_at = NOW()
WHERE event_id = $1
RETURNING *;

-- name: DeleteEvent :exec
DELETE FROM events
WHERE event_id = $1;