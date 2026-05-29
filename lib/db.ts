import { Pool } from "pg";

declare global {
  var __medPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const isLocal =
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1");
  return new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 3,
  });
}

/** Lazily create and reuse the pool (never at import time, so builds don't need a DB). */
function getPool(): Pool {
  if (!global.__medPool) {
    global.__medPool = createPool();
  }
  return global.__medPool;
}

export async function query<T = unknown>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const res = await getPool().query(text, params as never[]);
  return res.rows as T[];
}
