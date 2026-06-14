import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "nativewind";
import { C, Cdark } from "../../lib/theme";

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const p = colorScheme === "dark" ? Cdark : C;
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: p.surface },
        headerTintColor: p.text,
        headerTitleStyle: { fontWeight: "800", color: p.text },
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: p.textFaint,
        tabBarStyle: { backgroundColor: p.surface, borderTopColor: p.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: t("tabs.home"), tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="pos"
        options={{ title: t("tabs.pos"), tabBarIcon: ({ color, size }) => <Ionicons name="cart-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: t("tabs.products"),
          tabBarIcon: ({ color, size }) => <Ionicons name="pricetags-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{ title: t("tabs.customers"), tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: t("tabs.more"), tabBarIcon: ({ color, size }) => <Ionicons name="menu-outline" color={color} size={size} /> }}
      />
    </Tabs>
  );
}
