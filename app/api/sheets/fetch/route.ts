import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getLinkForUser, getCachedSheetData, updateLinkLastAccessed, cacheSheetData, getAllPublicLinks } from '@/app/api/db';
import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheetsClient, extractSpreadsheetId } from '@/lib/google-sheets';
import { filterDataForUpcomingWeek } from '@/lib/date-filter';

export const runtime = 'nodejs';

// Helper to parse cell reference (e.g. A1, C5) -> { col: 0, row: 0 }
function parseCellReference(cellRef: string): { col: number, row: number } | null {
    if (!cellRef) return null;

    const match = cellRef.trim().toUpperCase().match(/^([A-Z]+)([0-9]+)$/);
    if (!match) return null;

    const letter = match[1];
    const number = parseInt(match[2]);

    let column = 0;
    for (let i = 0; i < letter.length; i++) {
        column += (letter.charCodeAt(i) - 64) * Math.pow(26, letter.length - i - 1);
    }

    return {
        col: column - 1, // 0-based
        row: number - 1  // 0-based
    };
}

// Helper to fetch data for a specific link
async function fetchAndProcessLink(link: any) {
    let sheetValues = [];

    // Try to get cached data first
    const cachedData = await getCachedSheetData(link.id);

    if (cachedData.length > 0) {
        sheetValues = cachedData[0].data || [];
    } else {
         // Fetch from Google Sheets
         const sheets = getGoogleSheetsClient();
         if (!sheets) {
              console.error('Google Sheets configuration missing');
              return [];
         }

         const spreadsheetId = extractSpreadsheetId(link.sheet_url);
         if (!spreadsheetId) {
             console.error('Invalid Google Sheets URL for link', link.id);
             return [];
         }

         try {
            // Handle multiple tabs if specified in sheet_name (comma separated)
            const sheetTabs = link.sheet_name.split(',').map((s: string) => s.trim());

            for (const tab of sheetTabs) {
                 try {
                    const response = await sheets.spreadsheets.values.get({
                        spreadsheetId,
                        range: `${tab}!A:Z`,
                    });
                    if (response.data.values) {
                        sheetValues = [...sheetValues, ...response.data.values];
                    }
                 } catch (e) {
                     console.error(`Failed to fetch tab ${tab}`, e);
                 }
            }

            // Cache the raw data
            if (sheetValues.length > 0) {
                const config = link.configuration || {};
                let ttl = 300;

                if (config.auto_refresh && config.refresh_interval) {
                    ttl = config.refresh_interval * 60;
                }

                await cacheSheetData(link.id, sheetValues, ttl);
            }

         } catch (fetchError: any) {
             console.error('[v0] Google Sheets API error:', fetchError);
             return [];
         }
    }

    // Filter and Map Data
    const config = link.configuration || {};
    const colMap = config.columns || {};

    // 1. Parse all cell references to determine indices and Max Header Row
    const attributes = ['Nama', 'Judul', 'Tanggal', 'Jam', 'Ruangan'];
    let maxHeaderRow = 0;
    const mapConfig: any = {};

    attributes.forEach(attr => {
        const entry = colMap[attr];
        // Entry can be object { cell: "A1", label: "..." } or string "A" (legacy support if needed, but we migrated)
        // We'll assume new structure or fallback
        let cellRef = '';
        let label = '';

        if (typeof entry === 'object' && entry !== null) {
             cellRef = entry.cell || '';
             label = entry.label || '';
        } else if (typeof entry === 'string') {
             // Legacy fallback? Or user just entered "A".
             // If "A" (no number), parseCellReference returns null.
             // Let's assume if it's just letter, row is 0 (A1).
             if (entry.match(/^[A-Z]+$/)) {
                 cellRef = entry + '1';
             } else {
                 cellRef = entry;
             }
        }

        const parsed = parseCellReference(cellRef);
        if (parsed) {
            if (parsed.row > maxHeaderRow) maxHeaderRow = parsed.row;
            mapConfig[attr] = {
                colIndex: parsed.col,
                label: label || attr // Default to key if no label
            };
        } else {
            mapConfig[attr] = { colIndex: -1, label: attr };
        }
    });

    // 2. Check if we have enough data
    // Data starts AFTER the max header row
    if (sheetValues.length <= maxHeaderRow) return [];

    const dataRows = sheetValues.slice(maxHeaderRow + 1);

    // 3. Filter
    const filteredRows = filterDataForUpcomingWeek(dataRows, mapConfig['Tanggal']?.colIndex);

    // 4. Map
    const mappedData = filteredRows.map((row: any[]) => {
        const item: any = {};
        attributes.forEach(attr => {
            const idx = mapConfig[attr].colIndex;
            item[attr] = (idx !== -1 && row[idx]) ? row[idx] : '';
        });
        // Also attach labels metadata?
        // We return array of objects. We can't attach metadata easily to the array itself in JSON response unless we wrap it.
        // But `fetchAndProcessLink` returns just the array.
        // We can embed the label in the object? e.g. `_label_Nama`: "Student".
        // Or we rely on the API wrapper to provide labels?
        // Let's add `_labels` property to the first item? No that's messy.
        // Let's add a hidden property or just rely on the frontend not knowing labels for now?
        // The requirement was "bisa di custom pembacaannya" (reading can be customized).
        // The user inputs the Label. We should send it.
        // Let's attach `_labels` to EVERY item. Redundant but safe.
        // Or better: The GET response structure can handle it.
        item._labels = {};
        attributes.forEach(attr => {
             item._labels[attr] = mapConfig[attr].label;
        });
        return item;
    });

    return mappedData;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { linkId } = await request.json();

  try {
      const link = await getLinkForUser(linkId, session.user.email);
      if (!link) return NextResponse.json({ error: 'Link not found' }, { status: 404 });

      const data = await fetchAndProcessLink(link);
      await updateLinkLastAccessed(linkId);

      return NextResponse.json({
          data,
          sheetName: link.sheet_name,
          sheetUrl: link.sheet_url,
          fetchedAt: new Date(),
      });
  } catch (error) {
      console.error('Error:', error);
      return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
    try {
        const links = await getAllPublicLinks();

        const results = await Promise.all(links.map(async (link) => {
            try {
                const data = await fetchAndProcessLink(link);
                return data.map(item => ({
                    ...item,
                    source: link.sheet_name
                }));
            } catch (e) {
                console.error(`Failed to process link ${link.id}`, e);
                return [];
            }
        }));

        const allData = results.flat();

        return NextResponse.json({ data: allData, fetchedAt: new Date() });
    } catch (error) {
        console.error('Public fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch public data' }, { status: 500 });
    }
}
