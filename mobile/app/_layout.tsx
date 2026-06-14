import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ToastHost } from "../components/ToastHost";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import NetInfo from "@react-native-community/netinfo";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "nativewind";
import "../global.css";
import "../lib/i18n";
import { navOptions } from "../lib/theme";
import { initOutbox, flushOutbox } from "../lib/outbox";
import { hydrateCart } from "../lib/cart";

/** Tự đồng bộ hàng đợi đơn offline khi có mạng trở lại. */
function SyncManager() {
  const qc = useQueryClient();
  const wasOffline = useRef(false);

  useEffect(() => {
    initOutbox();
    flushOutbox();
    hydrateCart();
    const unsub = NetInfo.addEventListener((state) => {
      const online = !!state.isConnected;
      if (online && wasOffline.current) {
        flushOutbox().then((r) => {
          if (r.synced > 0) {
            qc.invalidateQueries({ queryKey: ["inventory"] });
            qc.invalidateQueries({ queryKey: ["orders"] });
            qc.invalidateQueries({ queryKey: ["dashboard"] });
          }
        });
      }
      wasOffline.current = !online;
    });
    return () => unsub();
  }, [qc]);

  return null;
}

export default function RootLayout() {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } })
  );
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === "dark";

  return (
    <QueryClientProvider client={client}>
      <View style={{ flex: 1 }}>
      <StatusBar style={dark ? "light" : "dark"} />
      <SyncManager />
      <Stack screenOptions={navOptions(dark)}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="product/[id]" options={{ title: t("nav.productDetail") }} />
        <Stack.Screen name="order/[id]" options={{ title: t("nav.orderDetail") }} />
        <Stack.Screen name="customer/[id]" options={{ title: t("nav.customerDetail") }} />
        <Stack.Screen name="inventory" options={{ title: t("nav.inventory") }} />
        <Stack.Screen name="orders" options={{ title: t("nav.orders") }} />
        <Stack.Screen name="orders-merge" options={{ title: "Gộp đơn" }} />
        <Stack.Screen name="order-edit/[id]" options={{ title: "Sửa đơn" }} />
        <Stack.Screen name="quotes" options={{ title: "Báo giá" }} />
        <Stack.Screen name="reports" options={{ title: t("nav.reports") }} />
        <Stack.Screen name="suppliers" options={{ title: t("nav.suppliers") }} />
        <Stack.Screen name="supplier/[id]" options={{ title: t("nav.supplierDetail") }} />
        <Stack.Screen name="cashbook" options={{ title: t("nav.cashbook") }} />
        <Stack.Screen name="product-form" options={{ title: t("nav.productNew") }} />
        <Stack.Screen name="receive" options={{ title: t("nav.receive") }} />
        <Stack.Screen name="stocktake" options={{ title: t("nav.stocktake") }} />
        <Stack.Screen name="return/[orderId]" options={{ title: t("nav.return") }} />
        <Stack.Screen name="cart" options={{ title: "Giỏ hàng" }} />
        <Stack.Screen name="payment" options={{ title: "Thanh toán" }} />
        <Stack.Screen name="pos-success" options={{ headerShown: false }} />
      </Stack>
      <ToastHost />
      </View>
    </QueryClientProvider>
  );
}
