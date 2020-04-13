<h2><p align="center"><b>Mocker API</b></p></h2>

[![](https://img.shields.io/github/issues/jaywcjlove/mocker-api.svg)](https://github.com/jaywcjlove/mocker-api/issues)
[![](https://img.shields.io/github/forks/jaywcjlove/mocker-api.svg)](https://github.com/jaywcjlove/mocker-api/network)
[![](https://img.shields.io/github/stars/jaywcjlove/mocker-api.svg)](https://github.com/jaywcjlove/mocker-api/stargazers)
[![](https://img.shields.io/github/release/jaywcjlove/mocker-api)](https://github.com/jaywcjlove/mocker-api/releases)
[![](https://img.shields.io/npm/v/mocker-api.svg)](https://www.npmjs.com/package/mocker-api)


[Quick Start](#quick-start) · [Usage](#usage) · [Options](#options) · [Delayed](#delayed-response) · [Example](#example) · [License](#license)

`mocker-api` that creates mocks for REST APIs. It will be helpful when you try to test your application without the actual REST API server.

**Features:**  

🔥 Built in support for hot Mocker file replacement.  
🚀 Quickly and easily configure the API via JSON.  
🌱 Mock API proxying made simple.  
💥 Can be used independently without relying on [webpack](https://github.com/webpack/webpack) and [webpack-dev-server](https://github.com/webpack/webpack-dev-server).

## Quick Start

```bash
mkdir mocker-app && cd mocker-app

# Create a mocker configuration file based on rules
touch api.js

# Global install dependent.
npm install mocker-api -g
# Run server
mocker ./api.js
```

## Installation

you can put it the `package.json` config as a current project dependency.

```bash
npm install mocker-api --save-dev
```

## Usage

`mocker-api` dev support mock, configured in `mocker/index.js`.

you can modify the [http-proxy](https://www.npmjs.com/package/http-proxy) options and add the event listeners by adding the httpProxy configuration

```js
const proxy = {
  // Priority processing.
  // apiMocker(app, path, option)
  // This is the option parameter setting for apiMocker
  _proxy: {
    proxy: {
      // Turn a path string such as `/user/:name` into a regular expression.
      // https://www.npmjs.com/package/path-to-regexp
      '/repos/(.*)': 'https://api.github.com/',
      '/:owner/:repo/raw/:ref/(.*)': 'http://127.0.0.1:2018',
      '/api/repos/(.*)': 'http://127.0.0.1:3721/'
    },
    // rewrite target's url path. Object-keys will be used as RegExp to match paths.
    // https://github.com/jaywcjlove/mocker-api/issues/62
    pathRewrite: {
      '^/api/repos/': '/repos/',
    },
    changeHost: true,
    // modify the http-proxy options
    httpProxy: {
      options: {
        ignorePath: true,
      },
      listeners: {
        proxyReq: function (proxyReq, req, res, options) {
          console.log('proxyReq');
        },
      },
    },    
  },
  // =====================
  // The default GET request.
  // https://github.com/jaywcjlove/mocker-api/pull/63
  '/api/user': {
    id: 1,
    username: 'kenny',
    sex: 6
  },
  'GET /api/user': {
    id: 1,
    username: 'kenny',
    sex: 6
  },
  'GET /api/user/list': [
    {
      id: 1,
      username: 'kenny',
      sex: 6
    }, {
      id: 2,
      username: 'kenny',
      sex: 6
    }
  ],
  'GET /api/:owner/:repo/raw/:ref/(.*)': (req, res) => {
    const { owner, repo, ref } = req.params;
    // http://localhost:8081/api/admin/webpack-mock-api/raw/master/add/ddd.md
    // owner => admin
    // repo => webpack-mock-api
    // ref => master
    // req.params[0] => add/ddd.md
    return res.json({
      id: 1,
      owner, repo, ref,
      path: req.params[0]
    });
  },
  'POST /api/login/account': (req, res) => {
    const { password, username } = req.body;
    if (password === '888888' && username === 'admin') {
      return res.json({
        status: 'ok',
        code: 0,
        token: "sdfsdfsdfdsf",
        data: {
          id: 1,
          username: 'kenny',
          sex: 6
        }
      });
    } else {
      return res.status(403).json({
        status: 'error',
        code: 403
      });
    }
  },
  'DELETE /api/user/:id': (req, res) => {
    console.log('---->', req.body)
    console.log('---->', req.params.id)
    res.send({ status: 'ok', message: '删除成功！' });
  }
}
module.exports = proxy;
```

## Options 

- [`proxy`](https://www.npmjs.com/package/path-to-regexp) => `{}` Proxy settings, Turn a path string such as `/user/:name` into a regular expression.
- [`pathRewrite`](https://github.com/jaywcjlove/mocker-api/issues/62) => `{}` rewrite target's url path. Object-keys will be used as RegExp to match paths. [#62](https://github.com/jaywcjlove/mocker-api/issues/62)
- `changeHost` => `Boolean` Setting req headers host.
- `httpProxy` => `{}` Set the [listen event](https://github.com/nodejitsu/node-http-proxy#listening-for-proxy-events) and [configuration](https://github.com/nodejitsu/node-http-proxy#options) of [http-proxy](https://github.com/nodejitsu/node-http-proxy)    
- [`bodyParserJSON`](https://github.com/expressjs/body-parser/tree/56a2b73c26b2238bc3050ad90af9ab9c62f4eb97#bodyparserjsonoptions) JSON body parser
- [`bodyParserText`](https://github.com/expressjs/body-parser/tree/56a2b73c26b2238bc3050ad90af9ab9c62f4eb97#bodyparsertextoptions) Text body parser
- [`bodyParserRaw`](https://github.com/expressjs/body-parser/tree/56a2b73c26b2238bc3050ad90af9ab9c62f4eb97#bodyparserrawoptions) Raw body parser
- [`bodyParserUrlencoded`](https://github.com/expressjs/body-parser/tree/56a2b73c26b2238bc3050ad90af9ab9c62f4eb97#bodyparserurlencodedoptions) URL-encoded form body parser
- `bodyParserConf` => `{}` bodyParser settings. eg： `bodyParserConf : {'text/plain': 'text','text/html': 'text'}` will parsed `Content-Type='text/plain' and Content-Type='text/html'` with `bodyParser.text`  
- [`watchOptions`](https://github.com/paulmillr/chokidar#api) => `object` Options object as defined [chokidar api options](https://github.com/paulmillr/chokidar#api)
- `header` => `{}` Access Control Allow options.
  ```js
  {
    header: {
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    }
  }
  ```

⚠️ No wildcard asterisk ~~`*`~~ - use parameters instead `(.*)`, suport `v1.7.3+`

## Delayed Response

You can use functional tool to enhance mock. [#17](https://github.com/jaywcjlove/webpack-api-mocker/issues/17)

```js
const delay = require('mocker-api/lib/delay');
const noProxy = process.env.NO_PROXY === 'true';

const proxy = {
  'GET /api/user': {
    id: 1,
    username: 'kenny',
    sex: 6
  },
  // ...
}
module.exports = (noProxy ? {} : delay(proxy, 1000));
```

## apiMocker

```js
apiMocker(app, mockerFilePath[, options])
```

Multi entry `mocker` file watching

```js
const apiMocker = require('mocker-api');
const mockerFile = ['./mock/index.js'];
// or
// const mockerFile = './mock/index.js';
apiMocker(app, mockerFile, options)
```

## Example

### Using With Command

[Base example](example/base)

>⚠️  Not dependent on [webpack](https://github.com/webpack/webpack) and [webpack-dev-server](https://github.com/webpack/webpack-dev-server). 

```bash
# Global install dependent.
npm install mocker-api -g
# Run server
mocker ./mocker/index.js
```

Or you can put it the `package.json` config as a current project dependency.

```diff
{
  "name": "base-example",
  "scripts": {
+    "api": "mocker ./mocker"
  },
  "devDependencies": {
+    "mocker-api": "^1.6.4"
  },
  "license": "MIT"
}
```

### Using With [Express](https://github.com/expressjs/express)

[Express example](example/express)

>⚠️  Not dependent on [webpack](https://github.com/webpack/webpack) and [webpack-dev-server](https://github.com/webpack/webpack-dev-server).

```diff
const express = require('express');
+ const path = require('path');
+ const apiMocker = require('mocker-api');

const app = express();

+ apiMocker(app, path.resolve('./mocker/index.js'))
app.listen(8080);
```

### Using With [Webpack](https://github.com/webpack/webpack)

[webpack example](example/webpack)

To use api mocker on your [Webpack](https://github.com/webpack/webpack) projects, simply add a setup options to your [webpack-dev-server](https://github.com/webpack/webpack-dev-server) options:

Change your config file to tell the dev server where to look for files: `webpack.config.js`.

```diff
const HtmlWebpackPlugin = require('html-webpack-plugin');
+ const path = require('path');
+ const apiMocker = require('mocker-api');

module.exports = {
  entry: {
    app: './src/index.js',
    print: './src/print.js'
  },
  devtool: 'inline-source-map',
+ devServer: {
+   ...
+   before(app){
+     apiMocker(app, path.resolve('./mocker/index.js'), {
+       proxy: {
+         '/repos/*': 'https://api.github.com/',
+         '/:owner/:repo/raw/:ref/*': 'http://127.0.0.1:2018'
+       },
+       changeHost: true,
+     })
+   }
+ },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Development'
    })
  ],
  output: {
    filename: '[name].bundle.js',
    path: require.resolve(__dirname, 'dist')
  }
};
```

Must have a file suffix! For example: `./mocker/index.js`.

Let's add a script to easily run the dev server as well: `package.json`

```diff
  {
    "name": "development",
    "version": "1.0.0",
    "description": "",
    "main": "webpack.config.js",
    "scripts": {
      "test": "echo \"Error: no test specified\" && exit 1",
+     "start": "webpack-dev-server --open",
      "build": "webpack"
    },
    "keywords": [],
    "author": "",
    "license": "MIT",
    "devDependencies": {
      ....
    }
  }
```

Mock API proxying made simple.

```diff
{
  before(app){
+   apiMocker(app, path.resolve('./mocker/index.js'), {
+     proxy: {
+       '/repos/*': 'https://api.github.com/',
+     },
+     changeHost: true,
+   })
  }
}
```

## License

[MIT © Kenny Wong](./LICENSE)
