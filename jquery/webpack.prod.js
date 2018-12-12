const merge = require("webpack-merge");
const common = require("./webpack.common.js");
const webpack = require("webpack");
const HtmlCriticalWebpackPlugin = require("html-critical-webpack-plugin");
const path = require("path");

module.exports = merge(common, {
  mode: "production",
  plugins: [
    new HtmlCriticalWebpackPlugin({
      base: path.resolve(__dirname, "dist"),
      src: "index.html",
      dest: "index.html",
      css: "./src/style.css",
      inline: true,
      minify: true,
      extract: true,
      width: 375,
      height: 565,
      penthouse: {
        blockJSRequests: false
      }
    }),
    new webpack.DefinePlugin({
      API_URL: JSON.stringify("https://dockless-data.austintexas.io/v1/trips")
    })
  ]
});
