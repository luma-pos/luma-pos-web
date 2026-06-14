/**
 * Apply migrations directly (no TTY needed). Run: bun run src/db/apply-migrations.ts
 *
 * Có bảng tracking `_migrations` — mỗi file chỉ apply 1 lần.
 * Lần đầu chạy trên DB cũ (chưa có tracking): replay tolerant — bỏ qua lỗi
 * "đã tồn tại" (table/type/column/index) rồi ghi nhận là đã apply.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");

// Không đặt timeout qua startup param (pooler transaction mode không hỗ trợ);
// set bằng lệnh SET sau khi kết nối (migration nên chạy qua direct/session :5432).
const sql = postgres(url, { max: 1, prepare: false });

// mã lỗi PG "đối tượng đã tồn tại" — an toàn để bỏ qua khi replay
const ALREADY_EXISTS = new Set([
  "42P07", // duplicate_table (table/index)
  "42710", // duplicate_object (type, enum value, constraint)
  "42701", // duplicate_column
]);

// lỗi kẹt khóa — thử lại được
const LOCK_ERRORS = new Set([
  "55P03", // lock_not_available (hết lock_timeout)
  "57014", // canceling statement (hết statement_timeout)
]);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Giới hạn thời gian chờ khóa/câu lệnh (chỉ có tác dụng khi chạy qua direct/session :5432).
try { await sql`set lock_timeout = '5s'`; await sql`set statement_timeout = '120s'`; } catch { /* pooler có thể bỏ qua */ }

await sql`create table if not exists _migrations (
  name text primary key,
  applied_at timestamptz not null default now()
)`;

const applied = new Set(
  (await sql`select name from _migrations`).map((r) => r.name as string)
);

const dir = "drizzle";
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

let ran = 0;
for (const file of files) {
  if (applied.has(file)) {
    console.log(`⏭  ${file} (đã apply trước đó)`);
    continue;
  }
  console.log(`▶ Applying ${file}`);
  const content = readFileSync(join(dir, file), "utf8");
  // drizzle separates statements with --> statement-breakpoint
  const statements = content.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean);
  let skipped = 0;
  for (const stmt of statements) {
    let attempt = 0;
    for (;;) {
      try {
        await sql.unsafe(stmt);
        break;
      } catch (e) {
        const code = (e as { code?: string }).code;
        if (code && ALREADY_EXISTS.has(code)) { skipped++; break; }
        // kẹt khóa → thử lại tối đa 5 lần, mỗi lần chờ tăng dần
        if (code && LOCK_ERRORS.has(code) && attempt < 5) {
          attempt++;
          console.log(`  ⏳ kẹt khóa (${code}), thử lại lần ${attempt}/5…`);
          await sleep(2000 * attempt);
          continue;
        }
        throw e;
      }
    }
  }
  await sql`insert into _migrations (name) values (${file}) on conflict do nothing`;
  console.log(`  ✓ ${statements.length} statements${skipped ? ` (${skipped} đã tồn tại, bỏ qua)` : ""}`);
  ran++;
}

console.log(`\n✅ ${ran > 0 ? `Applied ${ran} migration(s)` : "Không có migration mới"} — tracking trong bảng _migrations`);
await sql.end();
process.exit(0);
