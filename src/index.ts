import URL from 'url';
import PATH from 'path';
import { Request, Response, NextFunction, Application } from 'express';
import bodyParser from 'body-parser';
import httpProxy from 'http-proxy';
import * as toRegexp from 'path-to-regexp';
import { TokensToRegexpOptions, ParseOptions, Key } from 'path-to-regexp';
import clearModule from 'clear-module';
import chokidar from 'chokidar';
import color from 'colors-cli/safe';


export type MockerResultFunction = ((req: Request, res: Response, next?: NextFunction) => void);
export type MockerResult = string | { [key: string]: any } | MockerResultFunction;

export interface Mocker {
  _proxy?: MockerOption;
  [key: string]: MockerResult;
}

export interface MockerOption {
  changeHost?: boolean;
  pathRewrite?: {
    [key: string]: 'string';
  },
  proxy?: {
    [key: string]: 'string';
  },
  httpProxy?: {
    options?: httpProxy.ServerOptions;
    listeners?: {
      [key: string]: () => void;
    }
  };
  bodyParserConf?: {
    [key: string]: 'raw' | 'text' | 'urlencoded' | 'json';
  };
  bodyParserJSON?: bodyParser.OptionsJson;
  bodyParserText?: bodyParser.OptionsText;
  bodyParserRaw?: bodyParser.Options;
  bodyParserUrlencoded?: bodyParser.OptionsUrlencoded;
  watchOptions?: chokidar.WatchOptions;
  header?: {
    [key: string]: string | number | string[];
  }
}

const pathToRegexp = toRegexp.pathToRegexp;
let mocker: Mocker = {};

function pathMatch(options: TokensToRegexpOptions & ParseOptions) {
  options = options || {};
  return function (path: string) {
    var keys: (Key & TokensToRegexpOptions & ParseOptions & { repeat: boolean })[] = [];
    var re = pathToRegexp(path, keys, options);
    return function (pathname: string, params?: any) {
      var m = re.exec(pathname);
      if (!m) return false;
      params = params || {};
      var key, param;
      for (var i = 0; i < keys.length; i++) {
        key = keys[i];
        param = m[i + 1];
        if (!param) continue;
        params[key.name] = decodeURIComponent(param);
        if (key.repeat) params[key.name] = params[key.name].split(key.delimiter)
      }
      return params;
    }
  }
}

export default function (app: Application, watchFile: string | string[], conf: MockerOption = {}) {
  const watchFiles = Array.isArray(watchFile) ? watchFile : [watchFile];
  if (watchFiles.some(file => !file)) {
    throw new Error('Mocker file does not exist!.');
  }

  mocker = getConfig();


  if (!mocker) {
    return (req: Request, res: Response, next: NextFunction) => {
      next();
    }
  }
  let options = {...conf, ...(mocker._proxy || {})}
  const defaultOptions = {
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
    header: {}
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
  // 监听文件修改重新加载代码
  // 配置热更新
  app.all('/*', (req: Request, res: Response, next: NextFunction) => {
    
    /**
     * Get Proxy key
     */
    const proxyKey = Object.keys(options.proxy).find((kname) => {
      return !!pathToRegexp(kname.replace((new RegExp('^' + req.method + ' ')), '')).exec(req.path);
    });
    /**
     * Get Mocker key
     * => `GET /api/:owner/:repo/raw/:ref`
     * => `GET /api/:owner/:repo/raw/:ref/(.*)`
     */
    const mockerKey: string = Object.keys(mocker).find((kname) => {
      return !!pathToRegexp(kname.replace((new RegExp('^' + req.method + ' ')), '')).exec(req.path);
    });
    /**
     * Access Control Allow options.
     * https://github.com/jaywcjlove/mocker-api/issues/61
     */
    const accessOptions: MockerOption['header'] = {
      'Access-Control-Allow-Origin': req.get('Origin') || '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
      ...options.header,
    }
    Object.keys(accessOptions).forEach(keyName => {
      res.setHeader(keyName, accessOptions[keyName]);
    });
    // fix issue 34 https://github.com/jaywcjlove/mocker-api/issues/34
    // In some cross-origin http request, the browser will send the preflighted options request before sending the request methods written in the code.
    if (!mockerKey && req.method.toLocaleUpperCase() === 'OPTIONS'
      && Object.keys(mocker).find((kname) => !!pathToRegexp(kname.replace((new RegExp('^(PUT|POST|GET|DELETE) ')), '')).exec(req.path))
    ) {
      return res.sendStatus(200);
    }

    if (proxyKey && options.proxy[proxyKey]) {
      const currentProxy = options.proxy[proxyKey];
      const url = URL.parse(currentProxy);
      if (options.changeHost) {
        req.headers.host = url.host;
      }
      const { options: proxyOptions = {}, listeners: proxyListeners = {} }: MockerOption['httpProxy'] = options.httpProxy;
      /**
       * rewrite target's url path. Object-keys will be used as RegExp to match paths.
       * https://github.com/jaywcjlove/mocker-api/issues/62
       */
      Object.keys(options.pathRewrite).forEach(rgxStr => {
        const rePath = req.path.replace(new RegExp(rgxStr), options.pathRewrite[rgxStr]);
        const currentPath = [rePath];
        if (req.url.indexOf('?') > 0) {
          currentPath.push(req.url.replace(/(.*)\?/, ''));
        }
        req.query = URL.parse(req.url, true).query;
        req.url = req.originalUrl = currentPath.join('?');
      });

      const proxyHTTP = httpProxy.createProxyServer({});
      proxyHTTP.on('error', (err) => {
        console.error(`${color.red_b.black(` Proxy Failed: ${err.name}`)} ${err.message || ''} ${err.stack || ''} !!`);
      });
      Object.keys(proxyListeners).forEach(event => {
        proxyHTTP.on(event, proxyListeners[event]);
      });

      proxyHTTP.web(req, res, Object.assign({ target: url.href }, proxyOptions));

    } else if (mocker[mockerKey]) {
      let bodyParserMethd = bodyParser.json({ ...options.bodyParserJSON }); // 默认使用json解析
      let contentType = req.get('Content-Type');
      /**
       * `application/x-www-form-urlencoded; charset=UTF-8` => `application/x-www-form-urlencoded`
       * Issue: https://github.com/jaywcjlove/mocker-api/issues/50
       */
      contentType = contentType && contentType.replace(/;.*$/, '');
      if(options.bodyParserConf && options.bodyParserConf[contentType]) {
        // 如果存在options.bodyParserConf配置 {'text/plain': 'text','text/html': 'text'}
        switch(options.bodyParserConf[contentType]){// 获取bodyParser的方法
          case 'raw': bodyParserMethd = bodyParser.raw({...options.bodyParserRaw }); break;
          case 'text': bodyParserMethd = bodyParser.text({...options.bodyParserText }); break;
          case 'urlencoded': bodyParserMethd = bodyParser.urlencoded({extended: false, ...options.bodyParserUrlencoded }); break;
          case 'json': bodyParserMethd = bodyParser.json({ ...options.bodyParserJSON });//使用json解析 break;
        }
      } else {
        // 兼容原来的代码,默认解析
        // Compatible with the original code, default parsing
        switch(contentType){
          case 'text/plain': bodyParserMethd = bodyParser.raw({...options.bodyParserRaw }); break;
          case 'text/html': bodyParserMethd = bodyParser.text({...options.bodyParserText }); break;
          case 'application/x-www-form-urlencoded': bodyParserMethd = bodyParser.urlencoded({extended: false, ...options.bodyParserUrlencoded }); break;
        }
      }

      bodyParserMethd(req, res, function () {
        const result = mocker[mockerKey];
        if (typeof result === 'function') {
          const rgxStr = ~mockerKey.indexOf(' ') ? ' ' : '';
          req.params = pathMatch({ sensitive: false, strict: false, end: false })(mockerKey.split(new RegExp(rgxStr))[1])(URL.parse(req.url).pathname);
          result(req, res, next);
        } else {
          res.json(result);
        }
      });
    } else {
      next();
    }
  });

  // The old module's resources to be released.
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
  // Merge multiple Mockers
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
