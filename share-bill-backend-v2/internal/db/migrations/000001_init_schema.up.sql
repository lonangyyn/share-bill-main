CREATE extension IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users(
    user_id BIGSERIAL PRIMARY KEY,
    user_uuid uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    avatar TEXT,
    phone_number TEXT UNIQUE,
    password TEXT NOT NULL,
    bank_name TEXT,
    bank_account TEXT,
    bank_owner TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events(
    event_id BIGSERIAL PRIMARY KEY,
    event_uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    description TEXT,
    currency TEXT NOT NULL DEFAULT 'VND',
    created_at TIMESTAMPTZ DEFAULT now(),
    last_updated_at TIMESTAMPTZ DEFAULT now(),
    creator_id BIGINT REFERENCES users(user_id),
    is_closed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS participants(
    participant_id BIGSERIAL PRIMARY KEY,
    participant_uuid UUID  NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    event_id BIGINT NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    bank_name TEXT,
    bank_account TEXT,
    bank_owner TEXT,
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(event_id, user_id)
);

CREATE TABLE IF NOT EXISTS collectors(
    collector_id BIGSERIAL PRIMARY KEY,
    collector_uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    event_id BIGINT NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    participant_id BIGINT REFERENCES participants(participant_id) ON DELETE SET NULL,
    bank_name TEXT NOT NULL,
    bank_account TEXT NOT NULL,
    bank_owner TEXT NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS expenses (
    expense_id BIGSERIAL PRIMARY KEY,
    expense_uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    event_id BIGINT NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    total_amount NUMERIC(14,2) NOT NULL CHECK (total_amount >= 0),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expense_payers (
    payer_id BIGSERIAL PRIMARY KEY,
    payer_uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    expense_id BIGINT NOT NULL REFERENCES expenses(expense_id) ON DELETE CASCADE,
    participant_id BIGINT REFERENCES participants(participant_id) ON DELETE SET NULL,
    paid_amount NUMERIC(14,2) NOT NULL CHECK (paid_amount >= 0)
);

CREATE TABLE IF NOT EXISTS expense_beneficiaries (
    beneficiary_id BIGSERIAL PRIMARY KEY,
    beneficiary_uuid  UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    expense_id BIGINT REFERENCES expenses(expense_id) ON DELETE CASCADE,
    participant_id BIGINT REFERENCES participants(participant_id) ON DELETE SET NULL,
    split_ratio NUMERIC(10,4) NOT NULL
);

CREATE TABLE IF NOT EXISTS settlements (
    settlement_id BIGSERIAL PRIMARY KEY,
    settlement_uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    event_id BIGINT NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMPTZ DEFAULT now(),
    payer_id BIGINT REFERENCES participants(participant_id),
    receiver_id BIGINT REFERENCES participants(participant_id)
);

