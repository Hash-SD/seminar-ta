import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getLinkForUser, getCachedSheetData, updateLinkLastAccessed } from '@/app/api/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { linkId } = await request.json();
  if (!linkId) {
    return NextResponse.json({ error: 'Missing linkId' }, { status: 400 });
  }

  try {
    const link = await getLinkForUser(linkId, session.user.email);

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    const cachedData = await getCachedSheetData(linkId);

    let todayData = [];
    if (cachedData.length > 0) {
      todayData = cachedData[0].data.values || [];
    }

    await updateLinkLastAccessed(linkId);

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
