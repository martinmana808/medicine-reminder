// Applies lib/schema.sql to the database in DATABASE_URL.
// Loads .env.local automatically if present.
import { readFileSync, existsSync } from "node:fs";
import pg from "pg";

function loadEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2];
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
}

loadEnv(new URL("../.env.local", import.meta.url).pathname);

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set (add it to .env.local).");
  process.exit(1);
}

const isLocal =
  connectionString.includes("localhost") ||
  connectionString.includes("127.0.0.1");
const sql = readFileSync(
  new URL("../lib/schema.sql", import.meta.url).pathname,
  "utf8",
);

const client = new pg.Client({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log("Migration applied successfully.");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
