-- Portable SQLite schema (also valid for Turso / libSQL).
-- Plain types only: TEXT UUID keys, ISO-8601 dates stored as TEXT, no triggers.

CREATE TABLE IF NOT EXISTS customers (
  id         TEXT PRIMARY KEY,                       -- UUID
  name       TEXT NOT NULL,
  age        INTEGER NOT NULL CHECK (age BETWEEN 0 AND 150),
  email      TEXT NOT NULL,
  phone      TEXT NOT NULL,
  address    TEXT NOT NULL,
  credit     INTEGER NOT NULL DEFAULT 0 CHECK (credit >= 0)   -- whole dollars
);

CREATE TABLE IF NOT EXISTS artists (
  id           TEXT PRIMARY KEY,                     -- UUID
  name         TEXT NOT NULL,
  avatar       TEXT NOT NULL,                        -- URL to avatar image
  bio          TEXT
);

CREATE TABLE IF NOT EXISTS artworks (
  id           TEXT PRIMARY KEY,                     -- UUID
  artist_id    TEXT REFERENCES artists (id),         -- 1-to-many relationship with artists
  artist_name  TEXT,                                 -- fallback or denormalized artist name
  title        TEXT NOT NULL,
  media        TEXT NOT NULL,                        -- oils, acrylic, ...
  size         TEXT NOT NULL,                        -- e.g. '24 x 36 in'
  style        TEXT NOT NULL,                        -- abstract, ...
  date_created TEXT NOT NULL,                        -- YYYY-MM-DD
  price        INTEGER NOT NULL CHECK (price > 0),   -- whole dollars
  status       TEXT NOT NULL DEFAULT 'available'
               CHECK (status IN ('available', 'sold')),
  customer_id  TEXT REFERENCES customers (id),       -- buyer, only when sold
  sold_date    TEXT,
  -- an artwork is sold if and only if it has a buyer and a sold date
  CHECK ((status = 'sold') = (customer_id IS NOT NULL AND sold_date IS NOT NULL)),
  CHECK (status = 'sold' OR (customer_id IS NULL AND sold_date IS NULL))
);

CREATE INDEX IF NOT EXISTS idx_artworks_artist   ON artworks (artist_id);
CREATE INDEX IF NOT EXISTS idx_artworks_customer ON artworks (customer_id);
CREATE INDEX IF NOT EXISTS idx_artworks_status   ON artworks (status);

