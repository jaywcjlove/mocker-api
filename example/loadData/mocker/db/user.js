
module.exports = (req, res) => {
  return res.json([
    {
      id: 1,
      username: 'kenny',
      sex: 34
    }, {
      id: 2,
      username: 'mocker',
      sex: 23
    }
  ]);
}