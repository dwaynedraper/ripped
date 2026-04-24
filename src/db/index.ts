import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

// Node.js runtime requires an explicit WebSocket constructor.
// Edge runtime (if we ever use it) has a native WebSocket — omit this line there.
neonConfig.webSocketConstructor = ws;

// Pool uses DATABASE_URL (pooled connection).
// DATABASE_URL_UNPOOLED is for drizzle-kit migrations only (drizzle.config.ts).
const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

export const db = drizzle({ client: pool, schema });
