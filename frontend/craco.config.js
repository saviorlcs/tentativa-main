// craco.config.js
const path = require("path");
require("dotenv").config();

const config = {
  disableHotReload: process.env.DISABLE_HOT_RELOAD === "true",
  enableVisualEdits: process.env.REACT_APP_ENABLE_VISUAL_EDITS === "true",
  enableHealthCheck: process.env.ENABLE_HEALTH_CHECK === "true",
};

let babelMetadataPlugin;
let setupDevServer;
if (config.enableVisualEdits) {
  babelMetadataPlugin = require("./plugins/visual-edits/babel-metadata-plugin");
  setupDevServer = require("./plugins/visual-edits/dev-server-setup");
}

let WebpackHealthPlugin, setupHealthEndpoints, healthPluginInstance;
if (config.enableHealthCheck) {
  WebpackHealthPlugin = require("./plugins/health-check/webpack-health-plugin");
  setupHealthEndpoints = require("./plugins/health-check/health-endpoints");
  healthPluginInstance = new WebpackHealthPlugin();
}

const webpackConfig = {
  webpack: {
    alias: { "@": path.resolve(__dirname, "src") },
    configure: (webpackConfig) => {
      if (config.disableHotReload) {
        webpackConfig.plugins = webpackConfig.plugins.filter(
          (p) => p.constructor.name !== "HotModuleReplacementPlugin"
        );
        webpackConfig.watch = false;
        webpackConfig.watchOptions = { ignored: /.*/ };
      } else {
        webpackConfig.watchOptions = {
          ...webpackConfig.watchOptions,
          ignored: [
            "**/node_modules/**",
            "**/.git/**",
            "**/build/**",
            "**/dist/**",
            "**/coverage/**",
            "**/public/**",
          ],
        };
      }

      if (config.enableHealthCheck && healthPluginInstance) {
        webpackConfig.plugins.push(healthPluginInstance);
      }
      return webpackConfig;
    },
  },

  // ⬇️ SEMPRE normalize o devServer aqui
  devServer: (devServerConfig) => {
    // evita o erro do schema
    devServerConfig.allowedHosts = "all"; // ou um array de hosts válidos
    devServerConfig.historyApiFallback = true;

    // aplica integrações opcionais
    if (config.enableVisualEdits && setupDevServer) {
      devServerConfig = setupDevServer(devServerConfig);
    }
    if (config.enableHealthCheck && setupHealthEndpoints && healthPluginInstance) {
      const originalSetupMiddlewares = devServerConfig.setupMiddlewares;
      devServerConfig.setupMiddlewares = (middlewares, devServer) => {
        if (originalSetupMiddlewares) {
          middlewares = originalSetupMiddlewares(middlewares, devServer);
        }
        setupHealthEndpoints(devServer, healthPluginInstance);
        return middlewares;
      };
    }
    return devServerConfig;
  },
};

if (config.enableVisualEdits) {
  webpackConfig.babel = { plugins: [babelMetadataPlugin] };
}

module.exports = webpackConfig;
