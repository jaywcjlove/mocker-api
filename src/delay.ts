import { Request, Response } from 'express';
import { MockerProxyRoute, MockerResult, MockerResultFunction } from './';

/**
 * You can use functional tool to enhance mock. [#17](https://github.com/jaywcjlove/webpack-api-mocker/issues/17)
 * 
 * ```js
 * const delay = require('mocker-api/lib/delay');
 * const noProxy = process.env.NO_PROXY === 'true';
 * 
 * const proxy = {
 *   'GET /api/user': {
 *     id: 1,
 *     username: 'kenny',
 *     sex: 6
 *   },
 *   // ...
 * }
 * module.exports = (noProxy ? {} : delay(proxy, 1000));
 * ```
 */
export default function delay(proxy: MockerProxyRoute, timer: number = 0): MockerResult {
  const mockApi: MockerResult = {};
  Object.keys(proxy).forEach((key) => {
    const result = proxy[key];
    if ((Object.prototype.toString.call(result) === '[object String]' && /^http/.test(result as string)) || key === '_proxy' || timer === 0) {
      mockApi[key] = proxy[key];
    } else {
      mockApi[key] = function (req: Request, res: Response) {
        let foo: MockerResultFunction;
        if (Object.prototype.toString.call(result) === '[object Function]') {
          foo = result as MockerResultFunction;
        } else {
          foo = (_req: Request, _res: Response) => {
            return _res.json(result);
          };
        }
        setTimeout(() => {
          foo(req, res);
        }, timer);
      };
    }
  });

  return mockApi;
}