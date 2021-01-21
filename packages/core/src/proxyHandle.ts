import URL from 'url';
import httpProxy from 'http-proxy';
import { Request, Response } from 'express';
import color from 'colors-cli/safe';
import { MockerOption, HttpProxyListeners } from '.';

export function proxyHandle(req: Request, res: Response, options: MockerOption = {}, proxyKey: string) {
  const currentProxy = options.proxy[proxyKey];
  const url = URL.parse(currentProxy);
  if (options.changeHost) {
    req.headers.host = url.host;
  }
  const { options: proxyOptions = {}, listeners: proxyListeners = {} as HttpProxyListeners }: MockerOption['httpProxy'] = options.httpProxy;
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
}