/**
 * Common TypeScript types used across the application
 */

// TODO: Define database types manually based on Prisma schema
// For now, using basic types. Generate proper types from schema as needed.

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Query filters
export interface DateRangeFilter {
  from?: Date;
  to?: Date;
}

export interface SearchParams extends PaginationParams {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

