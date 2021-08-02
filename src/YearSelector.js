const years = Array.from(new Array(58), (val, index) => index + 1960)


function YearSelector({ year, setYear, percentMode, setPercentMode, sceneNumber, setSceneNumber }) {
  const selectDisabled = sceneNumber < 3;
  function onChange(event) {
    setYear(event.target.value);
    if (sceneNumber === 3) {
      setSceneNumber(4); // end scenes
    }
  }

  function onRadioButtonChange(event) {
    const isPercent = event.target.value == "Percent";
    setPercentMode(isPercent);
    if (sceneNumber === 2 && isPercent) {
      setSceneNumber(3);
    }
    if (sceneNumber === 3) {
      setSceneNumber(4); // end scenes
    }
  }

  const value = percentMode ? "percent" : "absolute";
  const formDisabled = sceneNumber < 2 ? true : undefined;
  return (
    <span>
      <select disabled={selectDisabled} onChange={onChange} value={year} style={{"fontSize": 32}}>
       {
         years.map((y, index) => {
           return <option key={`year${index}`} value={y} >{y}</option>
         })
       }
      </select>
      <form>
        <input id="form-0" type="radio" name="mode_selector" value="Absolute" onChange={onRadioButtonChange} checked={percentMode ? undefined : "checked"} style={{"fontSize": 32}} />
        <label htmlFor="form-0">
          Per Capita Values<br />
        </label>
        <input
          id="form-1"
          disabled={formDisabled}
          type="radio"
          name="mode_selector"
          value="Percent"
          onChange={onRadioButtonChange}
          style={{color: formDisabled ? "gray" : "white"}}
          checked={percentMode ? "checked" : undefined}
        />
        <label htmlFor="form-1"> Percent Change Over 10 Years< br /></label>
      </form>
    </span>
  );
}

export default YearSelector;
