mocker-api
---

`mocker-api` that creates mocks for REST APIs. It will be helpful when you try to test your application without the actual REST API server.

### ⚠️ [~~`webpack-api-mocker`~~](https://www.npmjs.com/package/webpack-api-mocker) => [`mocker-api`](https://www.npmjs.com/package/mocker-api)

> ~~[`webpack-api-mocker`](https://github.com/jaywcjlove/webpack-api-mocker/tree/webpack-api-mocker)~~ has become powerful and can be used independently of webpack. **This is new name [`mocker-api`](https://npm.im/mocker-api).** ~~[`webpack-api-mocker`](https://github.com/jaywcjlove/webpack-api-mocker/tree/webpack-api-mocker)~~ can still be used, New content will be posted on [**`mocker-api`**](https://npm.im/mocker-api).

- [Using with command](#using-with-command)
- [Using with express](#using-with-express)
- [Using with webpack](#using-with-webpack)
- [Load data example](example/loadData)

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
      '/repos/*': 'https://api.github.com/',
      '/:owner/:repo/raw/:ref/*': 'http://127.0.0.1:2018'
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

## Delayed Response

You can use functional tool to enhance mock. [#17](https://github.com/jaywcjlove/webpack-api-mocker/issues/17)

```js
const delay = require('mocker-api/utils/delay');
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
apiMocker(app, mocker[,proxy])
```

Multi entry `mocker` file watching

```js
const mockerFile = ['./mock/index.js'];
// or
// const mockerFile = './mock/index.js';
apiMocker(app, mockerFile, proxy)
```

## Using With Command

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

## Using With [Express](https://github.com/expressjs/express)

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

## Using With [Webpack](https://github.com/webpack/webpack)

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
