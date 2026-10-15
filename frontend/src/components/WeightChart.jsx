import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { displayWeight } from '../utils/unitConversion';

// weights: Weight page ke records (kg mein), unit: 'kg' | 'lbs', targetKg: goal ka target weight (optional)
function WeightChart({ weights, unit, targetKg }) {
  const points = [...weights]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((w) => ({
      date: new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: displayWeight(w.weight, unit),
    }));

  const target = targetKg ? displayWeight(targetKg, unit) : null;
  const first = points.length ? points[0].weight : null;
  const last = points.length ? points[points.length - 1].weight : null;
  const diff = first !== null ? Math.round((last - first) * 10) / 10 : 0;

  return (
    <div className="chart-container" style={{ marginBottom: '20px' }}>
      <h3>Weight Progress ({unit})</h3>
      {points.length === 0 ? (
        <p>No weight entries yet. Add them on the Weight page.</p>
      ) : points.length < 2 ? (
        <p>
          Current weight: {last} {unit}. Add another entry on a different date to see the trend.
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
            {target && (
              <div>
                <small>Goal</small>
                <strong>
                  {target} {unit}
                </strong>
              </div>
            )}
          </div>

          <div role="img" aria-label={`Weight progress chart in ${unit}`}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={points} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis
                  domain={[
                    (min) => Math.floor(Math.min(min, target ?? min) - 2),
                    (max) => Math.ceil(Math.max(max, target ?? max) + 2),
                  ]}
                  allowDecimals={false}
                  width={50}
                />
                <Tooltip formatter={(v) => [`${v} ${unit}`, 'Weight']} />
                {target && (
                  <ReferenceLine
                    y={target}
                    stroke="#e67e22"
                    strokeDasharray="6 4"
                    label={{ value: 'Goal', position: 'right', fill: '#e67e22', fontSize: 12 }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#2c7a7b"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  label={{ position: 'top', fontSize: 12 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

export default WeightChart;