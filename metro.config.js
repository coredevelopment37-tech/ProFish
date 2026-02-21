const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    // Ensure .json files are resolved for i18next locale imports
    assetExts: defaultConfig.resolver.assetExts.filter(ext => ext !== 'json'),
    sourceExts: [...defaultConfig.resolver.sourceExts, 'json'],
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(defaultConfig, config);
