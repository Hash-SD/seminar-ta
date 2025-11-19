import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { deleteLinkForUser } from '@/app/api/db';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const linkId = parseInt(params.id, 10);
  if (isNaN(linkId)) {
    return NextResponse.json({ error: 'Invalid link ID' }, { status: 400 });
  }

  try {
    const deletedCount = await deleteLinkForUser(linkId, session.user.email);

    if (deletedCount === 0) {
      return NextResponse.json({ error: 'Link not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Delete link error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
