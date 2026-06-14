import { ReactNode, useEffect } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useColorScheme } from "nativewind";
import { C, Cdark, shadowMd } from "../lib/theme";

/**
 * Bottom sheet (reanimated, chạy UI-thread mượt):
 * backdrop mờ dần hiện TRƯỚC, sheet trượt từ dưới lên SAU.
 */
export function BottomSheet({
  visible, onClose, children, heightPct = 0.72,
}: {
  visible: boolean; onClose: () => void; children: ReactNode; heightPct?: number;
}) {
  const { colorScheme } = useColorScheme();
  const p = colorScheme === "dark" ? Cdark : C;
  const fade = useSharedValue(0);
  const ty = useSharedValue(600);

  useEffect(() => {
    if (visible) {
      fade.value = 0;
      ty.value = 600;
      fade.value = withTiming(1, { duration: 160 });
      ty.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) });
    }
  }, [visible, fade, ty]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }] }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.root}>
        <Animated.View style={[StyleSheet.absoluteFill, s.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View style={[s.sheet, { maxHeight: `${heightPct * 100}%`, backgroundColor: p.surface }, sheetStyle]}>
          <View style={[s.handle, { backgroundColor: p.border }]} />
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { backgroundColor: "rgba(15,23,42,0.45)" },
  sheet: { backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 8, ...shadowMd },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 99, backgroundColor: C.border, marginBottom: 8 },
});
