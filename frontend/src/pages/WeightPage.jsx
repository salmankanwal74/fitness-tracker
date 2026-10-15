import { useState, useEffect } from 'react';
import { getWeights, addWeight, updateWeight, deleteWeight } from '../services/weightService';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { displayWeight, toStorageWeight } from '../utils/unitConversion';
import { exportToCSV, exportWeightToPDF } from '../services/exportService';

function WeightPage() {
  const { settings } = useSettings();
  const { user } = useAuth();
  const unit = settings.weightUnit; // 'kg' ya 'lbs'

  const [weights, setWeights] = useState([]);
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchWeights();
  }, []);

  const fetchWeights = async () => {
    const data = await getWeights();
    setWeights(data);
  };

  const resetForm = () => {
    setWeight('');
    setDate('');
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Form mein jo unit dikh rahi hai usse hamesha kg mein convert kar ke save karte hain
    const weightData = { weight: toStorageWeight(weight, unit), date: date || undefined };

    if (editingId) {
      await updateWeight(editingId, weightData);
    } else {
      await addWeight(weightData);
    }

    resetForm();
    fetchWeights();
  };

  const handleEdit = (entry) => {
    setWeight(displayWeight(entry.weight, unit));
    setDate(entry.date.split('T')[0]);
    setEditingId(entry._id);
  };

  const handleDelete = async (id) => {
    await deleteWeight(id);
    fetchWeights();
  };

  const handleExportCSV = () => {
    const rows = weights.map((w) => ({
      weight: displayWeight(w.weight, unit),
      unit,
      date: new Date(w.date).toLocaleDateString(),
    }));
    exportToCSV(rows, 'weight');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Weight Tracking</h2>
        <div className="export-buttons">
          <button onClick={handleExportCSV} className="export-btn">📄 CSV</button>
          <button onClick={() => exportWeightToPDF(weights, user.name, unit, displayWeight)} className="export-btn">
            📑 PDF
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="workout-form">
        <input
          type="number"
          step="0.1"
          placeholder={`Weight (${unit})`}
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onWheel={(e) => e.target.blur()}
          required
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button type="submit">{editingId ? 'Update Entry' : 'Add Entry'}</button>
      </form>

      <div className="workout-list">
        {weights.length === 0 && <p>No weight entries yet. Add your first one above!</p>}
        {weights.map((entry) => (
          <div key={entry._id} className="workout-card">
            <div>
              <h3>{displayWeight(entry.weight, unit)} {unit}</h3>
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

export default WeightPage;
