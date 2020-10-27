#!/usr/bin/env node
import path from 'path';
import { existsSync } from 'fs';
import prepareUrls from 'local-ip-url/prepareUrls';
import detect from 'detect-port';
import color from 'colors-cli/safe';
import express from 'express';
import minimist from 'minimist';
import apiMocker from '../';

interface MockerConfig {
    host: string;
    port: number;
}

(async () => {
  const DEFAULTMOCKERCONFIGPATH = './mocker.config.json';
  const DEFAULTMOCKPATH = './mock';

  const argvs = minimist(process.argv.slice(2));
  const paths = argvs['_'];

  let mockPath = paths || DEFAULTMOCKPATH;
  let mockConfigPath = DEFAULTMOCKERCONFIGPATH;
  let mockerConfig: MockerConfig = {
      host: process.env.HOST || '0.0.0.0',
      port: Number(process.env.PORT) || 3721
  };

  if (paths.length === 0) {
    console.log(color.red('Error: Need to pass parameters!'));
    console.log(`E.g: ${color.yellow('mocker <File path>')}\n`);
    return;
  }

  if (argvs.config) {
    mockConfigPath = argvs.config;
  }

  if (!existsSync(path.resolve(mockConfigPath))) {
    mockerConfig.host = process.env.HOST ? process.env.HOST : mockerConfig.host;
    mockerConfig.port = await detect(mockerConfig.port);
  } else {
    mockerConfig = require(path.resolve(mockConfigPath));
  }

  const DEFAULT_PORT = mockerConfig.port;
  const app = express();

  app.all('/*', (req, res, next) => {
    console.log(`${color.green(req.method)} - ${req.url}`);
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Content-Length,Authorization,Accept,X-Requested-With');
    res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS');
    next();
  });
  apiMocker(app, mockPath);

  app.listen(DEFAULT_PORT, () => {
    const localIpUrl = prepareUrls({
      protocol: 'http',
      ...mockerConfig
    });
    console.log(`> Server Listening at Local: ${color.green(localIpUrl.localUrl)}`);
    console.log(`>           On Your Network: ${color.green(localIpUrl.lanUrl)}\n`);
  });
  /**
   * Event listener for HTTP server "error" event.
   */
  app.on('error', (error: any) => {
    if (error.syscall !== 'listen') {
      throw error;
    }
    const bind = typeof DEFAULT_PORT === 'string' ? `Pipe ${DEFAULT_PORT}` : `Port ${DEFAULT_PORT}`;
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
