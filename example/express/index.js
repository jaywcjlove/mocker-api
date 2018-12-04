
const path = require('path');
const express = require('express');
const apiMocker = require('webpack-api-mocker');

const app = express();

console.log('~~:::', path.resolve(__dirname, './src/mock/index'));

apiMocker(app, path.resolve('./mocker/index'))
app.listen(8080);
console.log('=> http://localhost:8080')