import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

const isPostgreSQL = process.env.DATABASE_URL.startsWith('postgresql://') || process.env.DATABASE_URL.startsWith('postgres://');
const isSQLite = process.env.DATABASE_URL.startsWith('file:');

export default defineConfig({
  out: "./migrations",
  schema: isPostgreSQL ? "./shared/schema.ts" : "./shared/sqlite-schema.ts",
  dialect: isPostgreSQL ? "postgresql" : "sqlite",
  dbCredentials: isPostgreSQL ? {
    url: process.env.DATABASE_URL,
  } : {
    url: process.env.DATABASE_URL.replace('file:', ''),
  },
});
