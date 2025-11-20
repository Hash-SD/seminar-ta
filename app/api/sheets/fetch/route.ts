import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getLinkForUser, getCachedSheetData, updateLinkLastAccessed, cacheSheetData, getAllPublicLinks } from '@/app/api/db';
import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheetsClient, extractSpreadsheetId } from '@/lib/google-sheets';
import { filterDataForUpcomingWeek } from '@/lib/date-filter';

export const runtime = 'nodejs';

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
                        // Naive concat, assumes similar structure or we filter later
                        sheetValues = [...sheetValues, ...response.data.values];
                    }
                 } catch (e) {
                     console.error(`Failed to fetch tab ${tab}`, e);
                 }
            }

            // Cache the raw data
            if (sheetValues.length > 0) {
                // Determine cache duration
                const config = link.configuration || {};
                let ttl = 300; // Default 5 minutes

                if (config.auto_refresh && config.refresh_interval) {
                    // Convert minutes to seconds
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
    // Use the configuration to map columns
    const config = link.configuration || {};
    const colMap = config.columns || {};

    // We need to find the index of each mapped column in the header row.
    if (sheetValues.length === 0) return [];

    // Simple header detection: First row
    // Find the header row - sometimes it's not the first row?
    // Let's assume first row for now as per standard.
    const headers = sheetValues[0].map((h: string) => String(h).trim().toLowerCase());

    // Map config names to indices
    const indices = {
        nama: headers.indexOf((colMap.Nama || '').toLowerCase()),
        judul: headers.indexOf((colMap.Judul || '').toLowerCase()),
        tanggal: headers.indexOf((colMap.Tanggal || '').toLowerCase()),
        jam: headers.indexOf((colMap.Jam || '').toLowerCase()),
        ruangan: headers.indexOf((colMap.Ruangan || '').toLowerCase()),
    };

    // Use the new "Upcoming Week" filter logic
    // It handles both specific column check (if indices.tanggal !== -1) AND full-row fallback
    const filteredRows = filterDataForUpcomingWeek(sheetValues.slice(1), indices.tanggal);

    // Map the rows to the standard object structure
    const mappedData = filteredRows.map((row: any[]) => ({
        Nama: indices.nama !== -1 ? row[indices.nama] : '',
        Judul: indices.judul !== -1 ? row[indices.judul] : '',
        Tanggal: indices.tanggal !== -1 ? row[indices.tanggal] : '',
        Jam: indices.jam !== -1 ? row[indices.jam] : '',
        Ruangan: indices.ruangan !== -1 ? row[indices.ruangan] : '',
    }));

    return mappedData;
}

export async function POST(request: NextRequest) {
  // Admin fetch endpoint
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

// Public Endpoint to get all schedule data
export async function GET(request: NextRequest) {
    try {
        const links = await getAllPublicLinks();

        // Use Promise.all to fetch data concurrently for better performance
        // Note: Be mindful of Google API rate limits if there are many links not in cache.
        // Since we cache, it should be fine mostly.
        const results = await Promise.all(links.map(async (link) => {
            try {
                const data = await fetchAndProcessLink(link);
                // Add metadata about source
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
