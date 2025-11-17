import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { linkId } = await request.json();

  try {
    // Get link details
    const linkResult = await sql`
      SELECT sl.* FROM spreadsheet_links sl
      JOIN users u ON sl.user_id = u.id
      WHERE sl.id = ${linkId} AND u.email = ${session.user.email}
    `;

    if (linkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    const link = linkResult.rows[0];

    const cacheResult = await sql`
      SELECT data FROM sheet_data_cache 
      WHERE link_id = ${linkId} AND expires_at > NOW() 
      ORDER BY cached_at DESC LIMIT 1
    `;

    let todayData = [];
    if (cacheResult.rows.length > 0) {
      todayData = cacheResult.rows[0].data.values || [];
    }

    await sql`
      UPDATE spreadsheet_links SET last_accessed = CURRENT_TIMESTAMP WHERE id = ${linkId}
    `;

    return NextResponse.json({
      data: todayData,
      sheetName: link.sheet_name,
      sheetUrl: link.sheet_url,
      fetchedAt: new Date(),
    });
  } catch (error) {
    console.error('[v0] Fetch sheet error:', error);
    return NextResponse.json({ error: 'Failed to fetch sheet' }, { status: 500 });
  }
}
