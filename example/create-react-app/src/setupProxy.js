const apiMocker = require('mocker-api');
const path = require('path');

module.exports = function(app) {
  apiMocker(app, path.resolve('./mocker/index.js'), {
    proxy: {
      '/repos/(.*)': 'https://api.github.com/',
    },
    changeHost: true,
  });
};