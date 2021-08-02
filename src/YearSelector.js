const years = Array.from(new Array(58), (val, index) => index + 1960)


function YearSelector({ year, setYear, percentMode, setPercentMode, disable}) {
  function onChange(event) {
    setYear(event.target.value);
  }

  function onRadioButtonChange(event) {
    const isPercent = event.target.value == "Percent";
    setPercentMode(isPercent);
  }

  const value = percentMode ? "percent" : "absolute";
  return (
    <span>
      <select disabled={disable} onChange={onChange} value={year} style={{"fontSize": 32}}>
       {
         years.map((y, index) => {
           return <option key={`year${index}`} value={y} >{y}</option>
         })
       }
      </select>
      <form disabled="true">
        <input disabled={percentMode ? disable : undefined} type="radio" name="mode_selector" value="Absolute" onChange={onRadioButtonChange} checked={percentMode ? undefined : "checked"} style={{"fontSize": 32}} />Per Capita Values<br />
        <input disabled={percentMode ? undefined : disable} type="radio" name="mode_selector" value="Percent" onChange={onRadioButtonChange} checked={percentMode ? "checked" : undefined}/>Percent Change Over 10 Years<br />
      </form>
    </span>
  );
}

export default YearSelector;
