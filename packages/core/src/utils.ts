
import * as toRegexp from 'path-to-regexp';
import type { PathToRegexpOptions, ParseOptions, Keys } from 'path-to-regexp';

const pathToRegexp = toRegexp.pathToRegexp;

export function pathMatch(options: PathToRegexpOptions & ParseOptions) {
  options = options || {};
  return function (path: string) {
    var keys: Keys = [];
    let regexpObject: RegExp | undefined = undefined
    try {
      var re = pathToRegexp(path, options);
      regexpObject = re.regexp;
      keys = re.keys;
    } catch (error) {
      console.error(error);
    }
    return function (pathname: string, params?: any) {
      var mData = regexpObject?.exec(pathname);
      if (!mData) return false;
      params = params || {};
      var key, param;
      for (var i = 0; i < keys.length; i++) {
        key = keys[i];
        param = mData[i + 1];
        if (!param) continue;
        params[key.name] = decodeURIComponent(param);
      }
      return params;
    }
  }
}

