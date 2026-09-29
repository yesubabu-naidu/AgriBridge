import { query } from './config/db.js';

async function setup() {
  await query(`
    CREATE TABLE IF NOT EXISTS weather_cache (
      id SERIAL PRIMARY KEY,
      location VARCHAR(150) NOT NULL,
      latitude NUMERIC(10,7) NOT NULL,
      longitude NUMERIC(10,7) NOT NULL,
      forecast_json TEXT NOT NULL,
      ai_analysis_json TEXT,
      fetched_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMPTZ NOT NULL
    )
  `);
  await query('CREATE INDEX IF NOT EXISTS idx_weather_cache_location_expires ON weather_cache(location, expires_at)');
  await query('CREATE INDEX IF NOT EXISTS idx_weather_cache_coords ON weather_cache(latitude, longitude)');
  console.log('weather_cache table verified and created in PostgreSQL.');
  process.exit(0);
}

setup().catch(err => {
  console.error('DB Setup Error:', err);
  process.exit(1);
});
