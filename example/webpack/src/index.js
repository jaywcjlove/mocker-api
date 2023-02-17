fetch('/api/userinfo/1314-sd', {
  'Accept': 'application/json',
  'Content-Type': 'application/x-www-form-urlencoded',
}).then((response) => response.json())
  .then(data => {
    console.log('data:', data);
    document.getElementById('name').innerHTML = data.username;
    document.getElementById('age').innerHTML = data.sex;
    document.getElementById('id').innerHTML = data.id;
  });

fetch('/repos/jaywcjlove/github-rank',)
  .then(response => response.json())
  .then(data => {
    console.log('data:1', data)
    document.getElementById('mock').innerText = `from github api: webpack-api-mocker star count: ${data.stargazers_count}`;
  });

fetch('/repos/jaywcjlove/webpack-api-mocker')
  .then(response => response.json())
  .then(data => {
    document.getElementById('github').innerText = `from github api: webpack-api-mocker star count: ${data.stargazers_count}`
  });

fetch('/api/login/account', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ password: '888888', username: 'admin' })
})