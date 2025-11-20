import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getLinkForUser, getCachedSheetData, updateLinkLastAccessed, cacheSheetData, getAllPublicLinks } from '@/app/api/db';
import { NextRequest, NextResponse } from 'next/server';
import { getGoogleSheetsClient, extractSpreadsheetId } from '@/lib/google-sheets';
import { filterDataForUpcomingWeek } from '@/lib/date-filter';

export const runtime = 'nodejs';

// Helper to convert column letter (e.g., 'A', 'AA') to 0-based index
function columnLetterToIndex(letter: string): number {
    if (!letter) return -1;
    let column = 0;
    const cleanLetter = letter.trim().toUpperCase();
    for (let i = 0; i < cleanLetter.length; i++) {
        column += (cleanLetter.charCodeAt(i) - 64) * Math.pow(26, cleanLetter.length - i - 1);
    }
    return column - 1;
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
    const config = link.configuration || {};
    const colMap = config.columns || {};
    const headerRowIndex = (config.header_row || 1) - 1; // 0-based index

    if (sheetValues.length <= headerRowIndex) return [];

    // Convert mapped Letters (A, B) to Indices (0, 1)
    const indices = {
        nama: columnLetterToIndex(colMap.Nama),
        judul: columnLetterToIndex(colMap.Judul),
        tanggal: columnLetterToIndex(colMap.Tanggal),
        jam: columnLetterToIndex(colMap.Jam),
        ruangan: columnLetterToIndex(colMap.Ruangan),
    };

    // Data rows start AFTER the header row
    const dataRows = sheetValues.slice(headerRowIndex + 1);

    // Use the new "Upcoming Week" filter logic
    const filteredRows = filterDataForUpcomingWeek(dataRows, indices.tanggal);

    // Map the rows to the standard object structure
    const mappedData = filteredRows.map((row: any[]) => ({
        Nama: indices.nama !== -1 && row[indices.nama] ? row[indices.nama] : '',
        Judul: indices.judul !== -1 && row[indices.judul] ? row[indices.judul] : '',
        Tanggal: indices.tanggal !== -1 && row[indices.tanggal] ? row[indices.tanggal] : '',
        Jam: indices.jam !== -1 && row[indices.jam] ? row[indices.jam] : '',
        Ruangan: indices.ruangan !== -1 && row[indices.ruangan] ? row[indices.ruangan] : '',
    }));

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
