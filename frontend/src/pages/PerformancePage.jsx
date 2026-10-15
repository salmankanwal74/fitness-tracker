import { useState, useEffect } from 'react';
import {
  getPerformance,
  addPerformance,
  updatePerformance,
  deletePerformance,
} from '../services/performanceService';
import { useAuth } from '../context/AuthContext';
import { exportToCSV, exportPerformanceToPDF } from '../services/exportService';

import DateRangeFilter from '../components/DateRangeFilter';
import { inDateRange, sortByDate } from '../utils/filters';

function PerformancePage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [type, setType] = useState('strength');
  const [exerciseName, setExerciseName] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('kg');
  const [date, setDate] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [order, setOrder] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    const data = await getPerformance();
    setEntries(data);
  };

  const resetForm = () => {
    setType('strength');
    setExerciseName('');
    setValue('');
    setUnit('kg');
    setDate('');
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { type, exerciseName, value, unit, date: date || undefined };

    if (editingId) {
      await updatePerformance(editingId, data);
    } else {
      await addPerformance(data);
    }

    resetForm();
    fetchEntries();
  };

  const handleEdit = (entry) => {
    setType(entry.type);
    setExerciseName(entry.exerciseName);
    setValue(entry.value);
    setUnit(entry.unit);
    setDate(entry.date.split('T')[0]);
    setEditingId(entry._id);
  };

  const handleDelete = async (id) => {
    await deletePerformance(id);
    fetchEntries();
  };

  const filteredEntries = sortByDate(
    entries.filter(
      (e) =>
        e.exerciseName.toLowerCase().includes(searchTerm.toLowerCase().trim()) &&
        (filterType ? e.type === filterType : true) &&
        inDateRange(e.date, from, to)
    ),
    order
  );
  const hasFilters = searchTerm || filterType || from || to || order !== 'newest';

  const handleExportCSV = () => {
    const rows = filteredEntries.map((e) => ({
      exercise: e.exerciseName,
      type: e.type,
      value: e.value,
      unit: e.unit,
      date: new Date(e.date).toLocaleDateString(),
    }));
    exportToCSV(rows, 'performance');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Performance Records</h2>
        <div className="export-buttons">
          <button onClick={handleExportCSV} className="export-btn">📄 CSV</button>
          <button onClick={() => exportPerformanceToPDF(filteredEntries, user.name)} className="export-btn">
            📑 PDF
          </button>
        </div>
      </div>

      <div className="search-filter-bar">
        <input
          type="text"
          placeholder="🔍 Search exercise..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} aria-label="Filter by type">
          <option value="">All Types</option>
          <option value="strength">Strength</option>
          <option value="cardio">Cardio</option>
        </select>
        <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
        <select value={order} onChange={(e) => setOrder(e.target.value)} aria-label="Sort order">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
        {hasFilters && (
          <button
            type="button"
            className="clear-filter-btn"
            onClick={() => {
              setFrom('');
              setTo('');
              setOrder('newest');
              setSearchTerm('');
              setFilterType('');
            }}
          >
            Clear
          </button>
        )}
      </div>
      {hasFilters && (
        <p className="filter-count">
          Showing {filteredEntries.length} of {entries.length}
        </p>
      )}

      <form onSubmit={handleSubmit} className="workout-form">
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="strength">Strength</option>
          <option value="cardio">Cardio</option>
        </select>
        <input
          type="text"
          placeholder="Exercise (e.g. Bench Press)"
          value={exerciseName}
          onChange={(e) => setExerciseName(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onWheel={(e) => e.target.blur()}
          required
        />
        <select value={unit} onChange={(e) => setUnit(e.target.value)}>
          <option value="kg">kg</option>
          <option value="lbs">lbs</option>
          <option value="minutes">minutes</option>
          <option value="km">km</option>
          <option value="reps">reps</option>
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button type="submit">{editingId ? 'Update Record' : 'Add Record'}</button>
      </form>

      <div className="workout-list">
        {entries.length === 0 && <p>No performance records yet. Add your first one above!</p>}
        {entries.length > 0 && filteredEntries.length === 0 && <p>No records match your filters.</p>}
        {filteredEntries.map((entry) => (
          <div key={entry._id} className="workout-card">
            <div>
              <h3>
                {entry.exerciseName} <span className="meal-tag">{entry.type}</span>
              </h3>
              <p>
                {entry.value} {entry.unit}
              </p>
              <small>{new Date(entry.date).toLocaleDateString()}</small>
            </div>
            <div className="workout-actions">
              <button onClick={() => handleEdit(entry)}>Edit</button>
              <button onClick={() => handleDelete(entry._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PerformancePage;