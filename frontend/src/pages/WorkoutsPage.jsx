import { useState, useEffect } from 'react';
import { getWorkouts, createWorkout, deleteWorkout, updateWorkout } from '../services/workoutService';
import { exportToCSV, exportWorkoutsToPDF } from '../services/exportService';
import { useAuth } from '../context/AuthContext';
import StaggerIn from '../components/motion/StaggerIn';
import FlyInHeading from '../components/motion/FlyInHeading';
import { motion } from 'framer-motion';
import { getWeights } from '../services/weightService';
import { estimateCaloriesBurned } from '../utils/calorieCalculator';
import { workoutsToCSVRows } from '../utils/csvRows';

const CATEGORIES = ['strength', 'cardio', 'flexibility', 'sports', 'other'];

function WorkoutsPage() {
  const [workouts, setWorkouts] = useState([]);
  const [exerciseName, setExerciseName] = useState('');
  const [category, setCategory] = useState('strength');
  const [tags, setTags] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState('');
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [date, setDate] = useState('');
  const [editingId, setEditingId] = useState(null);
  const { user } = useAuth();
  const [latestWeightKg, setLatestWeightKg] = useState(null);
  const [caloriesTouched, setCaloriesTouched] = useState(false); // user ne khud field edit ki ya nahi

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterTag, setFilterTag] = useState('');

  useEffect(() => {
    fetchWorkouts();
    // User ka sabse recent tracked weight le lete hain, calorie estimate ke liye
    (async () => {
      const weights = await getWeights();
      if (weights.length > 0) setLatestWeightKg(weights[weights.length - 1].weight);
    })();
  }, []);

  const fetchWorkouts = async () => {
    const data = await getWorkouts();
    setWorkouts(data);
  };

  // Jab tak user ne khud Calories field na chhedi ho, exercise/duration/sets
  // badalte hi naya estimate khud-ba-khud bhar deta hai.
  const caloriesEstimate = estimateCaloriesBurned({
    exerciseName,
    category,
    durationMinutes: Number(duration) || null,
    sets: Number(sets) || null,
    weightKg: latestWeightKg,
  });

  useEffect(() => {
    if (!caloriesTouched && caloriesEstimate) {
      setCaloriesBurned(String(caloriesEstimate.calories));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseName, category, duration, sets, latestWeightKg, caloriesTouched]);

  const resetForm = () => {
    setCaloriesTouched(false);
    setExerciseName('');
    setCategory('strength');
    setTags('');
    setSets('');
    setReps('');
    setWeight('');
    setNotes('');
    setDuration('');
    setCaloriesBurned('');
    setDate('');
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const workoutData = {
      exerciseName,
      category,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      sets,
      reps,
      weight: weight || 0,
      notes,
      duration,
      caloriesBurned,
      date: date || undefined,
    };

    if (editingId) {
      await updateWorkout(editingId, workoutData);
    } else {
      await createWorkout(workoutData);
    }

    resetForm();
    fetchWorkouts();
  };

  const handleEdit = (workout) => {
    setExerciseName(workout.exerciseName);
    setCategory(workout.category || 'strength');
    setTags((workout.tags || []).join(', '));
    setSets(workout.sets);
    setReps(workout.reps);
    setWeight(workout.weight || '');
    setNotes(workout.notes || '');
    setDuration(workout.duration || '');
    setCaloriesBurned(workout.caloriesBurned || '');
    setCaloriesTouched(true); // edit karte waqt saved value rakhte hain, auto-overwrite nahi
    setDate(workout.date.split('T')[0]);
    setEditingId(workout._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    await deleteWorkout(id);
    fetchWorkouts();
  };

  const filteredWorkouts = workouts.filter((w) => {
    const matchesSearch = w.exerciseName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = filterDate ? w.date.split('T')[0] === filterDate : true;
    const matchesCategory = filterCategory === 'all' ? true : w.category === filterCategory;
    const matchesTag = filterTag
      ? (w.tags || []).some((t) => t.includes(filterTag.toLowerCase().trim()))
      : true;
    return matchesSearch && matchesDate && matchesCategory && matchesTag;
  });

  const hasFilters = searchTerm || filterDate || filterCategory !== 'all' || filterTag;

  return (
    <div className="page-container">
      <div className="page-header">
        <FlyInHeading text="Workouts" as="h2" loop loopInterval={4000} />
        <div className="export-buttons">
          <button onClick={() => exportToCSV(workoutsToCSVRows(filteredWorkouts), 'workouts')} className="export-btn">            📄 CSV
          </button>
          <button onClick={() => exportWorkoutsToPDF(filteredWorkouts, user.name)} className="export-btn">
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
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="🏷️ Filter by tag..."
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
        />
        <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
        {hasFilters && (
          <button
            type="button"
            className="clear-filter-btn"
            onClick={() => {
              setSearchTerm('');
              setFilterDate('');
              setFilterCategory('all');
              setFilterTag('');
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* "Workouts" heading letter-by-letter fly-in complete hone (~0.6s)
          ke baad hi form aata hai */}
      <motion.form
        onSubmit={handleSubmit}
        className="workout-form"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.32, ease: 'easeOut' }}
      >
        <input
          type="text"
          placeholder="Exercise Name"
          value={exerciseName}
          onChange={(e) => setExerciseName(e.target.value)}
          required
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Sets"
          value={sets}
          onChange={(e) => setSets(e.target.value)}
          onWheel={(e) => e.target.blur()}
          required
        />
        <input
          type="number"
          placeholder="Reps"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          onWheel={(e) => e.target.blur()}
          required
        />
        <input
          type="number"
          step="0.5"
          placeholder="Weight (kg)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onWheel={(e) => e.target.blur()}
        />
        <input
          type="number"
          placeholder="Duration (minutes)"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          onWheel={(e) => e.target.blur()}
        />
        <div className="calorie-field form-full-width">
          <div className="calorie-input-row">
            <input
              type="number"
              placeholder="Calories Burned"
              value={caloriesBurned}
              onChange={(e) => {
                setCaloriesBurned(e.target.value);
                setCaloriesTouched(true);
              }}
              onWheel={(e) => e.target.blur()}
            />
            {caloriesTouched && caloriesEstimate && (
              <button
                type="button"
                className="use-estimate-btn"
                onClick={() => {
                  setCaloriesBurned(String(caloriesEstimate.calories));
                  setCaloriesTouched(false);
                }}
              >
                🔄 Use estimate ({caloriesEstimate.calories})
              </button>
            )}
          </div>
          {!caloriesTouched && caloriesEstimate && (
            <small className="calorie-hint">
              💡 Auto-estimated ({caloriesEstimate.met} MET
              {caloriesEstimate.isEstimatedDuration ? ', duration guessed from sets' : ''}
              {caloriesEstimate.usedDefaultWeight ? ' — add a weight entry for a more accurate number' : ''}
              ) — aap chahein to isay edit kar sakte hain.
            </small>
          )}
          {!caloriesEstimate && (
            <small className="calorie-hint">
              Exercise ka naam, category aur sets/duration bharein — calories khud estimate ho jaayengi.
            </small>
          )}
        </div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input
          type="text"
          placeholder="Tags (comma separated: push, upper body)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="form-full-width"
        />
        <textarea
          placeholder="Notes (optional) — form, feeling, rest time..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="form-full-width"
        />
        <div className="form-actions form-full-width">
          <button type="submit">{editingId ? 'Update Workout' : 'Add Workout'}</button>
          {editingId && (
            <button type="button" className="cancel-btn" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </motion.form>

      {filteredWorkouts.length === 0 ? (
        <p>No workouts found.</p>
      ) : (
        {/* Form ke fade-in (~0.92s tak) ke baad cards ek ek karke aati hain */},
        <StaggerIn className="workout-list" staggerDelay={0.06} startDelay={0.95}>
          {filteredWorkouts.map((workout) => (
            <div key={workout._id} className="workout-card">
              <div className="workout-info">
                <div className="workout-title-row">
                  <h3>{workout.exerciseName}</h3>
                  <span className={`category-badge category-${workout.category || 'strength'}`}>
                    {workout.category || 'strength'}
                  </span>
                </div>

                <p>
                  {workout.sets} sets × {workout.reps} reps
                  {workout.weight ? ` @ ${workout.weight} kg` : ''}
                  {workout.duration ? ` · ${workout.duration} min` : ''}
                  {workout.caloriesBurned ? ` · ${workout.caloriesBurned} kcal` : ''}
                </p>

                {workout.tags && workout.tags.length > 0 && (
                  <div className="tag-row">
                    {workout.tags.map((t) => (
                      <span
                        key={t}
                        className="tag-chip"
                        onClick={() => setFilterTag(t)}
                        title="Is tag se filter karein"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {workout.notes && <p className="workout-notes">📝 {workout.notes}</p>}

                <small>{new Date(workout.date).toLocaleDateString()}</small>
              </div>
              <div className="workout-actions">
                <button onClick={() => handleEdit(workout)}>Edit</button>
                <button onClick={() => handleDelete(workout._id)}>Delete</button>
              </div>
            </div>
          ))}
        </StaggerIn>
      )}
    </div>
  );
}

export default WorkoutsPage;
