import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getAllPublicLinks, cacheSheetData } from '@/app/api/db';
import { getGoogleSheetsClient, extractSpreadsheetId } from '@/lib/google-sheets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const links = await getAllPublicLinks();
    let updatedCount = 0;
    let errors = [];

    const sheets = getGoogleSheetsClient();
    if (!sheets) {
        return NextResponse.json({ error: 'Google Sheets client unavailable' }, { status: 500 });
    }

    for (const link of links) {
        console.log(`[Manual Refresh] Updating link ${link.id} (${link.sheet_name})...`);
        const spreadsheetId = extractSpreadsheetId(link.sheet_url);
        if (spreadsheetId) {
            try {
                const sheetTabs = link.sheet_name.split(',').map((s: string) => s.trim());
                let sheetValues: any[] = [];

                for (const tab of sheetTabs) {
                        try {
                            const response = await sheets.spreadsheets.values.get({
                                spreadsheetId,
                                range: `${tab}!A:Z`,
                            });
                            if (response.data.values) {
                                sheetValues = [...sheetValues, ...response.data.values];
                            }
                        } catch (err) {
                             console.warn(`Failed to fetch tab ${tab} for link ${link.id}`);
                        }
                }

                if (sheetValues.length > 0) {
                    // Manual Refresh: Cache with a reasonable TTL (e.g. 1 hour or whatever the configured interval is, defaulting to 1h)
                    // Or since this is manual, maybe we assume it's good for a while?
                    // Let's use 1 hour (3600s) as a safe default for manual refresh,
                    // unless the link has a shorter interval configured.
                    const config = link.configuration || {};
                    const ttl = config.auto_refresh ? (config.refresh_interval || 60) * 60 + 300 : 3600;

                    await cacheSheetData(link.id, sheetValues, ttl);
                    updatedCount++;
                }
            } catch (e) {
                console.error(`[Manual Refresh] Failed to update link ${link.id}`, e);
                errors.push(`Link ${link.id}: ${(e as Error).message}`);
            }
        }
    }

    return NextResponse.json({
        success: true,
        message: `Successfully refreshed ${updatedCount} spreadsheets.`,
        updatedCount,
        errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('[Manual Refresh] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
