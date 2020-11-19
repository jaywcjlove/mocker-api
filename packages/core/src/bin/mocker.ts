#!/usr/bin/env node
import path from 'path';
import { existsSync } from 'fs';
import prepareUrls from 'local-ip-url/prepareUrls';
import detect from 'detect-port';
import color from 'colors-cli/safe';
import express from 'express';
import minimist from 'minimist';
import apiMocker, { MockerOption } from '../';

interface MockerConfig extends MockerOption {
  host: string;
  port: number;
}

const CWD = process.cwd();
const PKG_PATH = path.resolve(CWD, './package.json');
const DEFAULT_MOCKER_CONFIG_PATH = path.resolve(CWD, './mocker.config.json');
const DEFAULT_MOCK_PATH = ['./mock'];
const DEFAULT_CONFIG: MockerConfig = {
  host: '0.0.0.0',
  port: 3721
};

(async () => {
  const argvs = minimist(process.argv.slice(2));

  if (argvs.h || argvs.help) {
    console.log('\n  Usage: mocker <path> [--config] [--help|h]')
    console.log('\n  Displays help information.')
    console.log('\n  Options:')
    console.log('    --config <path>', 'Simple configuration')
    console.log('\n  Example:')
    console.log('    mocker mock/index.js')
    console.log('    mocker mock/index.js --port 7788')
    console.log('    mocker mock/index.js --host 0.0.0.0')
    console.log('    mocker mock/m1.js test/m2.js')
    console.log('    mocker mock/m1.js --config mocker.config.json')
    console.log('\n');
    return;
  }
  // Fix type errors
  const { version } = require('../../package.json');

  if (argvs.v || argvs.version) {
    console.log(version);
    return
  }

  const paths = argvs['_'];

  if (paths.length === 0) {
    console.log(color.red('Error: Need to pass parameters!'));
    console.log(`E.g: ${color.yellow('mocker <File path>')}\n`);
    return;
  }

  const entryFiles = paths || DEFAULT_MOCK_PATH;

  let mockConfigPath = argvs.config || DEFAULT_MOCKER_CONFIG_PATH;
  let mockerConfig = DEFAULT_CONFIG;

  if (argvs.config) {
    mockConfigPath = argvs.config;
  }

  if (!existsSync(path.resolve(mockConfigPath))) {
    mockerConfig.host = process.env.HOST ? process.env.HOST : mockerConfig.host;
    mockerConfig.port = await detect(mockerConfig.port);
  } else {
    mockerConfig = require(path.resolve(mockConfigPath));
  }

  /**
   * Support setting configuration on package.json
   * https://github.com/jaywcjlove/mocker-api/issues/144
   */
  if (existsSync(PKG_PATH)) {
    const pkgConf = require(PKG_PATH);
    if (pkgConf.mocker) {
      Object.assign(mockerConfig, pkgConf.mocker);
    }
  }

  if (argvs.host) {
    mockerConfig.host = argvs.host;
  }

  if (argvs.port) {
    mockerConfig.port = argvs.port;
  }

  const DEFAULT_PORT = mockerConfig.port;
  const DEFAULT_HOST = mockerConfig.host;
  const app = express();

  app.all('/*', (req, res, next) => {
    console.log(`${color.green(req.method)} - ${req.url}`);
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Content-Length,Authorization,Accept,X-Requested-With');
    res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS');
    next();
  });

  delete mockerConfig.port;
  delete mockerConfig.host;
  apiMocker(app, entryFiles, { ...mockerConfig });

  app.listen(DEFAULT_PORT, () => {
    const localIpUrl = prepareUrls({
      protocol: 'http',
      host: DEFAULT_HOST,
      port: DEFAULT_PORT,
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
