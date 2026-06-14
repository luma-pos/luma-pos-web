import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { supabase } from "../lib/supabase";
import { C } from "../lib/theme";

/** Cổng vào: có phiên đăng nhập -> Trang chủ, chưa thì -> Đăng nhập. */
export default function Index() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setAuthed(!!data.session);
      setReady(true);
    });
    return () => { active = false; };
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg }}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }
  return <Redirect href={authed ? "/home" : "/login"} />;
}
