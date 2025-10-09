import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '../../../../server/auth';
import { db } from '../../../../server/db';

const BASE_COLORS = [
    '#FFD4E0', '#DC043B', '#994559', '#FF30CC', '#D54402', '#944D37',
    '#FFEAB6', '#FFBE06', '#A26810', '#CFF5D1', '#058A0D', '#407C4A',
    '#C1F5F0', '#04DDD5', '#0C7F78', '#C4ECFF', '#39CAFF', '#107DA3',
    '#D0E2FF', '#156EE1', '#3B66A3', '#FAD2FC', '#DD04A8', '#8C3F78',
    '#E0DAFD', '#7C37EF', '#63498D', '#E5E9F1', '#616670', '#535965'
  ];

  const getRandomColor = () => {
    return BASE_COLORS[Math.floor(Math.random() * BASE_COLORS.length)]
  };

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
          color: getRandomColor(),
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
          type: 'text',
          position: 2,
          tableId: defaultTable.id,
        },
        {
          name: 'Status',
          type: 'text',
          position: 3,
          tableId: defaultTable.id,
        },
        {
          name: 'Attachments',
          type: 'text',
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

      const defaultRecords = [
        {
          tableId: defaultTable.id,
          data: {
            name: '',
            notes: '',
            assignee: '',
            status: '',
            attachments: '',
            attachmentsummary: '',
          }
        },
        {
          tableId: defaultTable.id,
          data: {
            name: '',
            notes: '',
            assignee: '',
            status: '',
            attachments: '',
            attachmentsummary: '',
          }
        },
        {
          tableId: defaultTable.id,
          data: {
            name: '',
            notes: '',
            assignee: '',
            status: '',
            attachments: '',
            attachmentsummary: '',
          }
        }
      ];

      const createdRecords = await Promise.all(
        defaultRecords.map(record => 
          tx.record.create({
            data: record,
          })
        )
      );

      return {
        ...newBase,
        tables: [{
          ...defaultTable,
          columns: createdColumns,
          records: createdRecords,
        }],
      };
    }, {
      timeout: 10000,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating base:', error);
    return NextResponse.json(
      { error: 'Failed to create base' },
      { status: 500 }
    );
  }
}