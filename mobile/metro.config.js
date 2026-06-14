// Metro: monorepo (dùng chung file ở repo gốc) + NativeWind (Tailwind cho RN).
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// 1) Theo dõi cả repo gốc để bundle file dùng chung (vd schema zod).
config.watchFolders = [repoRoot];
// 2) Ưu tiên node_modules của mobile, rồi tới repo gốc.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(repoRoot, "node_modules"),
];

module.exports = withNativeWind(config, { input: "./global.css" });
