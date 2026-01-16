-- SOVR Narrative Mirror Schema
-- AUTHORITY: READ-ONLY (Observation Layer)

CREATE TABLE IF NOT EXISTS journal_entries (
    id VARCHAR(64) PRIMARY KEY,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    source VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    event_id VARCHAR(64),
    user_id VARCHAR(64),
    attestation_hash VARCHAR(128),
    tx_hash VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    raw_data JSONB -- Full entry dump for fidelity
);

CREATE TABLE IF NOT EXISTS journal_lines (
    id SERIAL PRIMARY KEY,
    journal_id VARCHAR(64) REFERENCES journal_entries(id),
    account_id INTEGER NOT NULL,
    type VARCHAR(8) NOT NULL CHECK (type IN ('DEBIT', 'CREDIT')),
    amount NUMERIC(20,0) NOT NULL, -- Micro-units (BigInt)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_journal_event_id ON journal_entries(event_id);
CREATE INDEX idx_journal_user_id ON journal_entries(user_id);
