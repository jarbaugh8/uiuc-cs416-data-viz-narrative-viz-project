// https://www.pluralsight.com/guides/using-d3.js-inside-a-react-app

import { useD3 } from './hooks/useD3';
import React, { useState, useEffect } from 'react';
import YearSelector from './YearSelector';
import * as d3_all from 'd3';
import * as d3_ann from 'd3-svg-annotation';

const d3 = {
  ...d3_all,
  ...d3_ann
}

function MyChart({ data, state }) {
  const [usePercentageDiff, setUsePercentageDiff] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState({});
  const [locationColors, setLocationColors] = useState({});
  const [sceneNumber, setSceneNumber] = useState(0);
  const fillColors = ["green", "blue", "red", "yellow", "orange", "purple"];
  console.log(`usePercentageDiff: ${usePercentageDiff}`);
  console.log(`locationColors: ${JSON.stringify(locationColors)}`);

  let { year, setYear, manualInputYear, setManualInputYear } = state;
  console.log(`year=${year}`);
  const offsetYears = -10;
  year = manualInputYear ?? year;
  const [myInterval, setMyInterval] = useState(undefined);

  const height = 800;
  const width = 1500;
  const margin = { top: 150, right: 30, bottom: 80, left: 100 };

  const transitionDuration = 1000;

  const yField = 'ghg'; // total emissions (TODO: convert to per cap...?)
  const xField = 'gdp_per_cap'; // GDP per cap
  const undefinedField = 'isInvalidData';


  const isInvalidRaw = ((loc, yr) => data?.[loc]?.[yr ?? year]?.[undefinedField] == true);
  let isInvalid = isInvalidRaw;
  if (usePercentageDiff) {
    isInvalid = (loc) => isInvalidRaw(loc,year-offsetYears) || isInvalidRaw(loc,year);
  }
  const yDataRaw = ((loc, yr, offset) => {
    yr = parseInt(yr ?? year);
    yr += offset ?? 0;
    if (isInvalid(loc, yr)) {
      yr = yr++; // Avoid weird transitions
    }
    return data?.[loc]?.[yr ?? year]?.[yField] ?? undefined;
  });
  const xDataRaw = ((loc, yr, offset) => {
    yr = parseInt(yr ?? year);
    yr += offset ?? 0;
    if (isInvalid(loc, yr)) {
      yr = yr++; // Avoid weird transitions
    }
    return data?.[loc]?.[yr ?? year]?.[xField] ?? undefined;
  });
  let yData = yDataRaw;
  let xData = xDataRaw;
  function infinityToUndefined(d) {
    return d == Infinity ? undefined : d;
  }
  if (usePercentageDiff) {
    yData = (d, y) => 100 * (infinityToUndefined(yDataRaw(d, y) / (yDataRaw(d, y, offsetYears)) - 1));
    xData = (d, y) => 100 * (infinityToUndefined(xDataRaw(d, y) / (xDataRaw(d, y, offsetYears)) - 1));
  }

  if (!manualInputYear && year > 2017) {
    setManualInputYear(2017);
  }


  const [locations, _] = useState(
    Object.keys(data).filter(l => yData(l, 2017) != null && xData(l, 2017) != null && yData(l, 2017) > 0 && xData(l, 2017) > 0)
  );

  useEffect(() => {
    console.log(sceneNumber, year);
    if (sceneNumber === 1 && year < 2017) {
      if (myInterval == undefined) {
        const interval = setInterval(() => {
          setYear(year => year + 10);
        }, 1000);

        setMyInterval(interval);
      }
    } else {
      if (myInterval) {
        clearInterval(myInterval);
        setMyInterval(undefined);
      }
    } 
  }, [sceneNumber, year]);


  const ref = useD3(
    (svg) => {

      //const yMin = 1; //Math.min(...locations.map(loc => yData(loc)));
      //const yMax = 50; // Math.max(...locations.map(loc => yData(loc)));
      //const xMin = 1; //Math.min(...locations.map(loc => xData(loc)));
      //const xMax = 200000; //Math.max(...locations.map(loc => xData(loc)));
      let yMin = Math.min(...locations.map(loc => yData(loc)).filter(d => d));
      let yMax = Math.max(...locations.map(loc => yData(loc)).filter(d => d));
      if (usePercentageDiff) {
        yMin -= 0.025 * (yMax - yMin);
        yMax += 0.025 * (yMax - yMin);
      }
      let xMin = Math.min(...locations.map(loc => xData(loc)).filter(d => d));
      let xMax = Math.max(...locations.map(loc => xData(loc)).filter(d => d));
      if (usePercentageDiff) {
        xMin -= 0.025 * (xMax - xMin);
        xMax += 0.025 * (xMax - xMin);
      } else {

      }

      const scale = usePercentageDiff ? d3.scaleLinear : d3.scaleLog;

      const y = scale()
        .domain([yMin, yMax])
        .rangeRound([height - margin.bottom, margin.top]);

      const get = function(val, default_val) {
        if (isNaN(val) || !val) {
          return default_val;
        }
        return val;
      }

      const getY = (d) => get(y(d), yMin);
      const getX = (d) => get(x(d), xMin);

      const x = scale()
        .domain([xMin, xMax])
        .rangeRound([margin.left, width - margin.right]);

      const yAxis = (g) =>
        g
          .attr("transform", `translate(${margin.left},0)`)
          .style("color", "steelblue")
          .transition()
          .duration(transitionDuration)
          .ease(d3.easePoly)
          .call(d3.axisLeft(y).ticks(null, "s"));

      const xAxis = (g) =>
        g
          .attr("transform", `translate(0,${height - margin.bottom})`)
          .style("color", "steelblue")
          .transition()
          .duration(transitionDuration)
          .ease(d3.easePoly)
          .call(d3.axisBottom(x).ticks(null, "s"));

      svg.select(".x-axis")
        .call(xAxis);
      svg.select(".y-axis")
        .call(yAxis);


      const tooltip = d3.select("#mychart-tooltip")
        .style("position", "absolute")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "black")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        //.style("font-size", "60%")
        .attr("position", "absolute"); // ???

      // Used as template:
      // https://www.d3-graph-gallery.com/graph/interactivity_tooltip.html#template
      // Three function that change the tooltip when user hover / move / leave a cell
      var mouseover = function(d) {
        tooltip
          .style("opacity", 1)
        d3.select(this)
          .style("stroke", "black")
          .style("opacity", 1)
          .style("width", "auto")
          .style("height", "auto")
      }

      const click = function(event, d) {
        let newLocations = { ...selectedLocations };
        newLocations[d] = !selectedLocations[d];
        setSelectedLocations(newLocations);
        if (locationColors[d] == undefined) {
          let newLocationColors = { ...locationColors };
          newLocationColors[d] = fillColors[Object.keys(locationColors).length % fillColors.length];
          setLocationColors(newLocationColors);
        }
        if (sceneNumber === 0) {
          setSceneNumber(1);
        }
      }
      console.log("ASDF");
      console.log(selectedLocations);

      const formatData = (d, n) => {
        if (!isFinite(d)) {
          return "N/A";
        }
        return d.toFixed(n);
      }
      var mousemove = function(event, d) {
        tooltip
          .html(`Country/Region:\t${d}<br>GDP per cap:\t$${formatData(xDataRaw(d), 0)} USD<br>GHG per cap:\t${formatData(yDataRaw(d), 2)} kt CO2 equiv`)
          .style("left", (d3.pointer(event)[0]+5) + "px")
          .style("top", (d3.pointer(event)[1]) + "px")
      }
      var mouseleave = function(d) {
        tooltip
          .style("opacity", 0)
        d3.select(this)
          .style("stroke", "none")
          .style("opacity", 0.8)
          .style("width", "0px")
          .style("height", "0px")
      }


      const fillColor = (l) => {
        let color = (isFinite(yData(l)) && isFinite(xData(l))) ? "white" : "gray";
        if (selectedLocations[l]) {
          color = locationColors[l];
        }
        return color;
      };

      const scatterPoints = svg
        .select(".plot-area")
        .attr("fill", "steelblue")
        .selectAll(".scatterpoint")
        .data(locations)
        .join("circle");

      function getRadius(d) {
        if (isInvalid(d)) {
          return 0;
        }
        if (selectedLocations[d]) {
          return 12;
        }
        return 6;
      }

      scatterPoints
        .transition()
        .duration(transitionDuration)
        .ease(d3.easePoly)
        .attr("class", "scatterpoint")
        .attr("cx", l => isInvalid(l) ? 0 : getX(xData(l)))
        .attr("cy", l => isInvalid(l) ? 0 : getY(yData(l)))
        .attr("r", getRadius)
        .attr("fill", fillColor);
      
      scatterPoints
        .on("mouseover", mouseover) // NOTE: conflicts with transition
        .on("click", click)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

      const labelPrefix = usePercentageDiff ? "% Change " : ""
      const labelPostfix = usePercentageDiff ? ` (last ${-offsetYears} years)` : ""

      // Add axis labels
      svg
        .select(".x-label")
        .attr("text-anchor", "end")
        .attr("x", width/2 + 190)
        .attr("y", height-10)
        .style("fill", "white")
        .attr("font-size", 20)
        .text(labelPrefix + "GDP per capita, inflation-adjusted (dollars)" + labelPostfix);

      // Add axis labels
      const yAxisX = 20;
      const yAxisY = height / 2 - 220;
      svg
        .select(".y-label")
        .attr("text-anchor", "end")
        .attr("x", yAxisX)
        .attr("y", yAxisY)
        .style("fill", "white")
        .attr("font-size", 20)
        .attr("transform", `rotate(-90, ${yAxisX}, ${yAxisY})`)
        .text(labelPrefix + "Greenhouse gas emissions per capita, CO2 kt equivalent" + labelPostfix);




      function testAnnotations() {
        const annX = x(xData("Qatar"));
        const annY = y(yData("Qatar"));
        const releventLocation = "Qatar";
        const type = d3.annotationLabel
        const annotations = [{
          note: {
            label: "Longer text to show text wrapping",
            bgPadding: 20,
            title: "Annotations :)"
          },
          subject: { radius: 12, radiusPadding: 10 },
          //can use x, y directly instead of data
          className: "show-bg",
          x: annX,
          y: annY,
          dy: -75,
          dx: -75
        }]

        const makeAnnotations = d3.annotation()
          //also can set and override in the note.padding property
          //of the annotation object
          .notePadding(15)
          .type(type)
          //accessors & accessorsInverse not needed
          //if using x, y in annotations JSON
          //.accessors({
          //  x: d => getX(xData(d)),
          //  y: d => getY(yData(d)),
          //})
          .annotations(annotations)

        d3.select("svg").selectAll(".annotation").remove();
        d3.select("svg")
          .append("g")
          .attr("class", ".annotation")
          .attr("class", "annotation-group")
          .call(makeAnnotations)
      }
      testAnnotations();
    },
    [year, usePercentageDiff, selectedLocations, locationColors, sceneNumber] // NOTE: Assumes data is forever constant
  );

  return (
    <div style={{"width": "100%", "height": "100%"}}>
      <div style={{"width": "100%", "height": "100%"}} id="mychart-container">
        <svg
          ref={ref}
          style={{
            height: height + "px",
            width: width + "px",
            marginRight: "0px",
            marginLeft: "0px",
          }}
          display="block"
          margin="auto"
        >
          <g className="plot-area" />
          <g className="x-axis" />
          <g className="y-axis" />
          <g className="annotation" />
          <text className="x-label" />
          <text className="y-label" />
        </svg>
        <div id="mychart-tooltip" />
      </div>
      <YearSelector year={year} setYear={setManualInputYear} percentMode={usePercentageDiff} setPercentMode={setUsePercentageDiff} disable={sceneNumber < 2} />
    </div>
  );
}

export default MyChart;
