const express = require('express');
const apiMocker = require('mocker-api');

const app = express();

apiMocker(app, require.resolve('./mocker/index'))
app.listen(8080);
console.log('=> http://localhost:8080')