import fs from 'fs';
import Module from 'module';
import os from 'os';
import path from 'path';

type WatchEventHandler = (event: string, filePath: string) => void;

const loadMockerApi = () => {
  const mockerModule = require('../index');
  return mockerModule.default || mockerModule;
};

describe('mockerApi watch mode', () => {
  let tempDir: string;
  let mockFile: string;
  let currentMockConfig: Record<string, { version: string }>;
  let watchHandler: WatchEventHandler | undefined;
  let watchMock: jest.Mock;
  let onMock: jest.Mock;
  let clearModuleMock: jest.Mock;
  let mockerHandleMock: jest.Mock;
  let originalRequire: typeof Module.prototype.require;

  beforeEach(() => {
    jest.resetModules();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mocker-api-'));
    mockFile = path.join(tempDir, 'user.mock.js');
    fs.writeFileSync(mockFile, 'module.exports = { "GET /users": { version: "v1" } };\n');
    currentMockConfig = { 'GET /users': { version: 'v1' } };

    watchHandler = undefined;
    onMock = jest.fn((eventName: string, handler: WatchEventHandler) => {
      if (eventName === 'all') {
        watchHandler = handler;
      }
      return { close: jest.fn() };
    });
    watchMock = jest.fn(() => ({ on: onMock }));
    clearModuleMock = jest.fn((modulePath: string) => {
      delete require.cache[modulePath];
    });
    mockerHandleMock = jest.fn();

    jest.doMock('chokidar', () => ({
      __esModule: true,
      default: {
        watch: watchMock,
      },
    }));
    jest.doMock('clear-module', () => ({
      __esModule: true,
      default: clearModuleMock,
    }));
    jest.doMock('../mockerHandle', () => ({
      mockerHandle: mockerHandleMock,
    }));
    jest.doMock('../proxyHandle', () => ({
      proxyHandle: jest.fn(),
    }));

    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    originalRequire = Module.prototype.require;
    jest.spyOn(Module.prototype, 'require').mockImplementation(function (request: string) {
      if (request === mockFile) {
        return currentMockConfig;
      }
      return originalRequire.call(this, request);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('registers an all-event watcher for the mock file directory', () => {
    const mockerApi = loadMockerApi();
    const app = { all: jest.fn() };

    mockerApi(app, mockFile, { watchOptions: { ignoreInitial: true } });

    expect(watchMock).toHaveBeenCalledWith([path.dirname(require.resolve(mockFile))], { ignoreInitial: true });
    expect(onMock).toHaveBeenCalledWith('all', expect.any(Function));
    expect(app.all).toHaveBeenCalledWith(/.*/, expect.any(Function));
  });

  it('handles watched file changes through the hot reload path', () => {
    const mockerApi = loadMockerApi();
    const app = {
      all: jest.fn(),
    };

    mockerApi(app, mockFile, {});

    currentMockConfig = { 'GET /users': { version: 'v2' } };
    expect(watchHandler).toBeDefined();
    watchHandler!('change', mockFile);

    expect(console.error).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('file replacement success'));
  });
});
