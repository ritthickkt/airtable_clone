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
});