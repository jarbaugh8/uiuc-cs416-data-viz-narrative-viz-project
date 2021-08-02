import React, { useState, useEffect } from 'react';
import MyChart from './MyChart';
import './App.css';
import * as d3 from 'd3';

function App() {

  const [error, setError] = useState(null);
  const [dataLoadCount, setDataLoadCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [ghgData, setGhgData] = useState([]);
  const [gdpData, setGdpData] = useState([]);
  const [data, setData] = useState({});
  const [manualInputYear, setManualInputYear] = useState(undefined);
  const [year, setYear] = useState(manualInputYear ?? 1960);
  let requiredDataSourceCount = 0;

  function useCsv(url, setter) {
    requiredDataSourceCount++;

    useEffect(() => {
      d3.csv(url)
        .then(
          (result) => {
            setter(result);
            setDataLoadCount((c) => c+1);
          },
          (error) => {
            setError(error);
          }
        );
    }, []);
  }
  useCsv("/data/API_NY.GDP.PCAP.CD_DS2_en_csv_v2_2708431.csv", setGdpData);
  useCsv("/data/API_EN.ATM.CO2E.PC_DS2_en_csv_v2_2708833.csv", setGhgData);

  useEffect(() => {
    if (requiredDataSourceCount !== dataLoadCount) {
      return;
    }

    // All our data has been loaded. Let's preprocess it.
    const data = {};

    function mergeData(specificData, key) {
      specificData.forEach((obj) => {
        const years = [];
        for (var y = 1960; y <= 2020; y++) {
          years.push(y);
        }
        let prevValue = undefined;
        years.forEach(year => {
          const loc = obj['Country Name'];
          let value = parseFloat(obj[year]);
          if (!(loc in data)) {
            data[loc] = {};
          }
          if (!(year in data[loc])) {
            data[loc][year] = {};
          }
          if (isNaN(value) || value <= 0) {
            value = prevValue ?? 0; // use previous years data if missing
            data[loc][year]["isInvalidData"] = true;
          }
          prevValue = value;
          data[loc][year][key] = value;
        });
      });
    }


    mergeData(ghgData, 'ghg');
    mergeData(gdpData, 'gdp_per_cap');

    setData(data);

    setIsLoaded(true);
  }, [dataLoadCount]);

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

  const state = {manualInputYear, setManualInputYear, year, setYear};

  return (
    <div style={{"width": "100%", "height": "100%"}} className="App">
      <header style={{"width": "100%", "height": "100%"}} className="App-header">
        <MyChart data={data} state={state} />
      </header>
    </div>
  );
}

export default App;
