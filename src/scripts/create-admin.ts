/**
 * Tạo admin user đầu tiên.
 * Usage: bun run src/scripts/create-admin.ts <email> <password>
 */
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

const [, , email, password] = process.argv;
if (!email || !password) {
  console.error("Usage: bun run src/scripts/create-admin.ts <email> <password>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl = process.env.DATABASE_URL;

if (!url || !serviceKey) {
  console.error("Cần NEXT_PUBLIC_SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY trong .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (error) {
  console.error("❌", error.message);
  process.exit(1);
}

console.log("✓ Auth user created:", data.user.id);

// Tạo profile với role owner
if (dbUrl) {
  const sql = postgres(dbUrl, { max: 1, prepare: false });
  await sql`
    INSERT INTO profiles (id, full_name, role)
    VALUES (${data.user.id}, ${email.split("@")[0]}, 'owner')
    ON CONFLICT (id) DO UPDATE SET role = 'owner'
  `;
  console.log("✓ Profile created with role=owner");
  await sql.end();
}

console.log(`\n✅ Đăng nhập tại http://localhost:3000/login`);
console.log(`   Email: ${email}`);
process.exit(0);
