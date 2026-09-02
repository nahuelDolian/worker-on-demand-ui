module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    // Must stay last per react-native-reanimated docs.
    plugins: ['react-native-reanimated/plugin'],
  };
};
