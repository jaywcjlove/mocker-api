import express from 'express';
import { ServerOptions } from 'http-proxy';
import { OptionsJson, OptionsText, OptionsUrlencoded, Options } from 'body-parser';
import { WatchOptions } from 'chokidar';

export interface MockerOption {
  /**
   * Proxy settings.
   * 
   * ```js
   * proxy: {
   *   '/repos/(.*)': 'https://api.github.com/',
   *   '/:owner/:repo/raw/:ref/(.*)': 'http://127.0.0.1:2018',
   *   '/api/repos/(.*)': 'http://127.0.0.1:3721/'
   * },
   * ```
   */
  proxy?: {
    [key: string]: string;
  };
  /**
   * rewrite target's url path. Object-keys will be used as RegExp to match paths.
   * https://github.com/jaywcjlove/mocker-api/issues/62
   */
  pathRewrite?: {
    [key: string]: string;
  }
  /**
   * `changeHost` => `Boolean` Setting req headers host.
   */
  changeHost?: boolean;
  /**
   * bodyParserConf => {} bodyParser settings. 
   * eg： bodyParserConf : {'text/plain': 'text','text/html': 'text'} will parsed Content-Type='text/plain' and Content-Type='text/html' with bodyParser.text
   */
  bodyParserConf: OptionsJson & OptionsText & OptionsUrlencoded;
  httpProxy?: {
    option?: ServerOptions;
    listeners?: any;
  };
  bodyParserText?: OptionsText;
  bodyParserRaw?: Options;
  bodyParserUrlencoded?: OptionsUrlencoded;
  bodyParserJSON?: OptionsJson;
  watchOptions?: WatchOptions;
  accessControlOptions?: {
    [key: string]: any;
  };
}

declare function mockerAPI(app: express.Application, path: string | string[], opts: MockerOption): void;

export default mockerAPI;