import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const linkResult = await sql`
      SELECT sl.id FROM spreadsheet_links sl
      JOIN users u ON sl.user_id = u.id
      WHERE sl.id = ${params.id} AND u.email = ${session.user.email}
    `;

    if (linkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Link not found or unauthorized' }, { status: 404 });
    }

    // Delete link (cascade will handle related records)
    await sql`DELETE FROM spreadsheet_links WHERE id = ${params.id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Delete link error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
