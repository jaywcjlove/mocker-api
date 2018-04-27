fetch('/api/userinfo/1314', {
  'Accept': 'application/json',
  'Content-Type': 'application/x-www-form-urlencoded',
})
.then((response) => response.json())
.then(data => {
  console.log('data:', data);
  document.getElementById('name').innerHTML = data.username;
  document.getElementById('age').innerHTML = data.sex;
})

fetch('/api/user/list/23/vip', {
  'Accept': 'application/json',
  'Content-Type': 'application/x-www-form-urlencoded',
})
  .then((response) => response.json())
  .then(data => {
    // console.log('data:', data);
    // document.getElementById('name').innerHTML = data.username;
    // document.getElementById('age').innerHTML = data.sex;
  })