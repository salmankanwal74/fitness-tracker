import { useState, useEffect } from 'react';
import { getWorkouts } from '../services/workoutService';
import { getPerformance } from '../services/performanceService';
import { getMeasurements } from '../services/measurementService';
import { getWeights } from '../services/weightService';
import { getGoal } from '../services/goalService';
import { useSettings } from '../context/SettingsContext';
import PerformanceProgressChart from '../components/PerformanceProgressChart';
import MeasurementsChart from '../components/MeasurementsChart';
import WeightChart from '../components/WeightChart';
import WorkoutProgressCharts from '../components/WorkoutProgressCharts';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function WorkoutAnalyticsPage() {
  const { settings } = useSettings();
  const [workouts, setWorkouts] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [weights, setWeights] = useState([]);
  const [goal, setGoal] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

   const fetchData = async () => {
    const [workoutData, performanceData, measurementData, weightData, goalData] = await Promise.all([
      getWorkouts(),
      getPerformance(),
      getMeasurements(),
      getWeights(),
      getGoal(),
    ]);
    setWorkouts(workoutData);
    setPerformance(performanceData);
    setMeasurements(measurementData);
    setWeights(weightData);
    setGoal(goalData);
  };

  // Workouts ko week ke hisab se group karna
  const getWeekLabel = (dateStr) => {
    const date = new Date(dateStr);
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((date - firstDayOfYear) / 86400000 + firstDayOfYear.getDay() + 1) / 7);
    return `Week ${weekNum}`;
  };

  const workoutsPerWeek = {};
  workouts.forEach((w) => {
    const week = getWeekLabel(w.date);
    workoutsPerWeek[week] = (workoutsPerWeek[week] || 0) + 1;
  });
  const frequencyChartData = Object.keys(workoutsPerWeek).map((week) => ({
    week,
    count: workoutsPerWeek[week],
  }));

  return (
    <div className="page-container">
      <h2>Workout Analytics</h2>

            {/* Workouts page ke data se graphs */}
      <WorkoutProgressCharts workouts={workouts} />
      
      {/* Strength + Cardio progress (Performance page ke records se) */}
      <PerformanceProgressChart performance={performance} />
      <WeightChart weights={weights} unit={settings.weightUnit} targetKg={goal?.targetWeight} />

      {/* Body measurements progress (Measurements page ke records se) */}
      <MeasurementsChart entries={measurements} unit={settings.lengthUnit} />

      <div className="chart-container" style={{ marginBottom: '20px' }}>
        <h3>Workout Frequency (per week)</h3>
        {frequencyChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={frequencyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#2c7a7b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p>No workout data yet.</p>
        )}
      </div>

      <div className="chart-container">
        <h3>Exercise History</h3>
        {workouts.length === 0 && <p>No workouts yet.</p>}
        <div className="table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>Exercise</th>
                <th>Sets</th>
                <th>Reps</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {workouts.map((w) => (
                <tr key={w._id}>
                  <td>{w.exerciseName}</td>
                  <td>{w.sets}</td>
                  <td>{w.reps}</td>
                  <td>{new Date(w.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default WorkoutAnalyticsPage;