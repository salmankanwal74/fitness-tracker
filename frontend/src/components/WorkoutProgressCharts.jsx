import { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#2c7a7b', '#e67e22', '#8e44ad', '#2980b9', '#c0392b'];

// Hafte ki shuruaat (Monday) nikalna, taake hafte sahi tarteeb mein aayein
const weekStart = (dateStr) => {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const diff = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - diff);
  return d;
};

const weekLabel = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// Har hafte ke liye kisi field ka total
function weeklyTotals(workouts, field) {
  const map = new Map();
  workouts.forEach((w) => {
    const start = weekStart(w.date);
    const key = start.getTime();
    const prev = map.get(key) || { start, total: 0 };
    prev.total += Number(w[field]) || 0;
    map.set(key, prev);
  });
  return [...map.values()]
    .sort((a, b) => a.start - b.start)
    .map((x) => ({ week: `Week of ${weekLabel(x.start)}`, total: Math.round(x.total) }));
}

// workouts: Workouts page ke records (exerciseName, category, weight, duration, caloriesBurned, date)
function WorkoutProgressCharts({ workouts }) {
  const [selected, setSelected] = useState('');

  // 1) Exercise ka wazan (kg) tareekh ke hisab se
  const weighted = workouts.filter((w) => Number(w.weight) > 0);
  const names = [...new Set(weighted.map((w) => w.exerciseName))];
  const active = names.includes(selected) ? selected : '';
  const progress = weighted
    .filter((w) => w.exerciseName === active)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((w) => ({
      date: new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: w.weight,
    }));

  // 2) + 3) Haftawar calories aur minutes
  const caloriesData = weeklyTotals(workouts, 'caloriesBurned');
  const minutesData = weeklyTotals(workouts, 'duration');
  const hasCalories = caloriesData.some((d) => d.total > 0);
  const hasMinutes = minutesData.some((d) => d.total > 0);

  // 4) Category breakdown
  const catMap = {};
  workouts.forEach((w) => {
    const c = w.category || 'other';
    catMap[c] = (catMap[c] || 0) + 1;
  });
  const categoryData = Object.keys(catMap).map((name) => ({ name, value: catMap[name] }));

  if (workouts.length === 0) {
    return (
      <div className="chart-container" style={{ marginBottom: '20px' }}>
        <h3>Workout Progress</h3>
        <p>Add workouts on the Workouts page to see your progress charts here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="chart-container" style={{ marginBottom: '20px' }}>
        <h3>Weight Lifted Over Time (kg)</h3>
        {names.length === 0 ? (
          <p>Add a workout with a weight (kg) to see how your lifting improves.</p>
        ) : (
          <>
            <select
              value={active}
              onChange={(e) => setSelected(e.target.value)}
              className="analytics-select"
              aria-label="Select exercise"
            >
              <option value="">Select an exercise</option>
              {names.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            {active && progress.length > 0 ? (
              progress.length < 2 ? (
                <p>
                  {active}: {progress[0].weight} kg. Log this exercise on another day to see the trend.
                </p>
              ) : (
                <div role="img" aria-label={`${active} weight lifted over time`}>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={progress} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={['dataMin - 2', 'dataMax + 2']} allowDecimals={false} width={50} />
                      <Tooltip formatter={(v) => [`${v} kg`, active]} />
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
              )
            ) : (
              <p>Select an exercise above to see its progress.</p>
            )}
          </>
        )}
      </div>

      <div className="charts-row" style={{ marginBottom: '20px' }}>
        <div className="chart-container">
          <h3>Calories Burned (per week)</h3>
          {hasCalories ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={caloriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(v) => [`${v} kcal`, 'Calories']} />
                <Bar dataKey="total" fill="#e67e22" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p>Add calories when logging a workout to see this chart.</p>
          )}
        </div>

        <div className="chart-container">
          <h3>Workout Minutes (per week)</h3>
          {hasMinutes ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={minutesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(v) => [`${v} min`, 'Duration']} />
                <Bar dataKey="total" fill="#2980b9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p>Add duration when logging a workout to see this chart.</p>
          )}
        </div>
      </div>

      <div className="chart-container" style={{ marginBottom: '20px' }}>
        <h3>Workout Types</h3>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={90} label>
              {categoryData.map((entry, i) => (
                <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

export default WorkoutProgressCharts;