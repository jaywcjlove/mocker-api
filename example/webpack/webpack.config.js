const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const apiMocker = require('mocker-api');

module.exports = {
  mode: 'development',
  entry: {
    app: './src/index.js',
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  devtool: 'inline-source-map',
  devServer: {
    before(app){
      apiMocker(app, path.resolve('./mocker/index.js'), {
        proxy: {
          '/repos/*': 'https://api.github.com/',
        },
        changeHost: true,
      })
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve('./public/index.html'),
      title: 'development'
    })
  ],
};