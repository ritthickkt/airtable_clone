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


    const result = await db.$transaction(async (tx) => {
      const newBase = await tx.base.create({
        data: {
          name: name.trim(),
          createdById: session.user.id,
        },
      });

      const defaultTable = await tx.table.create({
        data: {
          name: 'Table 1',
          baseId: newBase.id,
        },
      });

      const defaultColumns = [
        {
          name: 'Name',
          type: 'text',
          position: 0,
          tableId: defaultTable.id,
        },
        {
          name: 'Notes',
          type: 'text',
          position: 1,
          tableId: defaultTable.id,
        },
        {
          name: 'Assignee',
          type: 'select',
          position: 2,
          tableId: defaultTable.id,
          options: {
            choices: [
              { name: 'Mega Knight', color: 'blue'},
              { name: 'The Log', color: 'blue'},
            ]
          },
        },
        {
          name: 'Status',
          type: 'selct',
          position: 3,
          tableId: defaultTable.id,
          options: {
            choices: [
              { name: 'Todo', color: 'gray' },
              { name: 'In Progress', color: 'yellow'},
              { name: 'Done', color: 'green'},
              { name: 'Blocked', color: 'red'},
            ]
          },
        },
        {
          name: 'Attachments',
          type: 'attachment',
          position: 4,
          tableId: defaultTable.id,
        },
        {
          name: 'Attachment Summary',
          type: 'text', 
          position: 5,
          tableId: defaultTable.id,
        },
      ];
      
      const createdColumns = await Promise.all(
        defaultColumns.map(column => 
          tx.column.create({
            data:column,
          })
        )
      );

      return {
        ...newBase,
        tables: [{
          ...defaultTable,
          columns: createdColumns,
        }],
      };
    });

    // const newBase = await db.base.create({
    //   data: {
    //     name: name.trim(),
    //     createdById: session.user.id,
    //   },
    // });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating base:', error);
    return NextResponse.json(
      { error: 'Failed to create base' },
      { status: 500 }
    );
  }
}