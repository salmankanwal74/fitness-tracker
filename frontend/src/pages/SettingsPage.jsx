import { useState } from 'react';
import { useSettings } from '../context/SettingsContext';

const THEME_OPTIONS = [
  { value: 'light', label: '☀️ Light' },
  { value: 'dark', label: '🌙 Dark' },
  { value: 'system', label: '💻 System' },
];

const NOTIFICATION_OPTIONS = [
  { key: 'workoutMilestones', label: 'Workout milestones', hint: 'Jab aap ek round number tak workouts complete karein (5, 10, 15...)' },
  { key: 'streaks', label: 'Workout streaks', hint: 'Lagataar dinon tak workout karne par' },
  { key: 'weightProgress', label: 'Weight progress', hint: 'Jab aapka weight tracking shuru se kam ho jaye' },
  { key: 'mealReminders', label: 'Meal reminders', hint: 'Agar aaj koi meal log nahi hui' },
];

function SettingsPage() {
  const { settings, loading, updateSettings } = useSettings();
  const [saving, setSaving] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleThemeChange = async (theme) => {
    setSaving('theme');
    try {
      await updateSettings({ theme });
    } catch {
      setMsg({ type: 'error', text: 'Theme save nahi ho saki' });
    }
    setSaving('');
  };

  const handleUnitChange = async (field, value) => {
    setSaving(field);
    setMsg({ type: '', text: '' });
    try {
      await updateSettings({ [field]: value });
      setMsg({ type: 'success', text: 'Settings save ho gayi' });
    } catch {
      setMsg({ type: 'error', text: 'Save nahi ho saka, dobara koshish karein' });
    }
    setSaving('');
  };

  const handleNotificationToggle = async (key, value) => {
    setSaving(key);
    try {
      await updateSettings({ notifications: { [key]: value } });
    } catch {
      setMsg({ type: 'error', text: 'Save nahi ho saka, dobara koshish karein' });
    }
    setSaving('');
  };

  if (loading) {
    return (
      <div className="page-container">
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="page-container settings-page">
      <h2>Settings</h2>
      {msg.text && <p className={msg.type === 'success' ? 'success-msg' : 'error'}>{msg.text}</p>}

      <div className="settings-section">
        <h3>Appearance</h3>
        <p className="settings-desc">App ka theme chunein</p>
        <div className="theme-options">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`theme-option ${settings.theme === opt.value ? 'theme-option-active' : ''}`}
              onClick={() => handleThemeChange(opt.value)}
              disabled={saving === 'theme'}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <h3>Units of Measurement</h3>
        <p className="settings-desc">
          Weight aur measurements kis unit mein dikhein. Data hamesha sahi save hota hai, sirf display badalti hai.
        </p>

        <div className="settings-row">
          <div>
            <strong>Weight</strong>
            <p className="settings-desc">Weight tracking aur workouts mein</p>
          </div>
          <select
            value={settings.weightUnit}
            onChange={(e) => handleUnitChange('weightUnit', e.target.value)}
            disabled={saving === 'weightUnit'}
          >
            <option value="kg">Kilograms (kg)</option>
            <option value="lbs">Pounds (lbs)</option>
          </select>
        </div>

        <div className="settings-row">
          <div>
            <strong>Body Measurements</strong>
            <p className="settings-desc">Chest, waist, hips, arms, thighs</p>
          </div>
          <select
            value={settings.lengthUnit}
            onChange={(e) => handleUnitChange('lengthUnit', e.target.value)}
            disabled={saving === 'lengthUnit'}
          >
            <option value="cm">Centimeters (cm)</option>
            <option value="in">Inches (in)</option>
          </select>
        </div>
      </div>

      <div className="settings-section">
        <h3>Notifications</h3>
        <p className="settings-desc">Dashboard par kaunsi notifications dikhein</p>

        {NOTIFICATION_OPTIONS.map((opt) => (
          <div className="settings-row" key={opt.key}>
            <div>
              <strong>{opt.label}</strong>
              <p className="settings-desc">{opt.hint}</p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.notifications[opt.key]}
                onChange={(e) => handleNotificationToggle(opt.key, e.target.checked)}
                disabled={saving === opt.key}
              />
              <span className="switch-slider"></span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SettingsPage;
