const delay = require('mocker-api/lib/delay');

// 是否禁用代理
const noProxy = process.env.NO_PROXY === 'true';

function loadData(data) {
  const result = {};
  Object.keys(data).forEach((key) => {
    result[key] = require(data[key]);
  });
  return result;
}

const proxy = loadData({
  'GET /api/user': './db/user',
  'GET /api/user/info': './db/userInfo',
  'OPTIONS /api/user/info': './db/userInfo',
});

module.exports = (noProxy ? {} : delay(proxy, 1000));
