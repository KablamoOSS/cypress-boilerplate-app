const wp = require("@cypress/webpack-preprocessor");
const path = require("path");
const generateBabelConfig = require("../../config/generateBabelConfig");

const webpackOptions = {
  resolve: {
    alias: {
      "@client": path.join(__dirname, "..", ".."),
    },
    extensions: [".ts", ".tsx", ".js", ".jsx", ".css"],
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: [/node_modules/],
        use: [
          {
            loader: "babel-loader",
            options: generateBabelConfig(false),
          },
        ],
      },
    ],
  },
};

module.exports = wp({ webpackOptions });
