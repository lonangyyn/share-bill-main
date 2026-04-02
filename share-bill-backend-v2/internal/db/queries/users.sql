-- name: CreateUser :one
INSERT INTO users (
    name, email, password, phone_number, bank_name, bank_account, bank_owner
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
) RETURNING *;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1 LIMIT 1;

-- name: GetUserByID :one
SELECT * FROM users WHERE user_id = $1 LIMIT 1;

-- name: UpdateUser :one
UPDATE users
SET 
    name = COALESCE(sqlc.narg('name'), name),
    avatar = COALESCE(sqlc.narg('avatar'), avatar),
    phone_number = COALESCE(sqlc.narg('phone_number'), phone_number),
    bank_name = COALESCE(sqlc.narg('bank_name'), bank_name),
    bank_account = COALESCE(sqlc.narg('bank_account'), bank_account),
    bank_owner = COALESCE(sqlc.narg('bank_owner'), bank_owner)
WHERE user_id = $1
RETURNING *;

-- name: UpdateUserAvatar :one
UPDATE users
SET avatar = $2
WHERE user_id = $1
RETURNING *;