CREATE DATABASE IF NOT EXISTS casino_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE casino_db;

-- 1. Benutzer & Saldo
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    balance_cents BIGINT NOT NULL DEFAULT 0,
    is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
    kyc_status VARCHAR(32) NOT NULL DEFAULT 'UNVERIFIED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_balance CHECK (balance_cents >= 0)
) ENGINE=InnoDB;

-- 2. Spielrunden-Audit (eCOGRA / GLI konform)
CREATE TABLE game_rounds (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    bet_cents BIGINT NOT NULL,
    win_cents BIGINT NOT NULL DEFAULT 0,
    server_seed VARCHAR(64) NOT NULL,
    result_data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_bet CHECK (bet_cents > 0),
    CONSTRAINT chk_win CHECK (win_cents >= 0),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 3. Transaktionsbuch (Unveränderliches Ledger)
CREATE TABLE balance_transactions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    type VARCHAR(32) NOT NULL,
    amount_cents BIGINT NOT NULL,
    balance_after_cents BIGINT NOT NULL,
    reference_id VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Testnutzer mit 100,00 € Startguthaben einfügen
INSERT INTO users (id, email, password_hash, balance_cents) 
VALUES ('11111111-1111-1111-1111-111111111111', 'test@casino.local', 'dummy_hash', 10000)
ON DUPLICATE KEY UPDATE balance_cents=balance_cents;