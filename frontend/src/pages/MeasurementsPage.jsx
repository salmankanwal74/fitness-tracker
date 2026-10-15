import { useState, useEffect } from 'react';
import {
  getMeasurements,
  addMeasurement,
  updateMeasurement,
  deleteMeasurement,
} from '../services/measurementService';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { displayLength, toStorageLength } from '../utils/unitConversion';
import { exportToCSV, exportMeasurementsToPDF } from '../services/exportService';

import DateRangeFilter from '../components/DateRangeFilter';
import { inDateRange, sortByDate } from '../utils/filters';

function MeasurementsPage() {
  const { settings } = useSettings();
  const { user } = useAuth();
  const unit = settings.lengthUnit; // 'cm' ya 'in'

  const [entries, setEntries] = useState([]);
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [arms, setArms] = useState('');
  const [thighs, setThighs] = useState('');
  const [date, setDate] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [order, setOrder] = useState('newest');

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    const data = await getMeasurements();
    setEntries(data);
  };

  const resetForm = () => {
    setChest('');
    setWaist('');
    setHips('');
    setArms('');
    setThighs('');
    setDate('');
    setEditingId(null);
  };

  const toStorage = (value) => (value === '' ? undefined : toStorageLength(value, unit));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      chest: toStorage(chest),
      waist: toStorage(waist),
      hips: toStorage(hips),
      arms: toStorage(arms),
      thighs: toStorage(thighs),
      date: date || undefined,
    };

    if (editingId) {
      await updateMeasurement(editingId, data);
    } else {
      await addMeasurement(data);
    }

    resetForm();
    fetchEntries();
  };

  const handleEdit = (entry) => {
    setChest(entry.chest ? displayLength(entry.chest, unit) : '');
    setWaist(entry.waist ? displayLength(entry.waist, unit) : '');
    setHips(entry.hips ? displayLength(entry.hips, unit) : '');
    setArms(entry.arms ? displayLength(entry.arms, unit) : '');
    setThighs(entry.thighs ? displayLength(entry.thighs, unit) : '');
    setDate(entry.date.split('T')[0]);
    setEditingId(entry._id);
  };

  const handleDelete = async (id) => {
    await deleteMeasurement(id);
    fetchEntries();
  };

  const filteredEntries = sortByDate(
    entries.filter((e) => inDateRange(e.date, from, to)),
    order
  );
  const hasFilters = from || to || order !== 'newest';

  const handleExportCSV = () => {
    const rows = filteredEntries.map((e) => ({
      chest: e.chest ? displayLength(e.chest, unit) : '',
      waist: e.waist ? displayLength(e.waist, unit) : '',
      hips: e.hips ? displayLength(e.hips, unit) : '',
      arms: e.arms ? displayLength(e.arms, unit) : '',
      thighs: e.thighs ? displayLength(e.thighs, unit) : '',
      unit,
      date: new Date(e.date).toLocaleDateString(),
    }));
    exportToCSV(rows, 'measurements');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Body Measurements ({unit})</h2>
        <div className="export-buttons">
          <button onClick={handleExportCSV} className="export-btn">📄 CSV</button>
          <button onClick={() => exportMeasurementsToPDF(filteredEntries, user.name, unit, displayLength)} className="export-btn">
            📑 PDF
          </button>
        </div>
      </div>

      <div className="search-filter-bar">
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
        <input
          type="number"
          placeholder={`Chest (${unit})`}
          value={chest}
          onChange={(e) => setChest(e.target.value)}
          onWheel={(e) => e.target.blur()}
        />
        <input
          type="number"
          placeholder={`Waist (${unit})`}
          value={waist}
          onChange={(e) => setWaist(e.target.value)}
          onWheel={(e) => e.target.blur()}
        />
        <input
          type="number"
          placeholder={`Hips (${unit})`}
          value={hips}
          onChange={(e) => setHips(e.target.value)}
          onWheel={(e) => e.target.blur()}
        />
        <input
          type="number"
          placeholder={`Arms (${unit})`}
          value={arms}
          onChange={(e) => setArms(e.target.value)}
          onWheel={(e) => e.target.blur()}
        />
        <input
          type="number"
          placeholder={`Thighs (${unit})`}
          value={thighs}
          onChange={(e) => setThighs(e.target.value)}
          onWheel={(e) => e.target.blur()}
        />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button type="submit">{editingId ? 'Update Entry' : 'Add Entry'}</button>
      </form>

      <div className="workout-list">
        {entries.length === 0 && <p>No measurements yet. Add your first one above!</p>}
        {entries.length > 0 && filteredEntries.length === 0 && <p>No entries match your filters.</p>}
        {filteredEntries.map((entry) => (
          <div key={entry._id} className="workout-card">
            <div>
              <p>
                {entry.chest ? `Chest: ${displayLength(entry.chest, unit)}${unit} ` : ''}
                {entry.waist ? `· Waist: ${displayLength(entry.waist, unit)}${unit} ` : ''}
                {entry.hips ? `· Hips: ${displayLength(entry.hips, unit)}${unit} ` : ''}
                {entry.arms ? `· Arms: ${displayLength(entry.arms, unit)}${unit} ` : ''}
                {entry.thighs ? `· Thighs: ${displayLength(entry.thighs, unit)}${unit}` : ''}
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

export default MeasurementsPage;