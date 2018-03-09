const bodyParser = require('body-parser');
const fs = require('fs');

module.exports = function (app, watchFile) {
  if (!watchFile) {
    throw new Error('Mocker file does not exist!.');
    return;
  }
  let proxy = require(watchFile);
  for (const key in proxy) {
    const general = key.toString().split(' ');
    if (general.length > 1 && general[0] && app[general[0].toLowerCase()]) {
      app[general[0].toLowerCase()](general[1], function (req, res, next) {
        const contentType = req.get('Content-Type');
        let bodyParserMethd = bodyParser.json();
        if (contentType === 'text/plain') {
          bodyParserMethd = bodyParser.raw({ type: 'text/plain' });
        }
        bodyParserMethd(req, res, function () {
          if (typeof proxy[key] === 'function') {
            proxy[key](req, res, next);
          } else {
            res.json(proxy[key]);
          }
        });
      });
    }
  }

  // 监听文件修改重新加载代码
  // 配置热更新
  fs.watch(require.resolve(watchFile), function () {
    try {
      // 热更新先引用，冒烟，实时编辑报错，错误语法避免 crash
      const moackData = require(watchFile);
      // 确认没有问题进行热更新
      cleanCache(require.resolve(watchFile));
      // 完事儿，进行赋值，哈哈成功了！
      proxy = require(watchFile);
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