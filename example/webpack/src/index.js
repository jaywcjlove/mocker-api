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

fetch('/repos/hello',)
  .then(response => response.json())
  .then(data => {
    document.getElementById('mock').innerText = data.text;
  });

fetch('/repos/jaywcjlove/webpack-api-mocker')
  .then(response => response.json())
  .then(data => {
    document.getElementById('github').innerText = `from github api: webpack-api-mocker star count: ${data.stargazers_count}`
  });