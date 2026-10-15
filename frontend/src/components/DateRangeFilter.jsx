// "From" aur "To" ki do date fields (search-filter-bar ke andar istemal hota hai)
function DateRangeFilter({ from, to, onFromChange, onToChange }) {
  return (
    <>
      <label className="filter-field">
        <span>From</span>
        <input
          type="date"
          value={from}
          max={to || undefined}
          onChange={(e) => onFromChange(e.target.value)}
        />
      </label>
      <label className="filter-field">
        <span>To</span>
        <input
          type="date"
          value={to}
          min={from || undefined}
          onChange={(e) => onToChange(e.target.value)}
        />
      </label>
    </>
  );
}

export default DateRangeFilter;