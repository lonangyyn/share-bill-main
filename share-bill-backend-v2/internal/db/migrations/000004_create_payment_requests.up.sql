CREATE TABLE IF NOT EXISTS payment_requests (
    payment_request_id BIGSERIAL PRIMARY KEY,
    payment_request_uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    event_id BIGINT NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    payer_id BIGINT NOT NULL REFERENCES participants(participant_id) ON DELETE CASCADE,
    receiver_id BIGINT NOT NULL REFERENCES participants(participant_id) ON DELETE CASCADE,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'canceled')) DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_requests_event_id ON payment_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_payer_id ON payment_requests(payer_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_receiver_id ON payment_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
