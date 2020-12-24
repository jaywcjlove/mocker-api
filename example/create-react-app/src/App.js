import logo from './logo.svg';
import './App.css';
import { useEffect, useState } from 'react';

function App() {
  const [data, setData] = useState({});
  const [githubRank, setGithubRank] = useState({});
  const [apiMocker, setApiMocker] = useState({});
  useEffect(() => {
    fetch('/api/userinfo/1314-sd', {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    }).then((response) => response.json())
      .then(data => {
        setData(data);
        console.log('data:', data);
        // document.getElementById('name').innerHTML = data.username;
        // document.getElementById('age').innerHTML = data.sex;
        // document.getElementById('id').innerHTML = data.id;
      });
    fetch('/repos/jaywcjlove/github-rank',)
      .then(response => response.json())
      .then(data => {
        setGithubRank(data);
      });
    
    fetch('/repos/jaywcjlove/webpack-api-mocker')
      .then(response => response.json())
      .then(data => {
        setApiMocker(data);
      });
  }, []);
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <div>
          <div>id: <span>{data.id}</span></div>
          <div>name: <span>{data.username}</span></div>
          <div>age: <span>{data.sex}</span></div>
          <br />
          <div>URL: /repos/jaywcjlove/github-rank: <strong>{githubRank.stargazers_count}</strong></div>
          <div>URL: /repos/jaywcjlove/webpack-api-mocker: <strong>{apiMocker.stargazers_count}</strong></div>
        </div>
      </header>
    </div>
  );
}

export default App;
