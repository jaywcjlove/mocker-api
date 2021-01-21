
import * as toRegexp from 'path-to-regexp';
import { TokensToRegexpOptions, ParseOptions, Key } from 'path-to-regexp';

const pathToRegexp = toRegexp.pathToRegexp;

export function pathMatch(options: TokensToRegexpOptions & ParseOptions) {
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

