// app/api/__tests__/db.test.ts
import {
  initializeDatabase,
  storeUserToken,
  getUserRefreshToken,
  pool
} from '../db';

// Mock the 'pg' module
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('Database Self-Healing and RLS Tests', () => {
  let mockQuery: jest.Mock;

  beforeEach(() => {
    mockQuery = (pool.query as jest.Mock);
    mockQuery.mockReset();
  });

  test('initializeDatabase should execute creation and migration queries including RLS', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    await initializeDatabase();

    // Verify core table creations
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS users'));
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS spreadsheet_links'));
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS sheet_data_cache'));

    // Verify RLS enablement
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('ALTER TABLE users ENABLE ROW LEVEL SECURITY'));
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('ALTER TABLE spreadsheet_links ENABLE ROW LEVEL SECURITY'));
  });

  test('storeUserToken should retry after calling initializeDatabase on error 42703', async () => {
    const userId = 1;
    const token = 'new-refresh-token';

    let hasFailed = false;
    mockQuery.mockImplementation(async (sql, params) => {
        // Check if this is the update token query
        if (typeof sql === 'string' && sql.includes('UPDATE users SET refresh_token')) {
            if (!hasFailed) {
                hasFailed = true;
                throw { code: '42703' };
            } else {
                return { rows: [] };
            }
        }
        // Default for other queries (initializeDatabase)
        return { rows: [] };
    });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await storeUserToken(userId, token);

    // Verify retry occurred
    expect(hasFailed).toBe(true);
    // Verify console log for auto-repair
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[Auto-Repair] Column refresh_token missing during update. Running migration...'));

    consoleSpy.mockRestore();
  });

  test('getUserRefreshToken should retry after calling initializeDatabase on error 42703', async () => {
    const userId = 1;
    const expectedToken = 'retrieved-token';

    let hasFailed = false;
    mockQuery.mockImplementation(async (sql, params) => {
        // Check if this is the select token query
        if (typeof sql === 'string' && sql.includes('SELECT refresh_token FROM users')) {
            if (!hasFailed) {
                hasFailed = true;
                throw { code: '42703' };
            } else {
                return { rows: [{ refresh_token: expectedToken }] };
            }
        }
        // Default for other queries (initializeDatabase)
        return { rows: [] };
    });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const token = await getUserRefreshToken(userId);

    expect(token).toBe(expectedToken);
    expect(hasFailed).toBe(true);

    // Verify console log for auto-repair
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[Auto-Repair] Column refresh_token missing. Running migration...'));

    consoleSpy.mockRestore();
  });

  test('storeUserToken should throw on other errors', async () => {
    const userId = 1;
    const token = 'token';
    const error = new Error('Some other error');
    (error as any).code = '23505'; // Unique violation, for example

    mockQuery.mockRejectedValue(error);

    await expect(storeUserToken(userId, token)).rejects.toThrow('Some other error');
  });
});
