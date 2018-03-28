const bodyParser = require('body-parser');
const httpProxy = require('http-proxy');
const fs = require('fs');

const proxyHTTP = httpProxy.createProxyServer({});

let proxy = {};

module.exports = function (app, watchFile, proxyConf = {}) {
  if (!watchFile) {
    throw new Error('Mocker file does not exist!.');
    return;
  }
  proxy = require(watchFile);

  app.all('/*', function (req, res, next) {
    const proxyURL = `${req.method} ${req.path}`;
    const proxyNames = Object.keys(proxyConf);
    const proxyFuzzyMatch = proxyNames.filter(function (kname) {
      return /\*$/.test(kname) && (new RegExp("^" + kname.replace(/\/\*$/, ''))).test(proxyURL);;
    });
    const proxyMatch = proxyNames.filter(function (kname) {
      return kname === proxyURL;
    });

    if (proxyNames.length > 0 && (proxyMatch.length > 0 || proxyFuzzyMatch.length > 0)) {
      let currentProxy = proxyNames.filter(function (kname) {
        return (new RegExp("^" + kname.replace(/\/\*$/, ''))).test(proxyURL);;
      });
      currentProxy = proxyConf[currentProxy[0]];
      proxyHTTP.web(req, res, { target: currentProxy });
    } else if (proxy[proxyURL]) {
      let bodyParserMethd = bodyParser.json();
      const contentType = req.get('Content-Type');
      if (contentType === 'text/plain') {
        bodyParserMethd = bodyParser.raw({ type: 'text/plain' });
      }
      bodyParserMethd(req, res, function () {
        if (typeof proxy[proxyURL] === 'function') {
          proxy[proxyURL](req, res, next);
        } else {
          res.json(proxy[proxyURL]);
        }
      });
    } else {
      next();
    }
  });

  // 监听文件修改重新加载代码
  // 配置热更新
  fs.watch(require.resolve(watchFile), function (dt) {
    try {
      // 热更新先引用，冒烟，实时编辑报错，错误语法避免 crash
      const moackData = require(watchFile);
      // 确认没有问题进行热更新
      cleanCache(require.resolve(watchFile));
      // 完事儿，进行赋值，哈哈成功了！
      proxy = require(watchFile);
      console.log(`Hot Mocker ${watchFile} file replacement success!`);
    } catch (ex) {
      console.error('Hot Mocker file replacement failed!!');
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