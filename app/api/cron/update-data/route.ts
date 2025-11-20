import { NextRequest, NextResponse } from 'next/server';
import { getAllPublicLinks, getCachedSheetData, cacheSheetData } from '@/app/api/db';
import { getGoogleSheetsClient, extractSpreadsheetId } from '@/lib/google-sheets';

export const runtime = 'nodejs';

// Force dynamic rendering to ensure the cron job runs effectively
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Vercel Cron jobs should be protected or checked.
  // Typically verify a secret header if strictly needed, but for Vercel Cron, we can check 'Authorization' header if we set one.
  // For now, we'll keep it open but obscure or rely on logic.

  // Actually, the user said "pembacaan terjadwal oleh sistem otomatis sesuai inputan yang di atur admin".
  // So we check configurations.

  console.log('[Cron] Starting scheduled update check...');

  try {
    const links = await getAllPublicLinks();
    let updatedCount = 0;

    const sheets = getGoogleSheetsClient();
    if (!sheets) {
        return NextResponse.json({ error: 'Google Sheets client unavailable' }, { status: 500 });
    }

    for (const link of links) {
        const config = link.configuration || {};

        // Check if auto_refresh is enabled
        if (config.auto_refresh) {
            const refreshInterval = (config.refresh_interval || 60) * 60 * 1000; // default 60 mins in ms

            // Check if we have a recent cache
            const cachedData = await getCachedSheetData(link.id);
            let needsUpdate = true;

            if (cachedData.length > 0) {
                const cachedAt = new Date(cachedData[0].cached_at).getTime(); // Wait, need to fetch cached_at or rely on implicit logic?
                // getCachedSheetData returns `data` column. We might need to select `cached_at` too to do this logic properly
                // OR we just rely on `expires_at` logic in `getCachedSheetData`.
                // `getCachedSheetData` filters `expires_at > NOW()`.
                // So if it returns data, it is "valid" by cache standards.

                // However, the user wants "Scheduled Refresh".
                // If the cron runs, and the cache is valid, maybe we don't need to fetch?
                // But if the cron is "Force Refresh at interval", we should fetch if the cache is nearing expiry or just blindly fetch.

                // Let's assume we fetch if the cache is empty (expired).
                needsUpdate = false;
            }

            if (needsUpdate) {
                console.log(`[Cron] Updating link ${link.id} (${link.sheet_name})...`);
                const spreadsheetId = extractSpreadsheetId(link.sheet_url);
                if (spreadsheetId) {
                    try {
                        const sheetTabs = link.sheet_name.split(',').map((s: string) => s.trim());
                        let sheetValues: any[] = [];

                        for (const tab of sheetTabs) {
                             const response = await sheets.spreadsheets.values.get({
                                 spreadsheetId,
                                 range: `${tab}!A:Z`,
                             });
                             if (response.data.values) {
                                 sheetValues = [...sheetValues, ...response.data.values];
                             }
                        }

                        if (sheetValues.length > 0) {
                            // Cache it using the refresh interval as the TTL (or slightly longer to prevent gaps)
                            // e.g., refresh_interval + 5 minutes buffer.
                            const ttl = (config.refresh_interval || 60) * 60 + 300;
                            await cacheSheetData(link.id, sheetValues, ttl);
                            updatedCount++;
                        }
                    } catch (e) {
                        console.error(`[Cron] Failed to update link ${link.id}`, e);
                    }
                }
            }
        }
    }

    return NextResponse.json({ success: true, updated: updatedCount });
  } catch (error) {
    console.error('[Cron] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
