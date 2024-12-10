const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // Tilføj dine aliaser her
  config.resolver.extraNodeModules = {
    '@/assets': `${__dirname}/assets`,
    // Tilføj flere aliaser efter behov
  };

  return config;
})();