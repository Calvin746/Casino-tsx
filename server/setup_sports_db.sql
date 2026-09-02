-- SQL Script for P2P Sports Betting Features

-- Matches Table
CREATE TABLE IF NOT EXISTS matches (
    id VARCHAR(36) PRIMARY KEY,
    api_id VARCHAR(255) UNIQUE, -- ID from the external Sports API
    sport_key VARCHAR(50) NOT NULL,
    home_team VARCHAR(100) NOT NULL,
    away_team VARCHAR(100) NOT NULL,
    start_time DATETIME NOT NULL,
    status ENUM('UPCOMING', 'LIVE', 'COMPLETED', 'CANCELED') DEFAULT 'UPCOMING',
    result ENUM('HOME_WIN', 'AWAY_WIN', 'DRAW', 'PENDING') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- P2P Bets Table
CREATE TABLE IF NOT EXISTS p2p_bets (
    id VARCHAR(36) PRIMARY KEY,
    match_id VARCHAR(36) NOT NULL,
    creator_user_id VARCHAR(36) NOT NULL,
    acceptor_user_id VARCHAR(36) DEFAULT NULL,
    creator_team_choice ENUM('HOME', 'AWAY', 'DRAW') NOT NULL,
    stake_cents INT NOT NULL, -- The amount each user bets (e.g., 5000 for 50€)
    status ENUM('OPEN', 'MATCHED', 'RESOLVED', 'CANCELED') DEFAULT 'OPEN',
    winner_user_id VARCHAR(36) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(id),
    FOREIGN KEY (creator_user_id) REFERENCES users(id),
    FOREIGN KEY (acceptor_user_id) REFERENCES users(id)
);
