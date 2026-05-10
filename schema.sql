-- Result Service Schema
-- Run this on your Neon/PostgreSQL instance to initialise the database.

CREATE TABLE IF NOT EXISTS categories (
    category_id SERIAL PRIMARY KEY,
    category_name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS routes (
    route_id INTEGER PRIMARY KEY,
    route_name TEXT,
    difficulty_points INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS climbers (
    climber_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    gender TEXT,
    age INTEGER,
    team_name TEXT
);

CREATE TABLE IF NOT EXISTS climber_categories (
    climber_id TEXT NOT NULL REFERENCES climbers(climber_id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(category_id) ON DELETE CASCADE,
    PRIMARY KEY (climber_id, category_id)
);

CREATE TABLE IF NOT EXISTS judges (
    judge_id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_superadmin BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS judge_route_assignments (
    judge_id INTEGER NOT NULL REFERENCES judges(judge_id) ON DELETE CASCADE,
    route_id INTEGER NOT NULL REFERENCES routes(route_id) ON DELETE CASCADE,
    PRIMARY KEY (judge_id, route_id)
);

CREATE TABLE IF NOT EXISTS results (
    result_id SERIAL PRIMARY KEY,
    climber_id TEXT NOT NULL REFERENCES climbers(climber_id) ON DELETE CASCADE,
    route_id INTEGER NOT NULL REFERENCES routes(route_id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(category_id) ON DELETE CASCADE,
    attempts INTEGER DEFAULT 0,
    is_top BOOLEAN DEFAULT false,
    points_awarded INTEGER DEFAULT 0,
    score_type TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (climber_id, route_id, category_id)
);

CREATE TABLE IF NOT EXISTS finals_routes (
    route_id SERIAL PRIMARY KEY,
    route_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS route_category_link (
    route_id INTEGER NOT NULL REFERENCES finals_routes(route_id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(category_id) ON DELETE CASCADE,
    PRIMARY KEY (route_id, category_id)
);

CREATE TABLE IF NOT EXISTS finals_climbers (
    climber_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    organisation TEXT,
    category TEXT NOT NULL,
    gender TEXT NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(category_id),
    qualifying_rank INTEGER
);

CREATE TABLE IF NOT EXISTS finals_results (
    result_id SERIAL PRIMARY KEY,
    climber_id TEXT NOT NULL REFERENCES finals_climbers(climber_id) ON DELETE CASCADE,
    route_id INTEGER NOT NULL REFERENCES finals_routes(route_id) ON DELETE CASCADE,
    has_top BOOLEAN DEFAULT false,
    has_zone BOOLEAN DEFAULT false,
    attempts_to_top INTEGER DEFAULT 0,
    attempts_to_zone INTEGER DEFAULT 0,
    score NUMERIC(5, 2) DEFAULT 0.00,
    UNIQUE(climber_id, route_id)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_results_climber ON results(climber_id);
CREATE INDEX IF NOT EXISTS idx_results_category ON results(category_id);
CREATE INDEX IF NOT EXISTS idx_results_route ON results(route_id);
CREATE INDEX IF NOT EXISTS idx_finals_results_climber ON finals_results(climber_id);
CREATE INDEX IF NOT EXISTS idx_climber_categories_category ON climber_categories(category_id);
