const path = require("node:path");
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

// Monorepo root
const monorepoRoot = path.resolve(__dirname, "../..");

/**
 * Metro configuration for pnpm monorepo
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  // Watch the monorepo root for changes in shared packages
  watchFolders: [monorepoRoot],

  resolver: {
    // Ensure Metro can resolve modules from the monorepo root node_modules
    nodeModulesPaths: [
      path.resolve(__dirname, "node_modules"),
      path.resolve(monorepoRoot, "node_modules"),
    ],
    // Disable hierarchical lookup to avoid issues with pnpm symlinks
    disableHierarchicalLookup: true,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
