exports.login = function (req, res) {
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
}