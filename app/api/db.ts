import { Pool } from "pg";

const DATABASE_URL = process.env.POSTGRES_URL;

if (!DATABASE_URL) {
  throw new Error("POSTGRES_URL environment variable is not set.");
}

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        google_id VARCHAR(255) UNIQUE,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);`);

    await pool.query(`
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
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_links_user_id ON spreadsheet_links(user_id);`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sheet_data_cache (
        id SERIAL PRIMARY KEY,
        link_id INT NOT NULL REFERENCES spreadsheet_links(id) ON DELETE CASCADE,
        data JSONB NOT NULL,
        cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP
      );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_cache_link_id ON sheet_data_cache(link_id);`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS link_history (
        id SERIAL PRIMARY KEY,
        link_id INT NOT NULL REFERENCES spreadsheet_links(id) ON DELETE CASCADE,
        action VARCHAR(50),
        old_value VARCHAR(500),
        new_value VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_history_link_id ON link_history(link_id);`);

    console.log('[v0] Database initialized successfully');
  } catch (error) {
    console.error('[v0] Database initialization error:', error);
    throw error;
  }
}

export async function getUserById(userId: number) {
  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
  return rows;
}

export async function getUserByEmail(email: string) {
  const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return rows;
}

export async function createUser(email: string, name: string, googleId: string) {
  const { rows } = await pool.query(
    "INSERT INTO users (email, name, google_id) VALUES ($1, $2, $3) RETURNING *",
    [email, name, googleId]
  );
  return rows;
}

export async function getSpreadsheetLinks(userId: number) {
    const { rows } = await pool.query("SELECT * FROM spreadsheet_links WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
    return rows;
}

export async function addSpreadsheetLink(userId: number, sheetUrl: string, sheetName: string, sheetId?: string) {
    const { rows } = await pool.query(
        "INSERT INTO spreadsheet_links (user_id, sheet_url, sheet_name, sheet_id) VALUES ($1, $2, $3, $4) RETURNING *",
        [userId, sheetUrl, sheetName, sheetId || null]
    );
    return rows;
}

export async function deleteSpreadsheetLink(linkId: number) {
    const { rows } = await pool.query("DELETE FROM spreadsheet_links WHERE id = $1", [linkId]);
    return rows;
}

export async function cacheSheetData(linkId: number, data: any, expiresIn: number = 3600) {
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    const { rows } = await pool.query(
        "INSERT INTO sheet_data_cache (link_id, data, expires_at) VALUES ($1, $2, $3)",
        [linkId, JSON.stringify(data), expiresAt]
    );
    return rows;
}

export async function getCachedSheetData(linkId: number) {
    const { rows } = await pool.query(
        "SELECT data FROM sheet_data_cache WHERE link_id = $1 AND expires_at > NOW() ORDER BY cached_at DESC LIMIT 1",
        [linkId]
    );
    return rows;
}

export async function upsertUser(email: string, googleId: string, name: string) {
    const { rows } = await pool.query(`
      INSERT INTO users (email, google_id, name)
      VALUES ($1, $2, $3)
      ON CONFLICT (google_id) DO UPDATE SET
      updated_at = CURRENT_TIMESTAMP,
      name = EXCLUDED.name
      RETURNING *
    `, [email, googleId, name]);
    return rows;
}
  
export async function getLinksByUserEmail(email: string) {
    const { rows } = await pool.query(`
      SELECT sl.* FROM spreadsheet_links sl
      JOIN users u ON sl.user_id = u.id
      WHERE u.email = $1
      ORDER BY sl.updated_at DESC
    `, [email]);
    return rows;
}
  
export async function upsertLink(userId: number, sheetUrl: string, sheetName: string) {
    const { rows } = await pool.query(`
      INSERT INTO spreadsheet_links (user_id, sheet_url, sheet_name)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, sheet_url) DO UPDATE
      SET sheet_name = $3, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [userId, sheetUrl, sheetName]);
    return rows[0];
}
  
export async function createLinkHistory(linkId: number, action: string, newValue: string) {
    await pool.query(`
      INSERT INTO link_history (link_id, action, new_value)
      VALUES ($1, $2, $3)
    `, [linkId, action, newValue]);
}
  
export async function deleteLinkForUser(linkId: number, email: string) {
    const result = await pool.query(`
      DELETE FROM spreadsheet_links
      WHERE id = $1 AND user_id = (SELECT id FROM users WHERE email = $2)
      RETURNING id
    `, [linkId, email]);
    return result.rowCount;
}
  
export async function getLinkForUser(linkId: number, email: string) {
    const { rows } = await pool.query(`
      SELECT sl.* FROM spreadsheet_links sl
      JOIN users u ON sl.user_id = u.id
      WHERE sl.id = $1 AND u.email = $2
    `, [linkId, email]);
    return rows[0];
}
  
export async function updateLinkLastAccessed(linkId: number) {
    await pool.query('UPDATE spreadsheet_links SET last_accessed = CURRENT_TIMESTAMP WHERE id = $1', [linkId]);
}
