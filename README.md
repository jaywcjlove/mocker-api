webpack-api-mocker
---

webpack-api-mocker is a [webpack-dev-server](https://github.com/webpack/webpack-dev-server)  middleware that creates mocks for REST APIs. It will be helpful when you try to test your application without the actual REST API server.

**Features:**  

🔥 Built in support for hot Mocker file replacement.  
🚀 Quickly and easily configure the API via JSON.  
🌱 Mock API proxying made simple.  

## Installation

```bash
npm install webpack-api-mocker --save-dev
```

## Usage

webpack-api-mocker dev support mock, configured in `mocker/index.js`.

> ⚠️ The webpack-api-mocker@1.5.5+ config needs to be placed in the directory.  

```js
const proxy = {
  // Priority processing.
  // apiMocker(app, path, option)
  // This is the option parameter setting for apiMocker
  // webpack-api-mocker@1.5.14 support
  _proxy: {
    proxy: {
      '/repos/*': 'https://api.github.com/',
      '/:owner/:repo/raw/:ref/*': 'http://127.0.0.1:2018'
    },
    changeHost: true,
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
const delay = require('webpack-api-mocker/utils/delay');
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

## Using with [Express](https://github.com/expressjs/express)

[Express example](example/express)

```diff
const path = require('path');
const express = require('express');
+ const apiMocker = require('webpack-api-mocker');

const app = express();

+ apiMocker(app, path.resolve('./mocker/index.js'))
app.listen(8080);
```

## Using with [Webpack](https://github.com/webpack/webpack)

[webpack example](example/express)

To use api mocker on your [Webpack](https://github.com/webpack/webpack) projects, simply add a setup options to your [webpack-dev-server](https://github.com/webpack/webpack-dev-server) options:

Change your config file to tell the dev server where to look for files: `webpack.config.js`.

```diff
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
+ const apiMocker = require('webpack-api-mocker');

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
    path: path.resolve(__dirname, 'dist')
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
