import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

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
});