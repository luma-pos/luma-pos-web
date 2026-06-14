import { Redirect, useLocalSearchParams } from "expo-router";

/** Chi tiết SP giờ gộp vào product-form (xem → ấn "Sửa" để enable form). Redirect cho link cũ. */
export default function ProductDetailRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={{ pathname: "/product-form", params: { id } }} />;
}
