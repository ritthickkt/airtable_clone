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

export async function POST(request: Request) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json() as { name: string };
    
    // Create base first
    const newBase = await db.base.create({
      data: {
        name: body.name,
        color: getRandomColor(),
        createdById: session.user.id,
      },
    });

    // Return immediately with base info
    const response = NextResponse.json(newBase);

    // Create table asynchronously after response is sent
    // This happens in the background without blocking the response
    setImmediate(async () => {
      try {
        const newTable = await db.table.create({
          data: {
            name: 'Table 1',
            baseId: newBase.id,
          },
        });

        await db.column.createMany({
          data: [
            {
              name: 'Name',
              type: 'text',
              position: 0,
              tableId: newTable.id,
            },
            {
              name: 'Notes',
              type: 'text',
              position: 1,
              tableId: newTable.id,
            },
            {
              name: 'Assignee',
              type: 'text',
              position: 2,
              tableId: newTable.id,
              options: {
                choices: [
                  { name: 'Mega Knight', color: 'blue'},
                  { name: 'The Log', color: 'blue'},
                ]
              },
            },
            {
              name: 'Status',
              type: 'text',
              position: 3,
              tableId: newTable.id,
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
              type: 'text',
              position: 4,
              tableId: newTable.id,
            },
            {
              name: 'Attachment Summary',
              type: 'text',
              position: 5,
              tableId: newTable.id,
            },
          ],
        });

        await db.record.createMany({
          data: [
            { tableId: newTable.id, data: {} },
            { tableId: newTable.id, data: {} },
            { tableId: newTable.id, data: {} },
          ],
        });

        console.log(`✅ Table created for base ${newBase.id}`);
      } catch (error) {
        console.error(`❌ Failed to create table for base ${newBase.id}:`, error);
      }
    });

    return response;
  } catch (error) {
    console.error('Error creating base:', error);
    return NextResponse.json(
      { error: 'Failed to create base' },
      { status: 500 }
    );
  }
}