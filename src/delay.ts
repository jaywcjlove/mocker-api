import { Request, Response, NextFunction } from 'express';
import { Mocker, MockerResultFunction } from './';

export default function name(proxy: Mocker, timer: number = 0) {
  const mockApi: { [key: string]: any } | ((req: Request, res: Response, next: NextFunction) => void) = {};
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