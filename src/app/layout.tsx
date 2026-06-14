import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { getTheme, getMode } from "@/lib/theme/cookie";
import { ServiceWorkerRegister } from "@/components/sw-register";
import "./globals.css";

// System font stack: render tiếng Việt chuẩn trên mọi OS,
// không phụ thuộc Google Fonts lúc build (Geist thiếu subset vietnamese).

export const metadata: Metadata = {
  title: "Sales Mgmt",
  description: "Quản lý bán hàng VLXD",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Sales Mgmt" },
  icons: { icon: "/icon-192.png", apple: "/icon-180.png" },
};

export const viewport: Viewport = {
  themeColor: "#2563EB",
  viewportFit: "cover",
};

/** Chạy trước paint: mode "system" resolve theo OS để không bị flash. */
const MODE_INIT = `(function(){try{var d=document.documentElement;if(d.dataset.mode==="system"){d.dataset.mode=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}}catch(e){}})()`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const theme = await getTheme();
  const mode = await getMode();

  return (
    <html
      lang={locale}
      data-theme={theme}
      data-mode={mode}
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: MODE_INIT }} />
        <ServiceWorkerRegister />
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
