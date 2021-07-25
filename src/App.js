import React, { useState, useEffect } from 'react';
import BarChart from './BarChart';
import './App.css';
import * as d3 from 'd3';

function App() {

  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [data, setData] = useState([]);

  console.log("error: ", error);
  console.log("isLoaded: ", isLoaded);
  console.log("data: ", data);

  useEffect(() => {
    d3.csv("https://raw.githubusercontent.com/nytimes/covid-19-data/master/us.csv")
      .then(
        (result) => {
          // console.log("Data loaded!");
          // console.log("Result:");
          // console.log(result);
          // console.log(JSON.stringify(result));
          setData(result);
          setIsLoaded(true);
          // console.log("Done calling hooks.");
        },
        (error) => {
          setIsLoaded(true);
          setError(error);
        }
      )
  }, []);

  if (!isLoaded) {
    return (
      <div>
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div>
        { error.toString() }
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <BarChart data={data} />
      </header>
    </div>
  );
}

export default App;
