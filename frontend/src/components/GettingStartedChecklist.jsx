import { Link } from 'react-router-dom';
import { CheckCircle2, Circle } from 'lucide-react';

// Naye user ko batata hai ke agla kaam kya hai. Sab kaam hone par khud gayab ho jata hai.
function GettingStartedChecklist({ workouts, nutrition, weights, measurements, goal }) {
  const hasGoal = Boolean(goal && (goal.weeklyWorkoutTarget || goal.dailyCalorieTarget || goal.targetWeight));

  const items = [
    { label: 'Pehli workout log karein', to: '/workouts', done: workouts.length > 0 },
    { label: 'Apna khana (meal) add karein', to: '/nutrition', done: nutrition.length > 0 },
    { label: 'Apna weight add karein', to: '/weight', done: weights.length > 0 },
    { label: 'Body measurements add karein', to: '/measurements', done: measurements.length > 0 },
    { label: 'Apna goal set karein', to: '/goals', done: hasGoal },
  ];

  const doneCount = items.filter((i) => i.done).length;
  if (doneCount === items.length) return null;

  return (
    <div className="chart-container checklist-card">
      <div className="checklist-header">
        <h3>Shuru karein ({doneCount}/{items.length})</h3>
        <div className="checklist-track" aria-hidden="true">
          <div className="checklist-fill" style={{ width: `${(doneCount / items.length) * 100}%` }} />
        </div>
      </div>
      <ul className="checklist-list">
        {items.map((item) => (
          <li key={item.to} className={item.done ? 'checklist-done' : ''}>
            {item.done ? <CheckCircle2 size={18} aria-label="Done" /> : <Circle size={18} aria-label="Pending" />}
            {item.done ? (
              <span>{item.label}</span>
            ) : (
              <Link to={item.to}>{item.label} →</Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default GettingStartedChecklist;