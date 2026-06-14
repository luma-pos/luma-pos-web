import type { Dict } from "./vi";

/** English (one phần — fallback về vi nếu thiếu). */
export const en: Dict = {
  tabs: { home: "Home", pos: "Sell", products: "Products", customers: "Customers", more: "More" },
  nav: {
    login: "Sign in",
    productDetail: "Product detail",
    orderDetail: "Order detail",
    customerDetail: "Customer detail",
    supplierDetail: "Supplier detail",
    inventory: "Inventory",
    orders: "Orders",
    reports: "Reports",
    suppliers: "Suppliers",
    cashbook: "Cashbook",
    productNew: "New product",
    productEdit: "Edit product",
    receive: "Receive goods",
    stocktake: "Stocktake",
    return: "Return",
  },
  common: {
    search: "Search…",
    retry: "Retry",
    loadError: "Failed to load",
    empty: "No data",
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    signOut: "Sign out",
  },
  more: { orders: "Orders", inventory: "Inventory", receive: "Receive goods", stocktake: "Stocktake", suppliers: "Suppliers", cashbook: "Cashbook", reports: "Reports", account: "Account", language: "Language" },
  pos: { sell: "Sell", quote: "Quote", cash: "Cash", bank: "Bank transfer", credit: "Credit", retailCustomer: "Walk-in", total: "Total", saveQuote: "Save quote", collectAndCreate: "Collect & create" },
};
