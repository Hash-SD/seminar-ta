import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getLinksByUserEmail, getUserByEmail, addSpreadsheetLink, createLinkHistory, upsertLink, updateLinkConfiguration } from '@/app/api/db';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const links = await getLinksByUserEmail(session.user.email);
    return NextResponse.json(links);
  } catch (error) {
    console.error('[v0] Get links error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sheet_url, sheet_name, configuration } = await request.json();

  if (!sheet_url || !sheet_name) {
    return NextResponse.json(
      { error: 'Missing sheet_url or sheet_name' },
      { status: 400 }
    );
  }

  try {
    const users = await getUserByEmail(session.user.email);
    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userId = users[0].id;

    // We use addSpreadsheetLink instead of upsertLink to support adding the configuration on insert
    // Note: The original code used upsertLink which handles conflict on user_id + sheet_url.
    // If we want to update configuration if it exists, we should check if it exists or modify upsertLink.
    // For simplicity, let's use the existing logic but update the configuration afterwards if needed,
    // OR use a more robust upsert.
    // Given the DB schema change, let's stick to upsertLink logic but I need to update `upsertLink` in db.ts?
    // Wait, `upsertLink` in `db.ts` does NOT take configuration.
    // I'll assume for this task, the user might be adding a new link.

    // However, to be safe and clean, I will try to find the link first or just use upsertLink and then update config.

    let link = await upsertLink(userId, sheet_url, sheet_name);

    if (configuration) {
        link = await updateLinkConfiguration(link.id, configuration);
    }

    await createLinkHistory(link.id, 'upsert', sheet_url);

    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    console.error('[v0] Post link error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
