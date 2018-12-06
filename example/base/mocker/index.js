const delay = require('mocker-api/utils/delay');
const user = require('./user.mock');

// 是否禁用代理
const noProxy = process.env.NO_PROXY === 'true';

const proxy = {
  ...user,
  // 'GET /api/userinfo/:id': (req, res) => {
  //   console.log('---->', req.params)
  //   return res.json({
  //     id: 1,
  //     username: 'kenny',
  //     sex: 6
  //   });
  // },
  'GET /api/user/list/:id/:type': (req, res) => {
    const { type } = req.params;
    if (type === 'webpack') {
      return res.status(403).json({
        status: 'error',
        code: 403
      });
    }
    return res.json([
      {
        id: 1,
        username: 'kenny',
        sex: 6
      }, {
        id: 2,
        username: 'kenny',
        sex: 6
      }
    ]);
  },
  'GET /repos/hello': (req, res) => {
    return res.json({
      text: 'this is from mock server'
    });
  },

  'GET /api/jobs/:id': (req, res) => {
    return res.json({
      text: 'url: /api/jobs/:id'
    });
  },

  'GET /api/jobs': (req, res) => {
    return res.json({
      text: 'url: /api/jobs'
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
      return res.json({
        status: 'error',
        code: 403
      });
    }
  },
  'DELETE /api/user/:id': (req, res) => {
    console.log('---->', req.body)
    console.log('---->', req.params.id)
    res.send({ status: 'ok', message: '删除成功！' });
  },
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
}
module.exports = (noProxy ? {} : delay(proxy, 1000));
// module.exports = proxy;