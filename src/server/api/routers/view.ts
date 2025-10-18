import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const viewRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        tableId: z.string(),
        name: z.string(),
        config: z.object({
          hiddenColumns: z.array(z.string()),
          sort: z.array(
            z.object({
              columnId: z.string(),
              direction: z.enum(['asc', 'desc']), 
            })
          ),
          filters: z.array(
            z.object({
              id: z.string(),
              columnId: z.string(),
              columnName: z.string(),
              columnType: z.string(),
              operator: z.string(),
              value: z.string(),
            })
          ),
          searchTerm: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const view = await ctx.db.view.create({
        data: {
          tableId: input.tableId,
          name: input.name,
          type: 'grid',
          config: input.config,
        },
      });

      return view;
    }),
  
  update: protectedProcedure
    .input(
      z.object({
        viewId: z.string(),
        name: z.string().optional(),
        config: z.object({
          hiddenColumns: z.array(z.string()),
          sort: z.array(
            z.object({
              columnId: z.string(),
              direction: z.enum(['asc', 'desc']),
            })
          ),
          filters: z.array(
            z.object({
              id: z.string(),
              columnId: z.string(),
              columnName: z.string(),
              columnType: z.string(),
              operator: z.string(),
              value: z.string(),
            })
          ),
          searchTerm: z.string().optional(),
        }).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: any = {};

      if (input.name) updateData.name = input.name;
      if (input.config) updateData.config = input.config;

      const view = await ctx.db.view.update({
        where: { id: input.viewId },
        data: updateData,
      });

      return view;
    }),

    delete: protectedProcedure
      .input(z.object({ viewId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await ctx.db.view.delete({
          where: { id: input.viewId },
        });
        return { success: true };
      }),

    getByTableId: protectedProcedure
      .input(z.object({ tableId: z.string() }))
      .query(async ({ ctx, input }) => {
        return await ctx.db.view.findMany({
          where: { tableId: input.tableId },
          orderBy: { createdAt: 'asc' },
        });
      }),
});