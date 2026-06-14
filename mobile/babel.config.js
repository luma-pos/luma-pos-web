module.exports = function (api) {
  api.cache(true);
  return {
    // NativeWind v4: chỉ cần jsxImportSource (KHÔNG dùng "nativewind/babel" —
    // bản css-interop 0.2.5 hardcode react-native-worklets/plugin của reanimated 4,
    // không có trong SDK 53). babel-preset-expo tự thêm react-native-reanimated/plugin.
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }]],
  };
};
