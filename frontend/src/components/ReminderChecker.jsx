import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getGoal } from '../services/goalService';
import { getWorkouts } from '../services/workoutService';
import { getNutrition } from '../services/nutritionService';

const CHECK_INTERVAL_MS = 60 * 1000; // har minute check karo

const currentHHMM = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

const alreadyFiredToday = (key) => {
  return localStorage.getItem(key) === new Date().toDateString();
};

const markFiredToday = (key) => {
  localStorage.setItem(key, new Date().toDateString());
};

const showNotification = (title, body) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  new Notification(title, { body, icon: '🏋️' });
};

// App khuli rehte hue background mein reminders check karta rehta hai.
// Ye service-worker push notification nahi hai — tab band hote hi rukk jaata hai,
// lekin app khuli ho to time aane par popup dikha deta hai.
function ReminderChecker() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const check = async () => {
      try {
        const goal = await getGoal();
        const now = currentHHMM();
        const today = new Date().toDateString();

        if (goal.workoutReminder?.enabled && goal.workoutReminder.time === now) {
          const key = 'reminder-fired-workout';
          if (!alreadyFiredToday(key)) {
            const workouts = await getWorkouts();
            const doneToday = workouts.some((w) => new Date(w.date).toDateString() === today);
            if (!doneToday) {
              showNotification('Workout Reminder 🏋️', "Aaj abhi tak workout log nahi hui — time nikal lein!");
            }
            markFiredToday(key);
          }
        }

        if (goal.mealReminder?.enabled && goal.mealReminder.time === now) {
          const key = 'reminder-fired-meal';
          if (!alreadyFiredToday(key)) {
            const nutrition = await getNutrition();
            const loggedToday = nutrition.some((n) => new Date(n.date).toDateString() === today);
            if (!loggedToday) {
              showNotification('Meal Reminder 🥗', 'Aaj ka khana abhi tak log nahi hua.');
            }
            markFiredToday(key);
          }
        }
      } catch {
        // Reminder check fail ho to chup chap skip karo, app ko disturb na karo
      }
    };

    check();
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user]);

  return null; // ye component kuch render nahi karta
}

export default ReminderChecker;

