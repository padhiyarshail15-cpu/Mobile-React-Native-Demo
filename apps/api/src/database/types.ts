import type { Pool } from 'pg';

// Anything with pg's query() works: the real Pool, or a fake in tests.
export type Queryable = Pick<Pool, 'query'>;
