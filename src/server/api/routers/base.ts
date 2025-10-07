import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { findConfigFile } from "typescript";

export const baseRouter = createTRPCRouter({
  // Get all bases for a user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.base.findMany({
      where: {
        createdById: ctx.session.user.id,
      },
      include: {
        tables: {
          include: {
            columns: {
              orderBy: {
                position: 'asc',
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }),

  // Get a specific base by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.base.findUnique({
        where: {
          id: input.id,
          createdById: ctx.session.user.id, // Ensure user owns the base
        },
        include: {
          tables: {
            include: {
              columns: {
                orderBy: {
                  position: 'asc',
                },
              },
              records: true,
            },
          },
        },
      });
    }),

  // Update base name
  updateName: protectedProcedure
    .input(z.object({ 
      id: z.string(),
      name: z.string().min(1)
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.base.update({
        where: {
          id: input.id,
          createdById: ctx.session.user.id,
        },
        data: {
          name: input.name,
        },
      });
    }),

  // Update a particular cell
  updateCell: protectedProcedure
    .input(z.object({
      recordId: z.string(),
      fieldKey: z.string(),
      value: z.any()
    }))
    .mutation(async ({ ctx, input }) => {
      // ✅ Use Prisma's JSON path update (more efficient)
      return ctx.db.record.update({
        where: {
          id: input.recordId,
        },
        data: {
          data: {
            // This merges the new value with existing JSON data
            ...(await ctx.db.record.findUnique({
              where: { id: input.recordId },
              select: { data: true }
            }))?.data as object || {},
            [input.fieldKey]: input.value
          }
        }
      });
    }),

  // Create a New Row
  createRecord: protectedProcedure
    .input(z.object({
      tableId: z.string(),
      data: z.record(z.any()).optional().default({}),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify the user owns the table/base
      const table = await ctx.db.table.findFirst({
        where: {
          id: input.tableId,
          base: {
            createdById: ctx.session.user.id,
          },
        },
      });

      if (!table) {
        throw new Error("Table not found or access denied");
      }

      return ctx.db.record.create({
        data: {
          tableId: input.tableId,
          data: input.data,
        },
      });
    }),
  
  // Create a New Col
  createColumn: protectedProcedure
    .input(z.object({
      tableId: z.string(),
      name: z.string().min(1),
      type: z.enum(['text', 'select', 'status', 'attachment', 'number']).default('text'),
      position: z.number().optional(),
      options: z.any().optional(),
    }))
    .mutation(async ({ ctx, input}) => {
      const table = await ctx.db.table.findFirst({
        where: {
          id: input.tableId,
          base: {
            createdById: ctx.session.user.id,
          },
        },
        include: {
          columns: true,
        },
      });

      if (!table) {
        throw new Error("Table not found or access denied!");
      }

      const position = input.position ?? (table.columns.length);

      return ctx.db.column.create({
        data: {
          name: input.name,
          type: input.type,
          position: position,
          tableId: input.tableId,
          options: input.options ?? {},
        },
      });
    }),

  //Create a New Table
  createTable: protectedProcedure
    .input(z.object({
      baseId: z.string(),
    }))
    .mutation(async ({ ctx, input}) => {
      // Verify that the user owns the base
      const base = await ctx.db.base.findFirst({
        where: {
          id: input.baseId,
          createdById: ctx.session.user.id,
        },
        include: {
          tables: true
        },
      });

      if (!base) {
        throw new Error("Base not found or access denied");
      }

      const tableNumber = base.tables.length + 1;
      const tableName = `Table ${tableNumber}`;

      const newTable = await ctx.db.table.create({
        data: {
          name: tableName, 
          baseId: input.baseId,
        },
      });

      await ctx.db.column.createMany({
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


      return ctx.db.table.findUnique({
        where: { id: newTable.id },
        include: {
          columns: {
            orderBy: {
              position: 'asc',
            },
          },
          records: true,
        },
      });
    })
});