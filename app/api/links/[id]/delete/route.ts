import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { deleteLinkForUser, getLinkForUser } from '@/app/api/db';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function DELETE(
  request: NextRequest,
  // Ubah tipe params menjadi Promise
  { params }: { params: Promise<{ id: string }> } 
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Await params terlebih dahulu
  const { id } = await params; 

  const linkId = parseInt(id, 10);
  
  if (isNaN(linkId)) {
    return NextResponse.json({ error: 'Invalid link ID' }, { status: 400 });
  }

  try {
    const link = await getLinkForUser(linkId, session.user.email);

    if (!link) {
      return NextResponse.json({ error: 'Link not found or unauthorized' }, { status: 404 });
    }

    await deleteLinkForUser(linkId, session.user.email);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Delete link error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
