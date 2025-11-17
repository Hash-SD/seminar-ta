import { sql } from '@vercel/postgres';

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error('POSTGRES_URL or POSTGRES_URL_NON_POOLING environment variable is not set');
}

export async function initializeDatabase() {
  try {
    // Create tables using sql template tag
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        google_id VARCHAR(255) UNIQUE,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS spreadsheet_links (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        sheet_url VARCHAR(500) NOT NULL,
        sheet_name VARCHAR(255) NOT NULL,
        sheet_id VARCHAR(100),
        last_accessed TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, sheet_url)
      );
      CREATE INDEX IF NOT EXISTS idx_links_user_id ON spreadsheet_links(user_id);
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS sheet_data_cache (
        id SERIAL PRIMARY KEY,
        link_id INT NOT NULL REFERENCES spreadsheet_links(id) ON DELETE CASCADE,
        data JSONB NOT NULL,
        cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_cache_link_id ON sheet_data_cache(link_id);
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS link_history (
        id SERIAL PRIMARY KEY,
        link_id INT NOT NULL REFERENCES spreadsheet_links(id) ON DELETE CASCADE,
        action VARCHAR(50),
        old_value VARCHAR(500),
        new_value VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_history_link_id ON link_history(link_id);
    `;

    console.log('[v0] Database initialized successfully');
  } catch (error) {
    console.error('[v0] Database initialization error:', error);
    throw error;
  }
}

export async function getUserById(userId: number) {
  const result = await sql`SELECT * FROM users WHERE id = ${userId}`;
  return result.rows;
}

export async function getUserByEmail(email: string) {
  const result = await sql`SELECT * FROM users WHERE email = ${email}`;
  return result.rows;
}

export async function createUser(email: string, name: string, googleId: string) {
  const result = await sql`INSERT INTO users (email, name, google_id) VALUES (${email}, ${name}, ${googleId}) RETURNING *`;
  return result.rows;
}

export async function getSpreadsheetLinks(userId: number) {
  const result = await sql`SELECT * FROM spreadsheet_links WHERE user_id = ${userId} ORDER BY created_at DESC`;
  return result.rows;
}

export async function addSpreadsheetLink(userId: number, sheetUrl: string, sheetName: string, sheetId?: string) {
  const result = await sql`INSERT INTO spreadsheet_links (user_id, sheet_url, sheet_name, sheet_id) VALUES (${userId}, ${sheetUrl}, ${sheetName}, ${sheetId || null}) RETURNING *`;
  return result.rows;
}

export async function deleteSpreadsheetLink(linkId: number) {
  const result = await sql`DELETE FROM spreadsheet_links WHERE id = ${linkId}`;
  return result.rows;
}

export async function cacheSheetData(linkId: number, data: any, expiresIn: number = 3600) {
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  const result = await sql`INSERT INTO sheet_data_cache (link_id, data, expires_at) VALUES (${linkId}, ${JSON.stringify(data)}, ${expiresAt})`;
  return result.rows;
}

export async function getCachedSheetData(linkId: number) {
  const result = await sql`SELECT data FROM sheet_data_cache WHERE link_id = ${linkId} AND expires_at > NOW() ORDER BY cached_at DESC LIMIT 1`;
  return result.rows;
}
