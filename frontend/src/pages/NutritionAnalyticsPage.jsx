import { useState, useEffect } from 'react';
import { getNutrition } from '../services/nutritionService';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#2c7a7b', '#f0ad4e', '#e74c3c'];

function NutritionAnalyticsPage() {
  const [nutrition, setNutrition] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const data = await getNutrition();
    setNutrition(data);
  };

  // Daily calorie trend — har din ki total calories
  const caloriesPerDay = {};
  nutrition.forEach((n) => {
    const day = new Date(n.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    caloriesPerDay[day] = (caloriesPerDay[day] || 0) + (n.calories || 0);
  });
  const calorieChartData = Object.keys(caloriesPerDay).map((day) => ({
    date: day,
    calories: caloriesPerDay[day],
  }));

  // Macro totals (protein, carbs, fats)
  const totalProtein = nutrition.reduce((sum, n) => sum + (n.protein || 0), 0);
  const totalCarbs = nutrition.reduce((sum, n) => sum + (n.carbs || 0), 0);
  const totalFats = nutrition.reduce((sum, n) => sum + (n.fats || 0), 0);

  const macroChartData = [
    { name: 'Protein', value: totalProtein },
    { name: 'Carbs', value: totalCarbs },
    { name: 'Fats', value: totalFats },
  ].filter((m) => m.value > 0);

  // Meal type ke hisab se calories
  const caloriesByMeal = {};
  nutrition.forEach((n) => {
    caloriesByMeal[n.mealType] = (caloriesByMeal[n.mealType] || 0) + (n.calories || 0);
  });
  const mealChartData = Object.keys(caloriesByMeal).map((meal) => ({
    meal: meal.charAt(0).toUpperCase() + meal.slice(1),
    calories: caloriesByMeal[meal],
  }));

  return (
    <div className="page-container">
      <h2>Nutrition Analytics</h2>

      <div className="chart-container" style={{ marginBottom: '20px' }}>
        <h3>Daily Calorie Trend</h3>
        {calorieChartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={calorieChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="calories" stroke="#2c7a7b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p>Add nutrition entries on at least 2 different days to see this trend.</p>
        )}
      </div>

      <div className="charts-row">
        <div className="chart-container">
          <h3>Macro Distribution</h3>
          {macroChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={macroChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {macroChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p>Add protein/carbs/fats info to your nutrition entries to see this chart.</p>
          )}
        </div>

        <div className="chart-container">
          <h3>Calories by Meal Type</h3>
          {mealChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={mealChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="meal" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="calories" fill="#2c7a7b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p>No nutrition data yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default NutritionAnalyticsPage;