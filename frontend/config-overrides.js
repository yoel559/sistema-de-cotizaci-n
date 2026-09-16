const webpack = require('webpack');

module.exports = {
  webpack: function override(config, env) {
    // Solo aplicar optimizaciones en producción
    if (env === 'production') {
      // Habilitar tree shaking agresivo
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: true,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            react: {
              test: /[\\/]node_modules[\\/]react/,
              name: 'react',
              chunks: 'all',
              priority: 20,
            },
            ui: {
              test: /[\\/]node_modules[\\/](react-icons|daisyui|@headlessui)/,
              name: 'ui',
              chunks: 'all',
              priority: 15,
            },
          },
        },
        minimize: true,
        minimizer: config.optimization.minimizer,
      };

      // Agregar plugins de optimización
      config.plugins = [
        ...config.plugins,
        new webpack.optimize.ModuleConcatenationPlugin(),
        new webpack.DefinePlugin({
          __REACT_DEVTOOLS_GLOBAL_HOOK__: 'undefined',
        }),
      ];

      // Optimizar resolución de módulos
      config.resolve = {
        ...config.resolve,
        alias: {
          ...config.resolve.alias,
          // Alias para optimizar imports
          'react': 'react',
          'react-dom': 'react-dom',
        },
      };
    }

    return config;
  },
  // Ajustar devServer para CRA v5
  devServer: function overrideDevServer(configFunction) {
    return function (proxy, allowedHost) {
      const config = configFunction(proxy, allowedHost);
      // Evitar el error de esquema: permitir todos los hosts
      config.allowedHosts = 'all';
      return config;
    };
  },
};
