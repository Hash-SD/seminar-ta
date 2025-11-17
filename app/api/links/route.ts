import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await sql`
      SELECT sl.* FROM spreadsheet_links sl
      JOIN users u ON sl.user_id = u.id
      WHERE u.email = ${session.user.email}
      ORDER BY sl.updated_at DESC
    `;

    return NextResponse.json(result.rows);
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
    const userResult = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `;

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = userResult.rows[0].id;

    const linkResult = await sql`
      INSERT INTO spreadsheet_links (user_id, sheet_url, sheet_name)
      VALUES (${userId}, ${sheet_url}, ${sheet_name})
      ON CONFLICT (user_id, sheet_url) DO UPDATE 
      SET sheet_name = ${sheet_name}, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    await sql`
      INSERT INTO link_history (link_id, action, new_value)
      VALUES (${linkResult.rows[0].id}, 'created', ${sheet_url})
    `;

    return NextResponse.json(linkResult.rows[0], { status: 201 });
  } catch (error) {
    console.error('[v0] Post link error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
