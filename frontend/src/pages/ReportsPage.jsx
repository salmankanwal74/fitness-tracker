import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { getWorkouts } from '../services/workoutService';
import { getNutrition } from '../services/nutritionService';
import { getWeights } from '../services/weightService';
import { getMeasurements } from '../services/measurementService';
import { getPerformance } from '../services/performanceService';
import { exportFullReportToPDF } from '../services/exportService';
import { displayWeight, displayLength } from '../utils/unitConversion';

function ReportsPage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const [workouts, nutrition, weights, measurements, performance] = await Promise.all([
        getWorkouts(),
        getNutrition(),
        getWeights(),
        getMeasurements(),
        getPerformance(),
      ]);

      exportFullReportToPDF(
        { workouts, nutrition, weights, measurements, performance },
        user.name,
        { weightUnit: settings.weightUnit, lengthUnit: settings.lengthUnit },
        displayWeight,
        displayLength
      );
    } catch {
      alert('Report banane mein masla hua, dobara koshish karein.');
    }
    setGenerating(false);
  };

  return (
    <div className="page-container reports-page">
      <h2>Reports</h2>
      <p className="settings-desc">
        Apna poora fitness data — workouts, nutrition, weight, measurements aur performance —
        ek hi PDF mein download karein.
      </p>

      <div className="settings-section report-card">
        <h3>📊 Full Progress Report</h3>
        <p className="settings-desc">
          Ek PDF mein aapki har tarah ki tracked activity ka summary hoga, section by section.
        </p>
        <button onClick={handleDownload} disabled={generating}>
          {generating ? 'Generating...' : 'Download Full Report (PDF)'}
        </button>
      </div>

      <p className="settings-desc">
        Sirf ek category ka data chahiye? Workouts, Nutrition, Weight, Measurements aur
        Performance — har page ke upar apne apne CSV/PDF export buttons maujood hain.
      </p>
    </div>
  );
}

export default ReportsPage;

