const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const appDirectory = fs.realpathSync(process.cwd());

module.exports = {
  entry: path.resolve(appDirectory, 'src/app.ts'), //path to the main .ts file
  output: {
    filename: 'js/festival.js', //name for the javascript file that is created/compiled in memory
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.mjs'],
  },
  devServer: {
    host: '0.0.0.0',
    port: '4200',
    disableHostCheck: true,
    contentBase: path.resolve(appDirectory, 'public'), //tells webpack to serve from the public folder
    publicPath: '/',
    hot: true,
  },
  module: {
    rules: [
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      template: path.resolve(appDirectory, 'public/index.html'),
    }),
    new CleanWebpackPlugin(),
  ],
  mode: 'development',
};
