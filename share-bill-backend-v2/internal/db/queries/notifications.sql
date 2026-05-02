-- name: GetNotificationsByUserID :many
SELECT 
    n.id, 
    n.user_id, 
    n.text, 
    n.is_read, 
    COALESCE(e.event_uuid::text, '') AS event_uuid, 
    n.created_at
FROM notifications n
LEFT JOIN events e ON n.event_id = e.event_id
WHERE n.user_id = $1
ORDER BY n.created_at DESC
LIMIT 50;

-- name: MarkNotificationsRead :exec
UPDATE notifications
SET is_read = true
WHERE user_id = $1 AND is_read = false;

-- name: CreateNotification :one
INSERT INTO notifications (user_id, text, event_id)
VALUES ($1, $2, $3)
RETURNING id, user_id, text, is_read, event_id, created_at;