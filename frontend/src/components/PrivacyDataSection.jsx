import { useState } from 'react';
import { Link } from 'react-router-dom';
import { exportMyData } from '../services/authService';

// Profile page ka "Your Data & Privacy" section
function PrivacyDataSection() {
  const [downloading, setDownloading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleDownload = async () => {
    setMsg({ type: '', text: '' });
    setDownloading(true);
    try {
      await exportMyData();
      setMsg({ type: 'success', text: 'Aapka data download ho gaya (my-fitness-data.json).' });
    } catch (err) {
      setMsg({
        type: 'error',
        text: err.response?.data?.message || 'Data download nahi ho saka, dobara try karein',
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="profile-section">
      <h3>Your Data &amp; Privacy</h3>
      <p className="danger-text">
        Aap apna saara data (profile, workouts, nutrition, weight, measurements, performance,
        goals, notifications aur support tickets) ek JSON file mein download kar sakte hain.
        Password is file mein shamil nahi hota.
      </p>
      {msg.text && <p className={msg.type === 'success' ? 'success-msg' : 'error'}>{msg.text}</p>}
      <button type="button" onClick={handleDownload} disabled={downloading}>
        {downloading ? 'Preparing...' : 'Download My Data'}
      </button>
      <p className="privacy-links">
        <Link to="/privacy">Privacy Policy</Link> · <Link to="/terms">Terms of Service</Link>
      </p>
    </div>
  );
}

export default PrivacyDataSection;