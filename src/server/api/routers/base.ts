import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { findConfigFile } from "typescript";
import { parseFilterConfig, parseSortConfig } from "ritthickclone/types";

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
      const base = await ctx.db.base.findUnique({
        where: {
          id: input.id,
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
              records: true,
            },
          },
        },
      });

      if (!base) {
        return null;
      }

      // Transform the data to parse JSON fields into proper types
      return {
        ...base,
        tables: base.tables.map(table => ({
          ...table,
          sortConfig: parseSortConfig(table.sortConfig),
          filterConfig: parseFilterConfig(table.filterConfig),
        })),
      };
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

      await ctx.db.record.createMany({
        data: [
          {
            tableId: newTable.id,
            data: {},
          },
          {
            tableId: newTable.id,
            data: {},
          },
          {
            tableId: newTable.id,
            data: {},
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
    }),
  
  //Delete a record
  deleteRecord: protectedProcedure
  .input(z.object({
    recordId: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    // Verify the user owns this record through the table/base relationship
    const record = await ctx.db.record.findFirst({
      where: {
        id: input.recordId,
      },
      include: {
        table: {
          include: {
            base: true,
          },
        },
      },
    });

    if (!record || record.table.base.createdById !== ctx.session.user.id) {
      throw new Error("Record not found or access denied");
    }

    // Delete the record
    await ctx.db.record.delete({
      where: {
        id: input.recordId,
      },
    });

    return { success: true };
  }),
  
  //Add 100k Records
  createBulkRecords: protectedProcedure
    .input(z.object({
      tableId: z.string(),
      records: z.array(z.record(z.string(), z.any())),
    }))
    .mutation(async ({ ctx, input }) => {
      // Use batch insert for better performance
      const recordsToInsert = input.records.map(data => ({
        tableId: input.tableId,
        data: data,
      }));
      
    return await ctx.db.record.createMany({
      data: recordsToInsert,
    });
  }),

  //Deleting a base
  deleteBase: protectedProcedure
    .input(z.object({
      baseId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify the user owns this base
      const base = await ctx.db.base.findFirst({
        where: {
          id: input.baseId,
          createdById: ctx.session.user.id,
        },
      });

      if (!base) {
        throw new Error("Base not found or access denied");
      }

      // Delete the base (this will cascade delete tables, columns, and records)
      await ctx.db.base.delete({
        where: {
          id: input.baseId,
        },
      });

      return { success: true };
    }),

  //Deleting a column
  deleteColumn: protectedProcedure
    .input(z.object({
      columnId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify the user owns this column through the table/base relationship
      const column = await ctx.db.column.findFirst({
        where: {
          id: input.columnId,
        },
        include: {
          table: {
            include: {
              base: true,
            },
          },
        },
      });

      if (!column || column.table.base.createdById !== ctx.session.user.id) {
        throw new Error("Column not found or access denied");
      }

      // Delete the column
      await ctx.db.column.delete({
        where: {
          id: input.columnId,
        },
      });

      // Update positions of remaining columns
      await ctx.db.column.updateMany({
        where: {
          tableId: column.tableId,
          position: {
            gt: column.position,
          },
        },
        data: {
          position: {
            decrement: 1,
          },
        },
      });

      return { success: true };
    }),

  //Deleting a table
  deleteTable: protectedProcedure
    .input(z.object({
      tableId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify the user owns this table through the base relationship
      const table = await ctx.db.table.findFirst({
        where: {
          id: input.tableId,
        },
        include: {
          base: true,
        },
      });

      if (!table || table.base.createdById !== ctx.session.user.id) {
        throw new Error("Table not found or access denied");
      }

      // Delete the table (this will cascade delete columns and records)
      await ctx.db.table.delete({
        where: {
          id: input.tableId,
        },
      });

      return { success: true };
   }),

  // Save sort configuration
  updateTableSort: protectedProcedure
  .input(z.object({
    tableId: z.string(),
    sortConfig: z.array(z.object({
      columnId: z.string(),
      direction: z.enum(['asc', 'desc'])
    }))
  }))
  .mutation(async ({ ctx, input }) => {
    const table = await ctx.db.table.findUnique({
      where: { id: input.tableId },
      include: { columns: true, records: true },
    });

    if (!table) {
      throw new Error('Table not found');
    }

    // ✅ Apply sort and update record positions permanently
    if (input.sortConfig.length > 0) {
      const sortedRecords = table.records.sort((a, b) => {
        const aData = a.data as Record<string, any>;
        const bData = b.data as Record<string, any>;
        
        for (const sort of input.sortConfig) {
          const column = table.columns.find(col => col.id === sort.columnId);
          if (!column) continue;
          
          const fieldKey = column.name.toLowerCase().replace(/\s+/g, '');
          const aValue = aData[fieldKey];
          const bValue = bData[fieldKey];
          
          let comparison = 0;
          
          if (column.type === 'number') {
            const aNum = Number(aValue) || 0;
            const bNum = Number(bValue) || 0;
            comparison = aNum - bNum;
          } else {
            const aStr = String(aValue ?? '').toLowerCase();
            const bStr = String(bValue ?? '').toLowerCase();
            comparison = aStr.localeCompare(bStr);
          }
          
          if (comparison !== 0) {
            return sort.direction === 'desc' ? -comparison : comparison;
          }
        }
        return 0;
      });

      // ✅ Update position field for each record to save sorted order
      await Promise.all(
        sortedRecords.map((record, index) =>
          ctx.db.record.update({
            where: { id: record.id },
            data: { position: index }
          })
        )
      );
    }

    // Save sort config to table
    return await ctx.db.table.update({
      where: { id: input.tableId },
      data: { 
        sortConfig: input.sortConfig as any,
      },
    });
  }),

  // Save filter configuration
  updateTableFilters: protectedProcedure
    .input(z.object({
      tableId: z.string(),
      filterConfig: z.array(z.object({
        id: z.string(),
        columnId: z.string(),
        columnName: z.string(),
        columnType: z.string(),
        operator: z.string(),
        value: z.string()
      }))
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.table.update({
        where: {
          id: input.tableId,
        },
        data: {
          filterConfig: input.filterConfig,
        },
      });
    }),

  // Get records with sorting and filtering applied at DB level
  getTableRecords: protectedProcedure
  .input(z.object({
    tableId: z.string(),
    sortConfig: z.array(z.object({
      columnId: z.string(),
      direction: z.enum(['asc', 'desc'])
    })).optional(),
    filterConfig: z.array(z.object({
      id: z.string(),
      columnId: z.string(),
      columnName: z.string(),
      columnType: z.string(),
      operator: z.string(),
      value: z.string()
    })).optional(),
    cursor: z.string().optional(),
    limit: z.number().min(1).max(1000).default(100),
  }))
  .query(async ({ ctx, input }) => {
    const table = await ctx.db.table.findUnique({
      where: { id: input.tableId },
      include: {
        columns: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!table) {
      throw new Error('Table not found');
    }

    // ✅ Fetch records ordered by position (saved sort order)
    const allRecords = await ctx.db.record.findMany({
      where: {
        tableId: input.tableId,
      },
      orderBy: { position: 'asc' }, // Use saved position
    });

    // Apply filtering
    let filteredRecords = allRecords;
    if (input.filterConfig && input.filterConfig.length > 0) {
      filteredRecords = allRecords.filter(record => {
        const data = record.data as Record<string, any>;
        
        return input.filterConfig!.every(filter => {
          const column = table.columns.find(col => col.id === filter.columnId);
          if (!column) return true;
          
          const fieldKey = column.name.toLowerCase().replace(/\s+/g, '');
          const cellValue = data[fieldKey];
          const filterValue = filter.value;
          
          switch (filter.operator) {
            case 'contains':
              return String(cellValue ?? '').toLowerCase().includes(String(filterValue).toLowerCase());
            case 'not_contains':
              return !String(cellValue ?? '').toLowerCase().includes(String(filterValue).toLowerCase());
            case 'eq':
              return String(cellValue ?? '').toLowerCase() === String(filterValue).toLowerCase();
            case 'not_eq':
              return String(cellValue ?? '').toLowerCase() !== String(filterValue).toLowerCase();
            case 'is_empty':
              return !cellValue || String(cellValue) === '';
            case 'is_not_empty':
              return cellValue != null && String(cellValue) !== '';
            case 'gt':
              return !isNaN(Number(cellValue)) && !isNaN(Number(filterValue)) && Number(cellValue) > Number(filterValue);
            case 'lt':
              return !isNaN(Number(cellValue)) && !isNaN(Number(filterValue)) && Number(cellValue) < Number(filterValue);
            case 'gte':
              return !isNaN(Number(cellValue)) && !isNaN(Number(filterValue)) && Number(cellValue) >= Number(filterValue);
            case 'lte':
              return !isNaN(Number(cellValue)) && !isNaN(Number(filterValue)) && Number(cellValue) <= Number(filterValue);
            default:
              return true;
          }
        });
      });
    }

    // ✅ Only apply live sorting if sortConfig is provided in request
    if (input.sortConfig && input.sortConfig.length > 0) {
      filteredRecords = filteredRecords.sort((a, b) => {
        const aData = a.data as Record<string, any>;
        const bData = b.data as Record<string, any>;
        
        for (const sort of input.sortConfig!) {
          const column = table.columns.find(col => col.id === sort.columnId);
          if (!column) continue;
          
          const fieldKey = column.name.toLowerCase().replace(/\s+/g, '');
          const aValue = aData[fieldKey];
          const bValue = bData[fieldKey];
          
          let comparison = 0;
          
          if (column.type === 'number') {
            const aNum = Number(aValue) || 0;
            const bNum = Number(bValue) || 0;
            comparison = aNum - bNum;
          } else {
            const aStr = String(aValue ?? '').toLowerCase();
            const bStr = String(bValue ?? '').toLowerCase();
            comparison = aStr.localeCompare(bStr);
          }
          
          if (comparison !== 0) {
            return sort.direction === 'desc' ? -comparison : comparison;
          }
        }
        return 0;
      });
    }

    // Apply pagination
    let startIndex = 0;
    if (input.cursor) {
      startIndex = filteredRecords.findIndex(r => r.id === input.cursor);
      if (startIndex !== -1) {
        startIndex += 1;
      } else {
        startIndex = 0;
      }
    }

    const paginatedRecords = filteredRecords.slice(startIndex, startIndex + input.limit);
    const hasNextPage = startIndex + input.limit < filteredRecords.length;
    const nextCursor = hasNextPage ? paginatedRecords[paginatedRecords.length - 1]?.id : null;

    return {
      records: paginatedRecords,
      nextCursor,
      hasNextPage,
    };
  }),


  // Get total count for a table
  getTableRecordCount: protectedProcedure
    .input(z.object({
      tableId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.db.record.count({
        where: {
          tableId: input.tableId,
        },
      });
    }),
});

