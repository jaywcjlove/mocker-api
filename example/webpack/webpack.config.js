const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const apiMocker = require('mocker-api');

module.exports = {
  entry: {
    app: './src/index.js',
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  devServer: {
    port: 8082,
    onBeforeSetupMiddleware: (devServer) => {
      apiMocker(devServer.app, path.resolve('./mocker/index.js'), {
        proxy: {
          '/repos/(.*)': 'https://api.github.com/',
        },
        changeHost: true,
      })

    },
    // before(app){
    //   apiMocker(app, path.resolve('./mocker/index.js'), {
    //     proxy: {
    //       '/repos/(.*)': 'https://api.github.com/',
    //     },
    //     changeHost: true,
    //   })
    // }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve('./public/index.html'),
      title: 'Webpack App Mocker API'
    })
  ],
};