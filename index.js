const bodyParser = require('body-parser');

module.exports = function (app, proxy) {
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
  return function (req, res, next) {
    next();
  }
}