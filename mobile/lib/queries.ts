import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";

/** Số bản ghi mỗi trang khi cuộn load more. */
const PAGE = 30;
import {
  createOrderViaApi, addPaymentViaApi, createProductViaApi, createPurchaseViaApi, createStocktakeViaApi, createReturnViaApi, convertQuoteViaApi, updateOrderViaApi, mergeOrdersViaApi,
} from "./api";
import {
  categorySchema,
  type AddPaymentInput, type Category, type MobileProductInput, type CreatePurchaseInput,
  type MobileStocktakeInput, type CreateReturnInput, type UpdateOrderInput,
} from "./schemas";
import {
  parseRows, productSchema, customerSchema, orderSchema, orderDetailSchema, warehouseSchema, priceBookSchema,
  supplierSchema, cashTxSchema,
  type Product, type Customer, type Order, type OrderDetail, type Warehouse, type PriceBook,
  type Supplier, type CashTx, type CreateOrderInput,
} from "./schemas";

const PRODUCT_COLS =
  "id, sku, barcode, name, base_unit, cost_price, last_purchase_price, retail_price, wholesale_price, contractor_price, agent_price, total_stock, min_stock, location, category_id, image_urls, m2_per_unit";

/* ----------------- Sản phẩm ----------------- */
export function useProducts(search: string, categoryId?: string | null) {
  const term = search.trim();
  return useInfiniteQuery({
    queryKey: ["products", term, categoryId ?? ""],
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<Product[]> => {
      const from = pageParam * PAGE;
      let q = supabase.from("products").select(PRODUCT_COLS).eq("is_active", true).order("name").range(from, from + PAGE - 1);
      if (term) q = q.or(`name.ilike.%${term}%,sku.ilike.%${term}%`);
      if (categoryId) q = q.eq("category_id", categoryId);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return parseRows(productSchema, data ?? []);
    },
    getNextPageParam: (last, all) => (last.length === PAGE ? all.length : undefined),
  });
}

/** Search sản phẩm cho POS — chỉ chạy khi có từ khoá. */
export function useProductSearch(search: string) {
  const term = search.trim();
  return useQuery({
    queryKey: ["product-search", term],
    enabled: term.length > 0,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products").select(PRODUCT_COLS).eq("is_active", true)
        .or(`name.ilike.%${term}%,sku.ilike.%${term}%`).order("name").limit(8);
      if (error) throw new Error(error.message);
      return parseRows(productSchema, data ?? []);
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async (): Promise<Product> => {
      const { data, error } = await supabase.from("products").select(PRODUCT_COLS).eq("id", id).single();
      if (error) throw new Error(error.message);
      return productSchema.parse(data);
    },
    enabled: !!id,
  });
}

/* ----------------- Tồn kho ----------------- */
export function useInventory(search: string) {
  const term = search.trim();
  return useInfiniteQuery({
    queryKey: ["inventory", term],
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<Product[]> => {
      const from = pageParam * PAGE;
      let q = supabase.from("products").select(PRODUCT_COLS).eq("is_active", true).order("name").range(from, from + PAGE - 1);
      if (term) q = q.ilike("name", `%${term}%`);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return parseRows(productSchema, data ?? []);
    },
    getNextPageParam: (last, all) => (last.length === PAGE ? all.length : undefined),
  });
}

export function useInventoryStats() {
  return useQuery({
    queryKey: ["inventory-stats"],
    queryFn: async () => {
      const total = await supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true);
      const out = await supabase
        .from("products").select("id", { count: "exact", head: true })
        .eq("is_active", true).lte("total_stock", 0);
      return { total: total.count ?? 0, outOfStock: out.count ?? 0 };
    },
  });
}

/* ----------------- Khách hàng ----------------- */
export function useCustomers(search: string, debtorsOnly = false) {
  const term = search.trim();
  return useInfiniteQuery({
    queryKey: ["customers", term, debtorsOnly],
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<Customer[]> => {
      const from = pageParam * PAGE;
      let q = supabase.from("customers").select("id, name, phone, current_debt, total_spent, type").order("name").range(from, from + PAGE - 1);
      if (term) q = q.or(`name.ilike.%${term}%,phone.ilike.%${term}%`);
      if (debtorsOnly) q = q.gt("current_debt", 0);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return parseRows(customerSchema, data ?? []);
    },
    getNextPageParam: (last, all) => (last.length === PAGE ? all.length : undefined),
  });
}

/* ----------------- Đơn hàng ----------------- */
const ORDER_COLS = "id, code, total, amount_paid, status, payment_status, created_at, customer_id, customers(name)";

export function useOrders(unpaidOnly = false) {
  return useInfiniteQuery({
    queryKey: ["orders", unpaidOnly],
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<Order[]> => {
      const from = pageParam * PAGE;
      let q = supabase.from("orders").select(ORDER_COLS).order("created_at", { ascending: false }).range(from, from + PAGE - 1);
      if (unpaidOnly) q = q.neq("payment_status", "paid");
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return parseRows(orderSchema, data ?? []);
    },
    getNextPageParam: (last, all) => (last.length === PAGE ? all.length : undefined),
  });
}

export function useQuotes() {
  return useInfiniteQuery({
    queryKey: ["quotes"],
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<Order[]> => {
      const from = pageParam * PAGE;
      const { data, error } = await supabase.from("orders").select(ORDER_COLS)
        .eq("status", "quote").order("created_at", { ascending: false }).range(from, from + PAGE - 1);
      if (error) throw new Error(error.message);
      return parseRows(orderSchema, data ?? []);
    },
    getNextPageParam: (last, all) => (last.length === PAGE ? all.length : undefined),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["order", id],
    enabled: !!id,
    queryFn: async (): Promise<OrderDetail> => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, code, total, amount_paid, subtotal, discount, shipping_fee, note, status, payment_status, created_at, customers(name, phone), order_items(id, product_id, product_name, unit_name, quantity, unit_price, total)")
        .eq("id", id).single();
      if (error) throw new Error(error.message);
      return orderDetailSchema.parse(data);
    },
  });
}

/* ----------------- Chi tiết khách ----------------- */
export function useCustomerDetail(id: string) {
  return useQuery({
    queryKey: ["customer", id],
    enabled: !!id,
    queryFn: async () => {
      const cRes = await supabase.from("customers").select("id, name, phone, current_debt, total_spent").eq("id", id).single();
      if (cRes.error) throw new Error(cRes.error.message);
      const oRes = await supabase.from("orders").select(ORDER_COLS).eq("customer_id", id).order("created_at", { ascending: false }).limit(20);
      return {
        customer: customerSchema.parse(cRes.data),
        orders: parseRows(orderSchema, oRes.data ?? []),
      };
    },
  });
}

/* ----------------- Kho (POS) ----------------- */
export function useDefaultWarehouse() {
  return useQuery({
    queryKey: ["warehouse-default"],
    queryFn: async (): Promise<Warehouse> => {
      const { data, error } = await supabase.from("warehouses").select("id, name").order("name").limit(1);
      if (error) throw new Error(error.message);
      if (!data?.length) throw new Error("Chưa có kho (cần mở quyền đọc warehouses).");
      return warehouseSchema.parse(data[0]);
    },
  });
}

/* ----------------- Nhà cung cấp ----------------- */
export function useSuppliers(search: string) {
  const term = search.trim();
  return useInfiniteQuery({
    queryKey: ["suppliers", term],
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<Supplier[]> => {
      const from = pageParam * PAGE;
      let q = supabase.from("suppliers").select("id, code, name, phone, address, tax_code, current_debt").order("name").range(from, from + PAGE - 1);
      if (term) q = q.or(`name.ilike.%${term}%,phone.ilike.%${term}%`);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return parseRows(supplierSchema, data ?? []);
    },
    getNextPageParam: (last, all) => (last.length === PAGE ? all.length : undefined),
  });
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: ["supplier", id],
    enabled: !!id,
    queryFn: async (): Promise<Supplier> => {
      const { data, error } = await supabase.from("suppliers").select("id, code, name, phone, address, tax_code, current_debt").eq("id", id).single();
      if (error) throw new Error(error.message);
      return supplierSchema.parse(data);
    },
  });
}

/* ----------------- Sổ quỹ ----------------- */
export function useCashbook() {
  return useQuery({
    queryKey: ["cashbook"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_transactions").select("id, code, type, fund, amount, category, note, created_at")
        .order("created_at", { ascending: false }).limit(60);
      if (error) throw new Error(error.message);
      const rows: CashTx[] = parseRows(cashTxSchema, data ?? []);
      const totalIn = rows.filter((r) => r.type === "in").reduce((s, r) => s + r.amount, 0);
      const totalOut = rows.filter((r) => r.type === "out").reduce((s, r) => s + r.amount, 0);
      return { rows, totalIn, totalOut };
    },
  });
}

/* ----------------- Bảng giá (POS) ----------------- */
export function usePriceBooks() {
  return useQuery({
    queryKey: ["price-books"],
    queryFn: async (): Promise<PriceBook[]> => {
      const { data, error } = await supabase.from("price_books").select("id, name, is_default, sort_order").order("sort_order");
      if (error) throw new Error(error.message);
      return parseRows(priceBookSchema, data ?? []);
    },
  });
}

/** Lấy giá override của 1 bảng giá cho danh sách sản phẩm (productId -> price). */
export async function fetchBookPrices(bookId: string, productIds: string[]): Promise<Map<string, number>> {
  if (!productIds.length) return new Map();
  const { data } = await supabase
    .from("product_prices").select("product_id, price")
    .eq("price_book_id", bookId).in("product_id", productIds);
  return new Map((data ?? []).map((r: { product_id: string; price: string | number }) => [r.product_id, Number(r.price)]));
}

/* ----------------- Dashboard (Trang chủ) ----------------- */
export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const todayOrders = await supabase
        .from("orders").select("total")
        .gte("created_at", start.toISOString()).eq("status", "completed");
      const revenueToday = (todayOrders.data ?? []).reduce((s, o: { total: string | number }) => s + Number(o.total), 0);
      const orderCount = todayOrders.data?.length ?? 0;

      const debtors = await supabase.from("customers").select("current_debt").gt("current_debt", 0).limit(2000);
      const receivables = (debtors.data ?? []).reduce((s, c: { current_debt: string | number }) => s + Number(c.current_debt), 0);
      const debtorCount = debtors.data?.length ?? 0;

      const low = await supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true).lte("total_stock", 0);

      const recent = await supabase.from("orders").select(ORDER_COLS).order("created_at", { ascending: false }).limit(5);

      return {
        revenueToday, orderCount, receivables, debtorCount,
        outOfStock: low.count ?? 0,
        recent: parseRows(orderSchema, recent.data ?? []),
      };
    },
  });
}

/* ----------------- Nhóm hàng ----------------- */
export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase.from("categories").select("id, name").order("name").limit(200);
      if (error) throw new Error(error.message);
      return parseRows(categorySchema, data ?? []);
    },
  });
}

/* ----------------- Mutation: tạo/sửa SP, nhập, kiểm kho, trả hàng ----------------- */
function invalidateStock(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["inventory"] });
  qc.invalidateQueries({ queryKey: ["inventory-stats"] });
  qc.invalidateQueries({ queryKey: ["products"] });
  qc.invalidateQueries({ queryKey: ["dashboard"] });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: MobileProductInput) => createProductViaApi(p),
    onSuccess: (res, vars) => { if (res.ok) { invalidateStock(qc); if (vars.id) qc.invalidateQueries({ queryKey: ["product", vars.id] }); } },
  });
}

export function useCreatePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: CreatePurchaseInput) => createPurchaseViaApi(p),
    onSuccess: (res) => { if (res.ok) { invalidateStock(qc); qc.invalidateQueries({ queryKey: ["suppliers"] }); qc.invalidateQueries({ queryKey: ["cashbook"] }); } },
  });
}

export function useCreateStocktake() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: MobileStocktakeInput) => createStocktakeViaApi(p),
    onSuccess: (res) => { if (res.ok) invalidateStock(qc); },
  });
}

export function useCreateReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: CreateReturnInput) => createReturnViaApi(p),
    onSuccess: (res, vars) => {
      if (res.ok) {
        invalidateStock(qc);
        qc.invalidateQueries({ queryKey: ["order", vars.orderId] });
        qc.invalidateQueries({ queryKey: ["orders"] });
        qc.invalidateQueries({ queryKey: ["customers"] });
        qc.invalidateQueries({ queryKey: ["cashbook"] });
      }
    },
  });
}

export function useConvertQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (quoteId: string) => convertQuoteViaApi(quoteId),
    onSuccess: (res, quoteId) => {
      if (res.ok) {
        invalidateStock(qc);
        qc.invalidateQueries({ queryKey: ["order", quoteId] });
        qc.invalidateQueries({ queryKey: ["orders"] });
        qc.invalidateQueries({ queryKey: ["quotes"] });
        qc.invalidateQueries({ queryKey: ["customers"] });
        qc.invalidateQueries({ queryKey: ["dashboard"] });
      }
    },
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: UpdateOrderInput) => updateOrderViaApi(p),
    onSuccess: (res, vars) => {
      if (res.ok) {
        invalidateStock(qc);
        qc.invalidateQueries({ queryKey: ["order", vars.orderId] });
        qc.invalidateQueries({ queryKey: ["orders"] });
        qc.invalidateQueries({ queryKey: ["quotes"] });
        qc.invalidateQueries({ queryKey: ["customers"] });
      }
    },
  });
}

export function useMergeOrders() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderIds: string[]) => mergeOrdersViaApi(orderIds),
    onSuccess: (res) => {
      if (res.ok) {
        qc.invalidateQueries({ queryKey: ["orders"] });
        qc.invalidateQueries({ queryKey: ["customers"] });
        qc.invalidateQueries({ queryKey: ["dashboard"] });
      }
    },
  });
}

/* ----------------- Thu nợ (mutation) ----------------- */
export function useAddPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddPaymentInput) => addPaymentViaApi(payload),
    onSuccess: (res, vars) => {
      if (res.ok) {
        qc.invalidateQueries({ queryKey: ["order", vars.orderId] });
        qc.invalidateQueries({ queryKey: ["orders"] });
        qc.invalidateQueries({ queryKey: ["customers"] });
        qc.invalidateQueries({ queryKey: ["customer"] });
        qc.invalidateQueries({ queryKey: ["dashboard"] });
      }
    },
  });
}

/* ----------------- Tạo đơn (mutation) ----------------- */
export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrderInput) => createOrderViaApi(payload),
    onSuccess: (res) => {
      if (res.ok) {
        qc.invalidateQueries({ queryKey: ["inventory"] });
        qc.invalidateQueries({ queryKey: ["products"] });
        qc.invalidateQueries({ queryKey: ["orders"] });
        qc.invalidateQueries({ queryKey: ["dashboard"] });
        qc.invalidateQueries({ queryKey: ["inventory-stats"] });
      }
    },
  });
}
