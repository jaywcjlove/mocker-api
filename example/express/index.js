
const path = require('path');
const express = require('express');
const apiMocker = require('../../');

const app = express();

apiMocker(app, path.resolve('./mocker/index.js'))
app.listen(8080);
console.log('=> http://localhost:8080')