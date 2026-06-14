import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Cho phép CI/sandbox build ra thư mục khác (mặc định .next)
  distDir: process.env.NEXT_DIST_DIR || ".next",
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    // Client Router Cache: giữ payload RSC của trang động 30s → đổi qua lại
    // giữa Sản phẩm/Thiết lập giá/Tồn kho trong 30s không query lại DB.
    staleTimes: { dynamic: 30, static: 180 },
  },
};

export default withNextIntl(nextConfig);
