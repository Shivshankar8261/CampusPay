import { MongoMemoryServer } from "mongodb-memory-server";
import path from "node:path";
import fs from "node:fs/promises";

let memoryServer;

function pickRandomPort() {
  // Keep well away from common dev ports and 27017.
  return 20000 + Math.floor(Math.random() * 20000);
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

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

  // mongodb-memory-server can occasionally hit EADDRINUSE on some environments
  // (e.g. if the default port is occupied). Retry with random high ports.
  let lastErr;
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const port = pickRandomPort();
      const dbPath = path.join(process.cwd(), ".mongo-memory", `${Date.now()}-${port}`);
      await ensureDir(dbPath);
      memoryServer = await MongoMemoryServer.create({ instance: { port, dbPath } });
      lastErr = undefined;
      break;
    } catch (err) {
      lastErr = err;
    }
  }
  if (!memoryServer) throw lastErr ?? new Error("Failed to start in-memory MongoDB");

  const base = memoryServer.getUri();
  const uri = base.endsWith("/") ? `${base}fintech_campus` : `${base}/fintech_campus`;
  console.log("Using in-memory MongoDB (set MONGODB_URI or USE_MEMORY_DB=0 for a real server)");
  return uri;
}
