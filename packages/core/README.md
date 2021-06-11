<p align="center">
  <a href="https://uiwjs.github.io/npm-unpkg/#/pkg/mocker-api/file/README.md">
    <img alt="Mocker API LOGO" src="https://user-images.githubusercontent.com/1680273/105883915-5845a780-6042-11eb-8eee-614ba512a74a.png">
  </a>
</p>


<p align="center">
  <a href="https://github.com/jaywcjlove/mocker-api/actions">
    <img alt="Build & Deploy" src="https://github.com/jaywcjlove/mocker-api/workflows/Build%20and%20Deploy/badge.svg">
  </a>
  <a href="https://github.com/jaywcjlove/mocker-api/issues">
    <img alt="Issues" src="https://img.shields.io/github/issues/jaywcjlove/mocker-api.svg">
  </a>
  <a href="https://github.com/jaywcjlove/mocker-api/network">
    <img alt="Forks" src="https://img.shields.io/github/forks/jaywcjlove/mocker-api.svg">
  </a>
  <a href="https://github.com/jaywcjlove/mocker-api/stargazers">
    <img alt="Stars" src="https://img.shields.io/github/stars/jaywcjlove/mocker-api.svg">
  </a>
  <a href="https://uiwjs.github.io/npm-unpkg/#/pkg/mocker-api/file/README.md">
    <img src="https://img.shields.io/badge/Open%20in-unpkg-blue" alt="Open in unpkg">
  </a>
  <a href="https://gitee.com/jaywcjlove/mocker-api">
    <img alt="Release" src="https://jaywcjlove.github.io/sb/ico/gitee.svg">
  </a>
  <a href="https://www.npmjs.com/package/mocker-api">
    <img alt="npm version" src="https://img.shields.io/npm/v/mocker-api.svg">
  </a>
</p>

<p align="center">
  <a href="https://github.com/jaywcjlove/mocker-api/blob/master/README-zh.md">中文</a> · 
  <a href="#quick-start">Quick Start</a> · 
  <a href="#usage">Usage</a> · 
  <a href="#options">Options</a> · 
  <a href="#delayed-response">Delayed</a> · 
  <a href="#example">Example</a> · 
  <a href="#license">License</a>
</p>

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

# Default port: 3721
mocker ./api.js

# Designated port
# Run server at localhost:8000
mocker ./api.js --host localhost --port 8000
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
- `withFullUrlPath=false` => `Boolean` the proxy regular expression support full url path. if the proxy regular expression like `/test?a=1&b=1` can be matched. [#25](https://github.com/jaywcjlove/mocker-api/issues/25)
- `priority` => `proxy` priority `proxy` or `mocker` [#151](https://github.com/jaywcjlove/mocker-api/issues/151)
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

⚠️ No wildcard asterisk ~~`*`~~ - use parameters instead `(.*)`, support `v1.7.3+`

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
apiMocker(app, Mocker[, options])
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
+    "mocker-api": "2.9.0"
  },
+  "mocker": {
+    "port": 7788
+  },
  "license": "MIT"
}
```

### Using With Express

[Express example](example/express)

To use api mocker on your [express](https://github.com/expressjs/express) projects.

>⚠️  Not dependent on [webpack](https://github.com/webpack/webpack) and [webpack-dev-server](https://github.com/webpack/webpack-dev-server).

```diff
const express = require('express');
+ const path = require('path');
+ const apiMocker = require('mocker-api');

const app = express();

+ apiMocker(app, path.resolve('./mocker/index.js'))
app.listen(8080);
```

or

```diff
const express = require('express');
+ const apiMocker = require('mocker-api');

const app = express();

+ apiMocker(app, {
+   'GET /api/user': {
+     id: 1,
+     sex: 0
+   }
+ });

app.listen(8080);
```

### Using With Webpack

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
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
+ devServer: {
+   ...
+   before(app){
+     apiMocker(app, path.resolve('./mocker/index.js'), {
+       proxy: {
+         '/repos/(.*)': 'https://api.github.com/',
+         '/:owner/:repo/raw/:ref/(.*)': 'http://127.0.0.1:2018'
+       },
+       changeHost: true,
+     })
+   }
+ },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve('./public/index.html'),
      title: 'Webpack App Mocker API'
    })
  ],
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
+    "start": "webpack serve --progress --mode development",
    "build": "webpack --mode production"
  },
  "keywords": [],
  "author": "",
  "license": "MIT",
  "devDependencies": {
    "html-webpack-plugin": "4.5.0",
    "mocker-api": "2.9.0",
    "webpack": "5.22.0",
    "webpack-cli": "4.5.0",
    "webpack-dev-server": "3.11.2"
  }
}
```

Mock API proxying made simple.

```diff
{
  before(app){
+   apiMocker(app, path.resolve('./mocker/index.js'), {
+     proxy: {
+       '/repos/(.*)': 'https://api.github.com/',
+     },
+     changeHost: true,
+   })
  }
}
```

### Using With create-react-app

[create-react-app example](example/create-react-app)

To use api mocker on your [create-react-app](https://github.com/facebook/create-react-app/blob/3f699fd08044de9ab0ce1991a66b376d3e1956a8/docusaurus/docs/proxying-api-requests-in-development.md) projects. create [`src/setupProxy.js`](https://github.com/jaywcjlove/mocker-api/blob/64a093685b05c70ab0ddcf3fd5dbede7871efa8a/example/create-react-app/src/setupProxy.js#L1-L11) and place the following contents in it:

```diff
+ const apiMocker = require('mocker-api');
+ const path = require('path');

module.exports = function(app) {
+  apiMocker(app, path.resolve('./mocker/index.js'), {
+    proxy: {
+      '/repos/(.*)': 'https://api.github.com/',
+    },
+    changeHost: true,
+  });
};
```

```diff
{
  .....
  "devDependencies": {
+    "mocker-api": "2.9.0"
  },
  ....
}
```

### Development

```shell
$ yarn install
$ yarn run build
$ yarn run watch
$ yarn run test
```

## License

[MIT © Kenny Wong](https://github.com/jaywcjlove/mocker-api/blob/master/LICENSE)
