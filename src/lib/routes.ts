/**
 * Centralized route definitions. Type-safe, single source of truth.
 * Usage: router.push(Routes.Dashboard) or <Link href={Routes.product(id)} />
 */
export const Routes = {
  // Auth
  Login: "/login",
  Register: "/register",

  // App
  Home: "/",
  Dashboard: "/dashboard",
  POS: "/pos",
  // Nhóm trang có tab (gộp)
  Sales: "/sales",
  Partners: "/partners",
  Finance: "/finance",
  Orders: "/orders",
  Quotes: "/quotes",
  Cashbook: "/cashbook",
  Delivery: "/delivery",
  Projects: "/projects",
  Promotions: "/promotions",
  EInvoices: "/einvoices",
  Products: "/products",
  ProductNew: "/products/new",
  Categories: "/products/categories",
  Pricing: "/pricing",
  Inventory: "/inventory",
  Stocktakes: "/stocktakes",
  StocktakeNew: "/stocktakes/new",
  Purchases: "/purchases",
  PurchaseNew: "/purchases/new",
  Customers: "/customers",
  CustomerNew: "/customers/new",
  Suppliers: "/suppliers",
  Reports: "/reports",
  Settings: "/settings",

  // Param routes
  order: (id: string) => `/orders/${id}` as const,
  product: (id: string) => `/products/${id}` as const,
  customer: (id: string) => `/customers/${id}` as const,
  supplier: (id: string) => `/suppliers/${id}` as const,
} as const;

export type Route = typeof Routes[keyof typeof Routes];
