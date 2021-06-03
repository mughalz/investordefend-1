'use strict';

import path, { resolve } from 'path';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import fs from 'fs';

const isDevelopment = process.env.NODE_ENV !== 'production';

const APP_PATH = process.env.APP_PATH || ((isDevelopment) ? 'http://localhost:8080' : null);
if (!APP_PATH) throw "Please set the path for the app.";

const API_URL = process.env.API_URL || ((isDevelopment) ? 'http://localhost:4000' : null);
if (!API_URL) throw "Please set the URL for the API.";

/**
 * The default polling rate (for multiplayer games).
 */
const POLL_INTERVAL = process.env.POLL_INTERVAL || 5000;

function generateHtmlPlugins(templateDir) {
  // Read files in template directory
  const dirents = fs.readdirSync(path.resolve(__dirname, templateDir), { withFileTypes: true });
  const filesNames = dirents.filter((dirent) => dirent.isFile()).map((dirent) => dirent.name);

  return filesNames.map((item) => {
    // Split names and extension
    const parts = item.split('.');
    const name = parts[0];
    const extension = parts[1];
    // Create new HtmlWebpackPlugin with options
    return new HtmlWebpackPlugin({
      filename: `${name}.html`,
      template: path.resolve(__dirname, `${templateDir}/${name}.${extension}`),
      title: 'Invest or Defend',
      version: '0.0.0 (pre-release)',
      inject: 'body',
      minify: !isDevelopment && {
        html5: true,
        collapseWhitespace: true,
        caseSensitive: true,
        removeComments: true,
        removeEmptyElements: false,
      },
    });
  });
}

const htmlPlugins = generateHtmlPlugins('./src/templates');

module.exports = env => ({
  entry: {
    app: './src/js/app.ts',
  },
  output: {
    filename: 'bundle.js',
    path: resolve(__dirname, 'dist'),
    publicPath: APP_PATH
  },
  devtool: isDevelopment && 'inline-source-map',
  devServer: {
    contentBase: __dirname,
    inline: true,
    host: 'localhost',
    port: 8080,
    open: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(hbs|handlebars)$/,
        loader: 'handlebars-loader',
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: isDevelopment,
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: isDevelopment,
            },
          },
        ],
      },
      {
        test: /\.(png|svg|jpe?g|gif)$/i,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
          outputPath: 'images',
        },
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.css', '.scss'],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.APP_PATH': JSON.stringify(APP_PATH),
      'process.env.API_URL': JSON.stringify(API_URL),
      'process.env.POLL_INTERVAL': JSON.stringify(POLL_INTERVAL)
    }),
    new CopyPlugin({
      patterns: [
        {
          from: "public/docs",
          to: "docs",
          noErrorOnMissing: true,
          transform(content, path) {
            return content.toString().replace(/(src|href)="((assets|modules|classes|enums)[^.])/g, "$1=\"docs/$2");
          },
        },
        {
          from: "public/coverage",
          to: "coverage",
          noErrorOnMissing: true
        },
      ],
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.LoaderOptionsPlugin({
      options: {
        handlebarsLoader: {},
      },
    }),
    new MiniCssExtractPlugin({
      filename: '[name]-styles.css',
      chunkFilename: '[id].css',
    }),
  ].concat(htmlPlugins),
});
