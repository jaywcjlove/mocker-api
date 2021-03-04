import URL from 'url';
import PATH from 'path';
import * as net from "net";
import * as http from "http";
import { Request, Response, NextFunction, Application } from 'express';
import bodyParser from 'body-parser';
import httpProxy from 'http-proxy';
import * as toRegexp from 'path-to-regexp';
import clearModule from 'clear-module';
import chokidar from 'chokidar';
import color from 'colors-cli/safe';
import { proxyHandle } from './proxyHandle';
import { mockerHandle } from './mockerHandle';

export type ProxyTargetUrl = string | Partial<URL.Url>;
export type MockerResultFunction = ((req: Request, res: Response, next?: NextFunction) => void);
export type MockerResult = string | number| Array<any> | Record<string, any> | MockerResultFunction;

/**
 * Setting a proxy router.
 * @example
 * 
 * ```json
 * {
 *   '/api/user': {
 *     id: 1,
 *     username: 'kenny',
 *     sex: 6
 *   },
 *   'DELETE /api/user/:id': (req, res) => {
 *     res.send({ status: 'ok', message: '删除成功！' });
 *   }
 * }
 * ```
 */
export type MockerProxyRoute = Record<string, MockerResult> & {
  /**
   * This is the option parameter setting for apiMocker
   * Priority processing.
   * apiMocker(app, path, option)
   * {@link MockerOption}
   */
  _proxy?: MockerOption;
}

/**
 * Listening for proxy events.  
 * This options contains listeners for [node-http-proxy](https://github.com/http-party/node-http-proxy#listening-for-proxy-events).
 * {typeof httpProxy.on}
 * {@link httpProxy}
 */
export interface HttpProxyListeners extends Record<string, any> {
  start?: (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    target: ProxyTargetUrl
  ) => void;
  proxyReq?: (
    proxyReq: http.ClientRequest,
    req: http.IncomingMessage,
    res: http.ServerResponse,
    options: httpProxy.ServerOptions
  ) => void;
  proxyRes?: (
    proxyRes: http.IncomingMessage,
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) => void;
  proxyReqWs?: (
    proxyReq: http.ClientRequest,
    req: http.IncomingMessage,
    socket: net.Socket,
    options: httpProxy.ServerOptions,
    head: any
  ) => void;
  econnreset?: (
    err: Error,
    req: http.IncomingMessage,
    res: http.ServerResponse,
    target: ProxyTargetUrl
  ) => void
  end?: (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    proxyRes: http.IncomingMessage
  ) => void;
  /**
   * This event is emitted once the proxy websocket was closed.
   */
  close?: (
    proxyRes: http.IncomingMessage,
    proxySocket: net.Socket,
    proxyHead: any
  ) => void;
}

export interface MockerOption {
  /**
   * priority 'proxy' or 'mocker'
   * @default `proxy`
   * @issue [#151](https://github.com/jaywcjlove/mocker-api/issues/151)
   */
  priority?: 'proxy' | 'mocker';
  /**
   * `Boolean` Setting req headers host.
   */
  changeHost?: boolean;
  /**
   * rewrite target's url path. 
   * Object-keys will be used as RegExp to match paths. [#62](https://github.com/jaywcjlove/mocker-api/issues/62)
   * @default `{}`
   */
  pathRewrite?: Record<string, string>,
  /**
   * Proxy settings, Turn a path string such as `/user/:name` into a regular expression. [path-to-regexp](https://www.npmjs.com/package/path-to-regexp)
   * @default `{}`
   */
  proxy?: Record<string, string>,
  /**
   * Set the [listen event](https://github.com/nodejitsu/node-http-proxy#listening-for-proxy-events) and [configuration](https://github.com/nodejitsu/node-http-proxy#options) of [http-proxy](https://github.com/nodejitsu/node-http-proxy)
   * @default `{}`
   */
  httpProxy?: {
    options?: httpProxy.ServerOptions;
    listeners?: HttpProxyListeners
  };
  /**
   * bodyParser settings. 
   * @example
   * 
   * ```js
   * bodyParser = {"text/plain": "text","text/html": "text"}
   * ```
   * 
   * will parsed `Content-Type='text/plain' and Content-Type='text/html'` with `bodyParser.text`
   * 
   * @default `{}`
   */
  bodyParserConf?: {
    [key: string]: 'raw' | 'text' | 'urlencoded' | 'json';
  };
  /**
   * [`bodyParserJSON`](https://github.com/expressjs/body-parser/tree/56a2b73c26b2238bc3050ad90af9ab9c62f4eb97#bodyparserjsonoptions) JSON body parser
   * @default `{}`
   */
  bodyParserJSON?: bodyParser.OptionsJson;
  /**
   * [`bodyParserText`](https://github.com/expressjs/body-parser/tree/56a2b73c26b2238bc3050ad90af9ab9c62f4eb97#bodyparsertextoptions) Text body parser
   * @default `{}`
   */
  bodyParserText?: bodyParser.OptionsText;
  /**
   * [`bodyParserRaw`](https://github.com/expressjs/body-parser/tree/56a2b73c26b2238bc3050ad90af9ab9c62f4eb97#bodyparserrawoptions) Raw body parser
   * @default `{}`
   */
  bodyParserRaw?: bodyParser.Options;
  /**
   * [`bodyParserUrlencoded`](https://github.com/expressjs/body-parser/tree/56a2b73c26b2238bc3050ad90af9ab9c62f4eb97#bodyparserurlencodedoptions) URL-encoded form body parser
   * @default `{}`
   */
  bodyParserUrlencoded?: bodyParser.OptionsUrlencoded;
  /**
   * Options object as defined [chokidar api options](https://github.com/paulmillr/chokidar#api)
   * @default `{}`
   */
  watchOptions?: chokidar.WatchOptions;
  /**
   * Access Control Allow options.
   * @default `{}`
   * @example
   * ```js
   * {
   *  header: {
   *    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
   *  }
   * }
   * ```
   */
  header?: Record<string,string | number | string[]>,
  /**
   * `Boolean` the proxy regular expression support full url path.
   *  if the proxy regular expression like /test?a=1&b=1 can be matched
   */
  withFullUrlPath?: boolean
}

const pathToRegexp = toRegexp.pathToRegexp;
let mocker: MockerProxyRoute = {};

export default function (app: Application, watchFile: string | string[] | MockerProxyRoute, conf: MockerOption = {}) {
  const watchFiles = (Array.isArray(watchFile) ? watchFile : typeof watchFile === 'string' ? [watchFile] : []).map(str => PATH.resolve(str));

  if (watchFiles.some(file => !file)) {
    throw new Error('Mocker file does not exist!.');
  }

  /**
   * Mybe watch file or pass parameters
   * https://github.com/jaywcjlove/mocker-api/issues/116
   */
  const isWatchFilePath = (Array.isArray(watchFile) && watchFile.every(val => typeof val === 'string')) || typeof watchFile === 'string';
  mocker = isWatchFilePath ? getConfig() : watchFile;

  if (!mocker) {
    return (req: Request, res: Response, next: NextFunction) => {
      next();
    }
  }
  let options: MockerOption = {...conf, ...(mocker._proxy || {})}
  const defaultOptions: MockerOption = {
    changeHost: true,
    pathRewrite: {},
    proxy: {},
    // proxy: proxyConf: {},
    httpProxy: {},
    // httpProxy: httpProxyConf: {},
    bodyParserConf: {},
    bodyParserJSON: {},
    bodyParserText: {},
    bodyParserRaw: {},
    bodyParserUrlencoded: {},
    watchOptions: {},
    header: {},
    priority: 'proxy',
    withFullUrlPath: false
  }

  options = { ...defaultOptions, ...options };
  // changeHost = true,
  // pathRewrite = {},
  // proxy: proxyConf = {},
  // httpProxy: httpProxyConf = {},
  // bodyParserConf= {},
  // bodyParserJSON = {},
  // bodyParserText = {},
  // bodyParserRaw = {},
  // bodyParserUrlencoded = {},
  // watchOptions = {},
  // header = {}

  if (isWatchFilePath) {
    // 监听配置入口文件所在的目录，一般为认为在配置文件/mock 目录下的所有文件
    // 加上require.resolve，保证 `./mock/`能够找到`./mock/index.js`，要不然就要监控到上一级目录了
    const watcher = chokidar.watch(watchFiles.map(watchFile => PATH.dirname(require.resolve(watchFile))), options.watchOptions);
  
    watcher.on('all', (event, path) => {
      if (event === 'change' || event === 'add') {
        try {
          // 当监听的可能是多个配置文件时，需要清理掉更新文件以及入口文件的缓存，重新获取
          cleanCache(path);
          watchFiles.forEach(file => cleanCache(file));
          mocker = getConfig();
          if (mocker._proxy) {
            options = { ...options, ...mocker._proxy };
          }
          console.log(`${color.green_b.black(' Done: ')} Hot Mocker ${color.green(path.replace(process.cwd(), ''))} file replacement success!`);
        } catch (ex) {
          console.error(`${color.red_b.black(' Failed: ')} Hot Mocker ${color.red(path.replace(process.cwd(), ''))} file replacement failed!!`);
        }
      }
    })
  }
  // 监听文件修改重新加载代码
  // 配置热更新
  app.all('/*', (req: Request, res: Response, next: NextFunction) => {
    const getExecUrlPath = (req: Request) => {
      return options.withFullUrlPath ? req.url : req.path;
    } 
    /**
     * Get Proxy key
     */
    const proxyKey = Object.keys(options.proxy).find((kname) => {
      return !!pathToRegexp(kname.replace((new RegExp('^' + req.method + ' ')), '')).exec(getExecUrlPath(req));
    });
    /**
     * Get Mocker key
     * => `GET /api/:owner/:repo/raw/:ref`
     * => `GET /api/:owner/:repo/raw/:ref/(.*)`
     */
    const mockerKey: string = Object.keys(mocker).find((kname) => {
      return !!pathToRegexp(kname.replace((new RegExp('^' + req.method + ' ')), '')).exec(getExecUrlPath(req));
    });
    /**
     * Access Control Allow options.
     * https://github.com/jaywcjlove/mocker-api/issues/61
     */
    const accessOptions: MockerOption['header'] = {
      'Access-Control-Allow-Origin': req.get('Origin') || '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With,' + (req.header('access-control-request-headers') || ''),
      'Access-Control-Allow-Credentials': 'true',
      ...options.header,
    }
    Object.keys(accessOptions).forEach(keyName => {
      res.setHeader(keyName, accessOptions[keyName]);
    });
    // fix issue 34 https://github.com/jaywcjlove/mocker-api/issues/34
    // In some cross-origin http request, the browser will send the preflighted options request before sending the request methods written in the code.
    if (!mockerKey && req.method.toLocaleUpperCase() === 'OPTIONS'
      && Object.keys(mocker).find((kname) => !!pathToRegexp(kname.replace((new RegExp('^(PUT|POST|GET|DELETE) ')), '')).exec(getExecUrlPath(req)))
    ) {
      return res.sendStatus(200);
    }

    /**
     * priority 'proxy' or 'mocker' [#151](https://github.com/jaywcjlove/mocker-api/issues/151)
     */
    if (options.priority === 'mocker') {
      if (mocker[mockerKey]) {
        return mockerHandle({ req, res, next, mocker, options, mockerKey})
      } else if (proxyKey && options.proxy[proxyKey]) {
        return proxyHandle(req, res, options, proxyKey);
      } 
    } else {
      if (proxyKey && options.proxy[proxyKey]) {
        return proxyHandle(req, res, options, proxyKey);
      } else if (mocker[mockerKey]) {
        return mockerHandle({ req, res, next, mocker, options, mockerKey})
      }
    }

    next();
  });

  /**
   * The old module's resources to be released.
   * @param modulePath 
   */
  function cleanCache(modulePath: string) {
    // The entry file does not have a .js suffix,
    // causing the module's resources not to be released.
    // https://github.com/jaywcjlove/webpack-api-mocker/issues/30
    try {
      modulePath = require.resolve(modulePath);
    } catch (e) {}
    var module = require.cache[modulePath];
    if (!module) return;
    // remove reference in module.parent
    if (module.parent) {
      module.parent.children.splice(module.parent.children.indexOf(module), 1);
    }
    // https://github.com/jaywcjlove/mocker-api/issues/42
    clearModule(modulePath);
  }
  /**
   * Merge multiple Mockers
   */
  function getConfig() {
    return watchFiles.reduce((mocker, file) => {
      const mockerItem = require(file);
      return Object.assign(mocker, mockerItem.default ? mockerItem.default : mockerItem);
    }, {})
  }
  return (req: Request, res: Response, next: NextFunction) => {
    next();
  }
}
