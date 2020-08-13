import apiMocker from 'mocker-api';
import express from 'express';
import path from 'path';

const app = express();

// apiMocker(app, {
//   _proxy: {
//     changeHost: true,
//   },
//   'GET /api/user': {
//     id: 1,
//     sex: 0
//   } 
// });

apiMocker(app, path.resolve('./mocker/index.js'));
app.listen(8080);


console.log('=> http://localhost:8080')