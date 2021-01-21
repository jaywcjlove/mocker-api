import URL from 'url';
import bodyParser from 'body-parser';
import { Request, Response, NextFunction } from 'express';
import { MockerOption, MockerProxyRoute } from '.';
import { pathMatch } from './utils';

type MockerHandleOptions = {
  req: Request;
  res: Response;
  next: NextFunction;
  options: MockerOption;
  mocker: MockerProxyRoute;
  mockerKey: string;
}

export function mockerHandle(param: MockerHandleOptions) {
  const { options = {}, req, res, next, mocker, mockerKey } = param || {};
  let bodyParserMethd = bodyParser.json({ ...options.bodyParserJSON }); // 默认使用json解析
  /**
   * `application/x-www-form-urlencoded; charset=UTF-8` => `application/x-www-form-urlencoded`
   * Issue: https://github.com/jaywcjlove/mocker-api/issues/50
   */
  let contentType = req.get('Content-Type');
  contentType = contentType && contentType.replace(/;.*$/, '');
  if(options.bodyParserConf && options.bodyParserConf[contentType]) {
    // 如果存在options.bodyParserConf配置 {'text/plain': 'text','text/html': 'text'}
    switch(options.bodyParserConf[contentType]){// 获取bodyParser的方法
      case 'raw': bodyParserMethd = bodyParser.raw({...options.bodyParserRaw }); break;
      case 'text': bodyParserMethd = bodyParser.text({...options.bodyParserText }); break;
      case 'urlencoded': bodyParserMethd = bodyParser.urlencoded({extended: false, ...options.bodyParserUrlencoded }); break;
      case 'json': bodyParserMethd = bodyParser.json({ ...options.bodyParserJSON });//使用json解析 break;
    }
  } else {
    // 兼容原来的代码,默认解析
    // Compatible with the original code, default parsing
    switch(contentType){
      case 'text/plain': bodyParserMethd = bodyParser.raw({...options.bodyParserRaw }); break;
      case 'text/html': bodyParserMethd = bodyParser.text({...options.bodyParserText }); break;
      case 'application/x-www-form-urlencoded': bodyParserMethd = bodyParser.urlencoded({extended: false, ...options.bodyParserUrlencoded }); break;
    }
  }

  bodyParserMethd(req, res, function () {
    const result = mocker[mockerKey];
    if (typeof result === 'function') {
      const rgxStr = ~mockerKey.indexOf(' ') ? ' ' : '';
      req.params = pathMatch({ sensitive: false, strict: false, end: false })(mockerKey.split(new RegExp(rgxStr))[1])(URL.parse(req.url).pathname);
      result(req, res, next);
    } else {
      res.json(result);
    }
  });
}