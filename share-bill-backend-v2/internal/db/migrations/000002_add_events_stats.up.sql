ALTER TABLE events
ADD COLUMN total_participants INTEGER NOT NULL DEFAULT 0,
ADD COLUMN total_transactions INTEGER NOT NULL DEFAULT 0,
ADD COLUMN total_expenses NUMERIC(14,2) NOT NULL DEFAULT 0;

UPDATE events e
SET 
    total_participants = (SELECT COUNT(*) FROM participants p WHERE p.event_id = e.event_id),
    total_transactions = (SELECT COUNT(*) FROM expenses x WHERE x.event_id = e.event_id),
    total_expenses = COALESCE((SELECT SUM(total_amount) FROM expenses x WHERE x.event_id = e.event_id), 0);

CREATE OR REPLACE FUNCTION update_event_participant_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE events SET total_participants = total_participants + 1 WHERE event_id = NEW.event_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE events SET total_participants = total_participants - 1 WHERE event_id = OLD.event_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_participant_stats
AFTER INSERT OR DELETE ON participants
FOR EACH ROW EXECUTE FUNCTION update_event_participant_stats();

CREATE OR REPLACE FUNCTION update_event_expense_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE events 
        SET total_transactions = total_transactions + 1,
            total_expenses = total_expenses + NEW.total_amount
        WHERE event_id = NEW.event_id;
        
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE events 
        SET total_transactions = total_transactions - 1,
            total_expenses = total_expenses - OLD.total_amount
        WHERE event_id = OLD.event_id;
        
    ELSIF (TG_OP = 'UPDATE') THEN
        IF OLD.total_amount <> NEW.total_amount THEN
            UPDATE events 
            SET total_expenses = total_expenses - OLD.total_amount + NEW.total_amount
            WHERE event_id = NEW.event_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_expense_stats
AFTER INSERT OR UPDATE OR DELETE ON expenses
FOR EACH ROW EXECUTE FUNCTION update_event_expense_stats();