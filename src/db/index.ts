import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Serverless (Vercel): mỗi lambda giữ tối đa 1 connection, đi qua Supabase pooler
// (DATABASE_URL nên dùng connection-pooling string, port 6543, transaction mode).
// prepare: false là bắt buộc với transaction pooling.
const client = postgres(connectionString, {
  prepare: false,
  // 3 connection/lambda để các query Promise.all trong 1 page chạy song song
  // thay vì nối tiếp qua 1 connection. Vẫn an toàn với Supabase transaction pooler.
  max: process.env.NODE_ENV === "production" ? 3 : 10,
  idle_timeout: 10,       // trả connection về pooler sớm, giảm áp lực client-limit
  max_lifetime: 60 * 30,  // tái tạo connection cũ (tránh dùng lại connection chết của pooler)
  connect_timeout: 10,
  // KHÔNG đặt statement_timeout/lock_timeout ở đây: Supabase transaction pooler
  // (Supavisor :6543) không hỗ trợ các startup param này → kết nối treo trên Vercel.
  // Cần giới hạn thời gian query thì set ở role Postgres (ALTER ROLE ... SET statement_timeout).
});
export const db = drizzle(client, { schema });
export { schema };
