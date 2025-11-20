import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getLinksByUserEmail, getUserByEmail, upsertUser, createLinkHistory, upsertLink, updateLinkConfiguration } from '@/app/api/db';
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
    let userId: number;
    const users = await getUserByEmail(session.user.email);

    if (users.length === 0) {
       // User doesn't exist yet? Create them.
       // We might not have google_id here if only email is in session, but we need to create the record.
       // Assuming we can create with a placeholder or the email is the key.
       // DB schema: email UNIQUE NOT NULL, google_id UNIQUE.
       const name = session.user.name || 'Admin User';
       // We use a dummy google_id or handle it.
       // Ideally, we should have captured it in signIn.
       // Let's try to find if `upsertUser` can handle this.
       // For now, let's try to create.
       try {
           const newUser = await upsertUser(session.user.email, `manual-${Date.now()}`, name);
           if (newUser && newUser.length > 0) {
               userId = newUser[0].id;
           } else {
               throw new Error('Failed to create user');
           }
       } catch (createError) {
           console.error('Failed to auto-create user:', createError);
           return NextResponse.json({ error: 'User not found and creation failed' }, { status: 500 });
       }
    } else {
        userId = users[0].id;
    }

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
