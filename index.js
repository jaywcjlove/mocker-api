const bodyParser = require('body-parser');
const httpProxy = require('http-proxy');
const pathToRegexp = require('path-to-regexp');
const fs = require('fs');
const parse = require('url').parse;
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
  const { proxy: proxyConf = {}, changeHost = true } = conf;

  if (!watchFile) {
    throw new Error('Mocker file does not exist!.');
  }
  proxy = require(watchFile);

  if (!proxy) {
    return function (req, res, next) {
      next();
    }
  }

  // 监听文件修改重新加载代码
  // 配置热更新
  fs.watchFile(require.resolve(watchFile), { interval: 1000 }, function (dt) {
    try {
      // 热更新先引用，冒烟，实时编辑报错，错误语法避免 crash
      const moackData = require(watchFile);
      // 确认没有问题进行热更新
      cleanCache(require.resolve(watchFile));

      proxy = require(watchFile);
      console.log(`${` Done: `.green_b.black} Hot Mocker ${watchFile.replace(process.cwd(), '').green} file replacement success!`);
    } catch (ex) {
      console.error(`${` Failed: `.red_b.black} Hot Mocker file replacement failed!!`);
    }
  });

  app.all('/*', function (req, res, next) {
    const proxyURL = `${req.method} ${req.path}`;
    const proxyNames = Object.keys(proxyConf);
    const proxyFuzzyMatch = proxyNames.filter(function (kname) {
      if (kname.startsWith('ALL') || kname.startsWith('/')) {
        return /\*$/.test(kname) && (new RegExp("^" + kname.replace(/\/\*$/, ''))).test(req.path);
      }
      return /\*$/.test(kname) && (new RegExp("^" + kname.replace(/\/\*$/, ''))).test(proxyURL);
    });
    const proxyMatch = proxyNames.filter(function (kname) {
      return kname === proxyURL;
    });
    // 判断下面这种情况的路由
    // => GET /api/user/:org/:name
    const containMockURL = Object.keys(proxy).filter(function (kname) {
      return (new RegExp(kname.replace(/(:\w*)[^/]/ig, '(.*)'))).test(proxyURL);
    });

    if (proxy[proxyURL] || (containMockURL && containMockURL.length > 0)) {
      let bodyParserMethd = bodyParser.json();
      const contentType = req.get('Content-Type');
      if (contentType === 'text/plain') {
        bodyParserMethd = bodyParser.raw({ type: 'text/plain' });
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
