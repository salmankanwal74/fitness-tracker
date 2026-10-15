import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { displayLength } from '../utils/unitConversion';

const PARTS = [
  { key: 'chest', label: 'Chest', color: '#2c7a7b' },
  { key: 'waist', label: 'Waist', color: '#e67e22' },
  { key: 'hips', label: 'Hips', color: '#8e44ad' },
  { key: 'arms', label: 'Arms', color: '#2980b9' },
  { key: 'thighs', label: 'Thighs', color: '#c0392b' },
];

// entries: measurement list, unit: 'cm' | 'in'
// Ek waqt mein sirf ek body part ka graph — taake chhoti tabdeeli bhi saaf nazar aaye
function MeasurementsChart({ entries, unit }) {
  const [partKey, setPartKey] = useState('');

  const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
  const availableParts = PARTS.filter((p) => sorted.filter((e) => e[p.key]).length >= 1);
  const part = availableParts.find((p) => p.key === partKey) || availableParts[0];

  const points = part
    ? sorted
        .filter((e) => e[part.key])
        .map((e) => ({
          date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: displayLength(e[part.key], unit),
        }))
    : [];

  const first = points.length ? points[0].value : null;
  const last = points.length ? points[points.length - 1].value : null;
  const diff = first !== null ? Math.round((last - first) * 10) / 10 : 0;

  return (
    <div className="chart-container" style={{ marginBottom: '20px' }}>
      <h3>Body Measurement Progress</h3>

      {availableParts.length === 0 ? (
        <p>No measurements yet. Add them on the Measurements page.</p>
      ) : (
        <>
          <div className="analytics-tabs" role="tablist" aria-label="Body part">
            {availableParts.map((p) => (
              <button
                key={p.key}
                type="button"
                role="tab"
                aria-selected={part.key === p.key}
                className={`analytics-tab ${part.key === p.key ? 'active' : ''}`}
                onClick={() => setPartKey(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {points.length < 2 ? (
            <p>
              {part.label}: {first} {unit}. Add one more {part.label.toLowerCase()} measurement on a
              different date to see the trend.
            </p>
          ) : (
            <>
              <div className="measure-summary">
                <div>
                  <small>Start</small>
                  <strong>
                    {first} {unit}
                  </strong>
                </div>
                <div>
                  <small>Now</small>
                  <strong>
                    {last} {unit}
                  </strong>
                </div>
                <div>
                  <small>Change</small>
                  <strong>
                    {diff > 0 ? '+' : ''}
                    {diff} {unit}
                  </strong>
                </div>
              </div>

              <div role="img" aria-label={`${part.label} measurement chart in ${unit}`}>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={points} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis
                      domain={['dataMin - 2', 'dataMax + 2']}
                      allowDecimals={false}
                      width={50}
                    />
                    <Tooltip formatter={(v) => [`${v} ${unit}`, part.label]} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name={part.label}
                      stroke={part.color}
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      label={{ position: 'top', fontSize: 12 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default MeasurementsChart;