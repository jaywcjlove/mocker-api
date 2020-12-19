<h2><p align="center"><b>Mocker API</b></p></h2>

[![](https://img.shields.io/github/issues/jaywcjlove/mocker-api.svg)](https://github.com/jaywcjlove/mocker-api/issues)
[![](https://img.shields.io/github/forks/jaywcjlove/mocker-api.svg)](https://github.com/jaywcjlove/mocker-api/network)
[![](https://img.shields.io/github/stars/jaywcjlove/mocker-api.svg)](https://github.com/jaywcjlove/mocker-api/stargazers)
[![](https://img.shields.io/github/release/jaywcjlove/mocker-api)](https://github.com/jaywcjlove/mocker-api/releases)
[![](https://img.shields.io/npm/v/mocker-api.svg)](https://www.npmjs.com/package/mocker-api)


[English](./README.md) · [快速开始](#快速开始) · [使用](#使用) · [参数设置](#参数设置) · [延迟响应](#延迟响应) · [实例](#实例) · [License](#license)

`mocker-api` 为 REST API 创建模拟。 当您尝试在没有实际 REST API 服务器的情况下测试应用程序时，这将很有帮助。

**特点:**  

🔥 内置对 Mocker 文件热更新支持。  
🚀 通过JSON快速轻松地配置API。  
🌱 模拟API代理变得简单。
💥 可以独立使用，而无需依赖 [webpack](https://github.com/webpack/webpack) 和 [webpack-dev-server](https://github.com/webpack/webpack-dev-server)。  

## 快速开始

```bash
mkdir mocker-app && cd mocker-app

# 根据规则创建模拟程序配置文件
touch api.js

# 全局安装。
npm install mocker-api -g
# 运行服务
mocker ./api.js

# Run server at localhost:8000
mocker ./api.js --host localhost --port 8000
```

## 安装

您可以将其 `package.json` 配置作为当前项目依赖项。

```bash
npm install mocker-api --save-dev
```

## 使用

`mocker-api` 支持模拟，在 `mocker / index.js` 中配置。

您可以修改 [http-proxy](https://www.npmjs.com/package/http-proxy) 选项并通过添加 `httpProxy` 配置来添加事件监听器

```js
const proxy = {
  // 优先处理。
  // apiMocker(app, path, option)
  // 这是 apiMocker 的选项参数设置 `option`
  _proxy: {
    proxy: {
      // 将路径字符串（例如`/user/:name`）转换为正则表达式。
      // https://www.npmjs.com/package/path-to-regexp
      '/repos/(.*)': 'https://api.github.com/',
      '/:owner/:repo/raw/:ref/(.*)': 'http://127.0.0.1:2018',
      '/api/repos/(.*)': 'http://127.0.0.1:3721/'
    },
    // 重写目标网址路径。对象键将用作RegEx来匹配路径。
    // https://github.com/jaywcjlove/mocker-api/issues/62
    pathRewrite: {
      '^/api/repos/': '/repos/',
    },
    changeHost: true,
    // 修改 http-proxy 选项
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
  // 默认的 GET 请求。
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

## 参数设置 

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

⚠️ No wildcard asterisk ~~`*`~~ - use parameters instead `(.*)`, support `v1.7.3+`

## 延迟响应

您可以使用功能性工具来增强模拟效果。[#17](https://github.com/jaywcjlove/webpack-api-mocker/issues/17)

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

多个模拟文件监听

```js
const apiMocker = require('mocker-api');
const mockerFile = ['./mock/index.js'];
// or
// const mockerFile = './mock/index.js';
apiMocker(app, mockerFile, options)
```

## 实例

### 在命令行中使用

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

### 在 [Express](https://github.com/expressjs/express) 中使用

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

### 在 [Webpack](https://github.com/webpack/webpack) 中使用

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
+         '/repos/*': 'https://api.github.com/',
+         '/:owner/:repo/raw/:ref/*': 'http://127.0.0.1:2018'
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
+      "start": "webpack serve --progress --mode production",
      "build": "webpack --mode production"
    },
    "keywords": [],
    "author": "",
    "license": "MIT",
    "devDependencies": {
      "html-webpack-plugin": "4.5.0",
      "mocker-api": "2.7.4",
      "webpack": "5.11.0",
      "webpack-cli": "4.2.0",
      "webpack-dev-server": "3.11.0"
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

### 开发

```shell
$ yarn install
$ yarn run build
$ yarn run watch
$ yarn run test
```

## License

[MIT © Kenny Wong](https://github.com/jaywcjlove/mocker-api/blob/master/LICENSE)
