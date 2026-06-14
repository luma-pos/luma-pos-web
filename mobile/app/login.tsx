import { useState } from "react";
import { router } from "expo-router";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from "react-native";
import { supabase } from "../lib/supabase";
import { C, shadowSoft } from "../lib/theme";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function signIn() {
    if (loading) return;
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.replace("/home");
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-bg justify-center p-6" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View className="items-center mb-7">
        <View className="w-[60px] h-[60px] rounded-card bg-primary items-center justify-center mb-3.5" style={shadowSoft}>
          <Text className="text-white text-[28px] font-extrabold">S</Text>
        </View>
        <Text className="text-[23px] font-extrabold text-text">Sales Mgmt</Text>
        <Text className="text-[13px] text-muted mt-0.5">Quản lý bán hàng VLXD</Text>
      </View>

      <View className="bg-surface rounded-card p-5 gap-1.5 border border-border" style={shadowSoft}>
        <Text className="text-[12.5px] font-semibold text-muted mt-2">Email</Text>
        <TextInput
          className="border border-border rounded-lg px-3 py-3 text-[15px] text-text bg-surface"
          value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"
          placeholder="admin@admin.com" placeholderTextColor={C.faint}
        />
        <Text className="text-[12.5px] font-semibold text-muted mt-2">Mật khẩu</Text>
        <TextInput
          className="border border-border rounded-lg px-3 py-3 text-[15px] text-text bg-surface"
          value={password} onChangeText={setPassword} secureTextEntry
          placeholder="••••••••" placeholderTextColor={C.faint}
        />
        {error ? <Text className="text-danger text-[13px] mt-2">{error}</Text> : null}
        <TouchableOpacity className={`bg-primary rounded-xl py-3.5 items-center mt-4 ${loading ? "opacity-60" : ""}`} onPress={signIn} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-base font-bold">Đăng nhập</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
