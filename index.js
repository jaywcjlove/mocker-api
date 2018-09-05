const bodyParser = require('body-parser');
const httpProxy = require('http-proxy');
const pathToRegexp = require('path-to-regexp');
const PATH = require('path');
const parse = require('url').parse;
const chokidar = require('chokidar');
require('colors-cli/toxic');

const proxyHTTP = httpProxy.createProxyServer({});
let proxy = {};

function pathMatch(options) {
  options = options || {};
  return function (path) {
    var keys = [];
    var re = pathToRegexp(path, keys, options);
    return function (pathname, params) {
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

module.exports = function (app, watchFile, conf = {}) {

  if (!watchFile) {
    throw new Error('Mocker file does not exist!.');
  }

  proxy = require(watchFile);

  if (!proxy) {
    return function (req, res, next) {
      next();
    }
  }
  const { proxy: proxyConf = {}, changeHost = true } = proxy._proxy || conf;
  // 监听配置入口文件所在的目录，一般为认为在配置文件/mock 目录下的所有文件
  const watcher = chokidar.watch(PATH.dirname(watchFile));

  watcher.on('all', function (event, path) {
    if (event === 'change' || event === 'add') {
      try {
        // 当监听的可能是多个配置文件时，需要清理掉更新文件以及入口文件的缓存，重新获取
        cleanCache(path);
        if (path !== watchFile) {
          cleanCache(watchFile);
        }

        proxy = require(watchFile);

        console.log(`${` Done: `.green_b.black} Hot Mocker ${watchFile.replace(process.cwd(), '').green} file replacement success!`);
      } catch (ex) {
        console.error(`${` Failed: `.red_b.black} Hot Mocker ${watchFile.replace(process.cwd(), '').red} file replacement failed!!`);
      }
    }
  })
  // 监听文件修改重新加载代码
  // 配置热更新

  app.all('/*', function (req, res, next) {
    const proxyURL = `${req.method} ${req.path}`;
    const proxyNames = Object.keys(proxyConf);
    const proxyFuzzyMatch = proxyNames.filter(function (kname) {
      const reg = new RegExp('^' + kname.replace(/(:\w*)[^/]/ig, '(\\w*)[^/]').replace(/\/\*$/, ''));
      if (kname.startsWith('ALL') || kname.startsWith('/')) {
        return /\*$/.test(kname) && reg.test(req.path);
      }
      return /\*$/.test(kname) && reg.test(proxyURL);
    });
    const proxyMatch = proxyNames.filter(function (kname) {
      return kname === proxyURL;
    });
    // 判断下面这种情况的路由
    // => GET /api/user/:org/:name
    // => GET /api/:owner/:repo/raw/:ref/*
    const containMockURL = Object.keys(proxy).filter(function (kname) {
      const replaceStr = /\*$/.test(kname) ? '' : '$';
      return (new RegExp('^' + kname.replace(/(:\w*)[^/]/ig, '(\\w*)[^/]') + replaceStr)).test(proxyURL);
    });

    if (proxy[proxyURL] || (containMockURL && containMockURL.length > 0)) {
      let bodyParserMethd = bodyParser.json();
      const contentType = req.get('Content-Type');
      if (contentType === 'text/plain') {
        bodyParserMethd = bodyParser.raw({ type: 'text/plain' });
      } else if (contentType === 'text/html') {
        bodyParserMethd = bodyParser.text({ type: 'text/html' });
      } else if (contentType === 'application/x-www-form-urlencoded') {
        bodyParserMethd = bodyParser.urlencoded({ extended: false });
      }
      bodyParserMethd(req, res, function () {
        const result = proxy[proxyURL] || proxy[containMockURL[0]];
        if (typeof result === 'function') {
          // params 参数获取
          if (containMockURL[0]) {
            const mockURL = containMockURL[0].split(' ');
            if (mockURL && mockURL.length === 2 && req.method === mockURL[0]) {
              const route = pathMatch({
                sensitive: false,
                strict: false,
                end: false,
              });
              const match = route(mockURL[1]);
              req.params = match(parse(req.url).pathname);
            }
          }
          result(req, res, next);
        } else {
          res.json(result);
        }
      });
    } else if (proxyNames.length > 0 && (proxyMatch.length > 0 || proxyFuzzyMatch.length > 0)) {
      const currentProxy = proxyConf[proxyMatch.length > 0 ? proxyMatch[0] : proxyFuzzyMatch[0]];
      const url = parse(currentProxy);
      if (changeHost) {
        req.headers.host = url.host;
      }
      proxyHTTP.web(req, res, { target: url.href });
    } else {
      next();
    }
  });

  // 释放老模块的资源
  function cleanCache(modulePath) {
    var module = require.cache[modulePath];
    if (!module) return;
    // remove reference in module.parent
    if (module.parent) {
      module.parent.children.splice(module.parent.children.indexOf(module), 1);
    }
    require.cache[modulePath] = null;
  }
  return function (req, res, next) {
    next();
  }
}
