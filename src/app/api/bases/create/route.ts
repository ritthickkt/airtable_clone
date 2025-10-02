import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '../../../../server/auth';
import { db } from '../../../../server/db';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json() as { name: string };

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Base name is required' }, { status: 400 });
    }
    

    const newBase = await db.base.create({
      data: {
        name: name.trim(),
        createdById: session.user.id,
      },
    });

    return NextResponse.json(newBase);
  } catch (error) {
    console.error('Error creating base:', error);
    return NextResponse.json(
      { error: 'Failed to create base' },
      { status: 500 }
    );
  }
}