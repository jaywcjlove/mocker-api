#!/usr/bin/env node
const path = require('path');
const prepareUrls = require('local-ip-url/prepareUrls');
const detect = require('detect-port');
const color = require('colors-cli/safe');
const express = require('express');
const apiMocker = require('../');

if (!process.argv.slice(2).length) {
  console.log(color.red('Error: Need to pass parameters!'));
  console.log(`E.g: ${color.yellow('mocker <File path>')}\n`);
  return;
}
let mockpath = process.argv[2];

mockpath = require.resolve(path.resolve(mockpath));

(async () => {
  const HOST = process.env.HOST || '0.0.0.0';
  let DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3721;
  const PORT = await detect(DEFAULT_PORT);

  if (DEFAULT_PORT !== PORT) {
    DEFAULT_PORT = PORT;
  }
  process.env.PORT = DEFAULT_PORT;
  const app = express();

  app.all('/*', (req, res, next) => {
    console.log(`${color.green(req.method)} - ${req.url}`);
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS');
    next();
  });

  apiMocker(app, mockpath);

  app.listen(DEFAULT_PORT, () => {
    const localIpUrl = prepareUrls({
      protocol: 'http',
      host: HOST,
      port: DEFAULT_PORT,
    });
    console.log(`> Server Listening at Local: ${color.green(localIpUrl.localUrl)}`);
    console.log(`>           On Your Network: ${color.green(localIpUrl.lanUrl)}\n`);
  });
  /**
   * Event listener for HTTP server "error" event.
   */
  app.on('error', (error) => {
    if (error.syscall !== 'listen') {
      throw error;
    }
    const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;
    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(`${bind} requires elevated privileges`); // eslint-disable-line
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(`${bind} is already in use`); // eslint-disable-line
        process.exit(1);
        break;
      default:
        throw error;
    }
  });
})();
