import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getLinkForUser, getCachedSheetData, updateLinkLastAccessed, cacheSheetData, getAllPublicLinks, getUserRefreshToken } from '@/app/api/db';
import { NextRequest, NextResponse } from 'next/server';
import { getUserGoogleSheetsClient, extractSpreadsheetId } from '@/lib/google-sheets';
import { filterDataForUpcomingWeek } from '@/lib/date-filter';

export const runtime = 'nodejs';
// Penting: Set dynamic agar tidak di-cache statis oleh Vercel/Next.js saat build
export const dynamic = 'force-dynamic';

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
async function fetchAndProcessLink(link: any, accessToken?: string) {
    let sheetValues = [];

    // 1. CEK CACHE DATABASE
    // getCachedSheetData query-nya sudah otomatis filter "WHERE expires_at > NOW()"
    // Jadi jika ada return, berarti cache masih valid/fresh.
    const cachedData = await getCachedSheetData(link.id);

    if (cachedData.length > 0) {
        console.log(`[Cache Hit] Menggunakan data tersimpan untuk link ${link.id}`);
        sheetValues = cachedData[0].data || [];
    } else {
         console.log(`[Cache Miss] Fetching live data untuk link ${link.id}`);

         // 2. FETCH DARI GOOGLE (Jika Cache Miss/Expired)
         let client;
         if (accessToken) {
             client = getUserGoogleSheetsClient(accessToken);
         } else {
             const refreshToken = await getUserRefreshToken(link.user_id);
             if (refreshToken) {
                 client = getUserGoogleSheetsClient(undefined, refreshToken);
             }
         }

         if (!client) {
              console.error('Google Sheets client unavailable - Token missing or invalid');
              return [];
         }

         const spreadsheetId = extractSpreadsheetId(link.sheet_url);
         if (!spreadsheetId) return [];

         try {
            const sheetTabs = link.sheet_name.split(',').map((s: string) => s.trim());

            for (const tab of sheetTabs) {
                 try {
                    const response = await client.spreadsheets.values.get({
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

            // 3. SIMPAN CACHE BARU
            if (sheetValues.length > 0) {
                const config = link.configuration || {};

                // Default Cache Time: 5 menit (300 detik) jika tidak diset
                // Ini cukup cepat untuk user experience, tapi cukup lama agar tidak spam API Google
                let ttl = 300;

                if (config.refresh_interval) {
                    ttl = config.refresh_interval * 60; // Convert menit ke detik
                }

                // Kita SELALU cache, tidak peduli auto_refresh true/false
                // karena ini mekanisme dasar performa aplikasi tanpa Cron
                await cacheSheetData(link.id, sheetValues, ttl);
            }

         } catch (fetchError: any) {
             console.error('[API Error] Google Sheets:', fetchError);
             return [];
         }
    }

    // --- PROSES MAPPING & FILTERING (Sama seperti sebelumnya) ---
    const config = link.configuration || {};
    const colMap = config.columns || {};

    const attributes = ['Nama', 'Judul', 'Tanggal', 'Jam', 'Ruangan'];
    let maxHeaderRow = 0;
    const mapConfig: any = {};

    attributes.forEach(attr => {
        const entry = colMap[attr];
        let cellRef = '';
        let label = '';

        if (typeof entry === 'object' && entry !== null) {
             cellRef = entry.cell || '';
             label = entry.label || '';
        } else if (typeof entry === 'string') {
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
                label: label || attr
            };
        } else {
            mapConfig[attr] = { colIndex: -1, label: attr };
        }
    });

    if (sheetValues.length <= maxHeaderRow) return [];

    const dataRows = sheetValues.slice(maxHeaderRow + 1);
    const filteredRows = filterDataForUpcomingWeek(dataRows, mapConfig['Tanggal']?.colIndex);

    const mappedData = filteredRows.map((row: any[]) => {
        const item: any = {};
        attributes.forEach(attr => {
            const idx = mapConfig[attr].colIndex;
            item[attr] = (idx !== -1 && row[idx]) ? row[idx] : '';
        });

        item._labels = {};
        attributes.forEach(attr => {
             item._labels[attr] = mapConfig[attr].label;
        });

        item._department = config.department || 'Umum';
        item._type = config.type || 'proposal';

        return item;
    });

    return mappedData;
}

// Endpoint untuk Admin (Preview)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // @ts-ignore
  const userAccessToken = session.accessToken;
  const { linkId } = await request.json();

  try {
      const link = await getLinkForUser(linkId, session.user.email);
      if (!link) return NextResponse.json({ error: 'Link not found' }, { status: 404 });

      // Force fetch live data untuk admin preview (opsional, bisa diubah logicnya)
      // Di sini kita pakai fungsi yang sama, dia akan cek cache dulu.
      // Admin bisa tekan tombol "Refresh" di UI yang mentrigger endpoint lain jika mau paksa update.
      const data = await fetchAndProcessLink(link, userAccessToken);
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

// Endpoint untuk Public View (Homepage)
export async function GET(request: NextRequest) {
    try {
        const links = await getAllPublicLinks();

        // Gunakan Promise.all untuk memproses semua link secara PARALEL
        // Ini penting agar user tidak menunggu terlalu lama jika ada banyak link
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

        return NextResponse.json({
            data: allData,
            fetchedAt: new Date(),
            cached: true // Indikator bahwa sistem caching aktif
        });
    } catch (error) {
        console.error('Public fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch public data' }, { status: 500 });
    }
}
