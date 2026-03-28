import { MongoMemoryServer } from "mongodb-memory-server";

let memoryServer;

/**
 * If MONGODB_URI is set → use it.
 * Else if USE_MEMORY_DB is not "0" → in-memory Mongo (prototype; data lost on exit).
 * Else → local mongod.
 */
export async function resolveMongoUri() {
  const explicit = process.env.MONGODB_URI?.trim();
  if (explicit) return explicit;

  if (process.env.USE_MEMORY_DB === "0") {
    return "mongodb://127.0.0.1:27017/fintech_campus";
  }

  memoryServer = await MongoMemoryServer.create();
  const base = memoryServer.getUri();
  const path = base.endsWith("/") ? `${base}fintech_campus` : `${base}/fintech_campus`;
  console.log("Using in-memory MongoDB (set MONGODB_URI or USE_MEMORY_DB=0 for a real server)");
  return path;
}
