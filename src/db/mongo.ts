import "server-only";
import { MongoClient } from "mongodb";
import { env } from "@/env";

const client = new MongoClient(env.MONGODB_URI);
const clientPromise = client.connect();

export async function getMongoDb() {
  const c = await clientPromise;
  return c.db("ripped");
}
