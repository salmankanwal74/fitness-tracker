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

// performance: list of records { type, exerciseName, value, unit, date }
function PerformanceProgressChart({ performance }) {
  const [type, setType] = useState('strength');
  const [selected, setSelected] = useState('');

  const ofType = performance.filter((p) => (p.type || 'strength') === type);
  const names = [...new Set(ofType.map((p) => p.exerciseName))];
  const active = names.includes(selected) ? selected : '';

  const points = ofType
    .filter((p) => p.exerciseName === active)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const unit = points.length ? points[points.length - 1].unit : '';
  const data = points.map((p) => ({
    date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: p.value,
  }));

  const best = points.length ? Math.max(...points.map((p) => p.value)) : null;
  const lowest = points.length ? Math.min(...points.map((p) => p.value)) : null;

  return (
    <div className="chart-container" style={{ marginBottom: '20px' }}>
      <h3>Performance Progress</h3>

      <div className="analytics-tabs" role="tablist" aria-label="Performance type">
        {['strength', 'cardio'].map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={type === t}
            className={`analytics-tab ${type === t ? 'active' : ''}`}
            onClick={() => {
              setType(t);
              setSelected('');
            }}
          >
            {t === 'strength' ? 'Strength' : 'Cardio'}
          </button>
        ))}
      </div>

      {names.length === 0 ? (
        <p>
          No {type} records yet. Add them on the Performance page
          {type === 'cardio' ? ' (e.g. "5K Run", value 28, unit min).' : '.'}
        </p>
      ) : (
        <>
          <select
            value={active}
            onChange={(e) => setSelected(e.target.value)}
            className="analytics-select"
            aria-label="Select exercise"
          >
            <option value="">Select an exercise</option>
            {names.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          {active && data.length > 0 ? (
            <>
              <p className="filter-count">
                {type === 'strength' ? `Best: ${best} ${unit}` : `Lowest (fastest): ${lowest} ${unit}`}
                {' · '}
                {data.length} record{data.length > 1 ? 's' : ''}
              </p>
              <div role="img" aria-label={`${active} progress chart in ${unit}`}>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={['dataMin - 2', 'dataMax + 2']} unit={` ${unit}`} width={70} />
                    <Tooltip formatter={(v) => [`${v} ${unit}`, active]} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={type === 'cardio' ? '#e67e22' : '#2c7a7b'}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <p>Select an exercise above to see its progress.</p>
          )}
        </>
      )}
    </div>
  );
}

export default PerformanceProgressChart;