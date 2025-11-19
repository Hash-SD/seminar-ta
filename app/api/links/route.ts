import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getLinksByUserEmail, getUserByEmail, upsertLink, createLinkHistory } from '@/app/api/db';
import { NextRequest, NextResponse } from 'next/server';

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

  const { sheet_url, sheet_name } = await request.json();

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

    const newLink = await upsertLink(userId, sheet_url, sheet_name);

    await createLinkHistory(newLink.id, 'created', sheet_url);

    return NextResponse.json(newLink, { status: 201 });
  } catch (error) {
    console.error('[v0] Post link error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
