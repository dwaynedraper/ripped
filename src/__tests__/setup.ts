import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local so integration tests have all required env vars.
config({ path: resolve(process.cwd(), ".env.local"), override: true });
