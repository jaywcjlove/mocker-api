const proxy = {
  'GET /api/userinfo/:id': (req, res) => {
    console.log('---->', req.params)
    return res.json({
      id: 1,
      username: 'kenny',
      sex: 6
    });
  },
  'GET /api/user/list/:id/:type': (req, res) => {
    console.log('--22-->', req.params)
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
  }
}
module.exports = proxy;