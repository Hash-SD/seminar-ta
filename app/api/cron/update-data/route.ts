import { NextRequest, NextResponse } from 'next/server';
import { getAllPublicLinks, getCachedSheetData, cacheSheetData, getUserRefreshToken } from '@/app/api/db';
import { getUserGoogleSheetsClient, extractSpreadsheetId } from '@/lib/google-sheets';

export const runtime = 'nodejs';

// Force dynamic rendering to ensure the cron job runs effectively
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('[Cron] Starting scheduled update check...');

  try {
    const links = await getAllPublicLinks();
    let updatedCount = 0;

    for (const link of links) {
        const config = link.configuration || {};

        // Check if auto_refresh is enabled
        if (config.auto_refresh) {
            // Check if we have a recent cache
            const cachedData = await getCachedSheetData(link.id);
            let needsUpdate = true;

            if (cachedData.length > 0) {
                // If cache exists and is valid (not expired), skip update
                needsUpdate = false;
            }

            if (needsUpdate) {
                console.log(`[Cron] Updating link ${link.id} (${link.sheet_name})...`);

                // Authenticate using the Owner's Refresh Token
                const refreshToken = await getUserRefreshToken(link.user_id);

                if (!refreshToken) {
                    console.warn(`[Cron] No refresh token found for user ${link.user_id}. Skipping link ${link.id}.`);
                    continue;
                }

                const sheets = getUserGoogleSheetsClient(undefined, refreshToken);
                if (!sheets) {
                    console.error(`[Cron] Failed to create Google Sheets client for user ${link.user_id}`);
                    continue;
                }

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
