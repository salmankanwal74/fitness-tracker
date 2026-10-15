import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProfile, changePassword, deleteAccount } from '../services/authService';
import PrivacyDataSection from '../components/PrivacyDataSection';

function ProfilePage() {
  const { user, loginUser, logoutUser } = useAuth();
  const navigate = useNavigate();

  // --- Photo ---
  const [preview, setPreview] = useState(user.profileImage || '');
  const [uploading, setUploading] = useState(false);
  const [photoMsg, setPhotoMsg] = useState({ type: '', text: '' });

  // --- Profile info ---
  const [name, setName] = useState(user.name || '');
  const [username, setUsername] = useState(user.username || '');
  const [email, setEmail] = useState(user.email || '');
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoMsg, setInfoMsg] = useState({ type: '', text: '' });

  // --- Password ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  // --- Delete account ---
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState({ type: '', text: '' });

  const getError = (err) => err.response?.data?.message || 'Kuch masla ho gaya, dobara koshish karein';

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Bohat bari image database ko slow karti hai
    if (file.size > 2 * 1024 * 1024) {
      setPhotoMsg({ type: 'error', text: 'Image 2MB se chhoti honi chahiye' });
      return;
    }

    setPhotoMsg({ type: '', text: '' });
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    setUploading(true);
    setPhotoMsg({ type: '', text: '' });
    try {
      const updatedUser = await updateProfile({ profileImage: preview });
      loginUser({ ...user, ...updatedUser });
      setPhotoMsg({ type: 'success', text: 'Photo save ho gayi' });
    } catch (err) {
      setPhotoMsg({ type: 'error', text: getError(err) });
    }
    setUploading(false);
  };

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setSavingInfo(true);
    setInfoMsg({ type: '', text: '' });
    try {
      const updatedUser = await updateProfile({ name, username, email });
      loginUser({ ...user, ...updatedUser });
      setName(updatedUser.name);
      setUsername(updatedUser.username || '');
      setEmail(updatedUser.email);
      setInfoMsg({ type: 'success', text: 'Profile update ho gaya' });
    } catch (err) {
      setInfoMsg({ type: 'error', text: getError(err) });
    }
    setSavingInfo(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Naya password aur confirm password match nahi karte' });
      return;
    }

    setSavingPassword(true);
    try {
      const data = await changePassword(currentPassword, newPassword);
      setPasswordMsg({ type: 'success', text: data.message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg({ type: 'error', text: getError(err) });
    }
    setSavingPassword(false);
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setDeleteMsg({ type: '', text: '' });

    const sure = window.confirm(
      'Kya aap waqai apna account delete karna chahte hain?\n\nWorkouts, nutrition, weight, measurements sab kuch hamesha ke liye delete ho jaayega. Ye wapis nahi ho sakta.'
    );
    if (!sure) return;

    setDeleting(true);
    try {
      await deleteAccount(deletePassword);
      logoutUser();
      navigate('/');
    } catch (err) {
      setDeleteMsg({ type: 'error', text: getError(err) });
      setDeleting(false);
    }
  };

  const Message = ({ msg }) =>
    msg.text ? <p className={msg.type === 'success' ? 'success-msg' : 'error'}>{msg.text}</p> : null;

  return (
    <div className="page-container profile-page">
      <h2>My Profile</h2>

      <div className="profile-layout">
        {/* ---------- Left: photo card ---------- */}
        <div className="profile-card">
          {preview ? (
            <img src={preview} alt="Profile" className="profile-image" />
          ) : (
            <div className="profile-avatar">{user.name.charAt(0).toUpperCase()}</div>
          )}

          <h3>{user.name}</h3>
          {user.username && <p className="profile-username">@{user.username}</p>}
          <p>{user.email}</p>

          <input type="file" accept="image/*" onChange={handleImageChange} />
          <button onClick={handleUpload} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Save Image'}
          </button>
          <Message msg={photoMsg} />
        </div>

        {/* ---------- Right: forms ---------- */}
        <div className="profile-forms">
          <form className="profile-section" onSubmit={handleInfoSubmit}>
            <h3>Personal Information</h3>
            <Message msg={infoMsg} />

            <label htmlFor="pf-name">Full Name</label>
            <input
              id="pf-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <label htmlFor="pf-username">Username</label>
            <input
              id="pf-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
              pattern="[a-z0-9_]{3,20}"
              title="3-20 characters: sirf a-z, 0-9 aur underscore (_)"
              placeholder="Apna username set karein"
              required
            />
            {!user.username && (
              <small className="field-hint">
                Aapka account username ke bagair bana tha — ab yahan set kar sakte hain.
              </small>
            )}

            <label htmlFor="pf-email">Email</label>
            <input
              id="pf-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button type="submit" disabled={savingInfo}>
              {savingInfo ? 'Saving...' : 'Save Changes'}
            </button>
          </form>

          <form className="profile-section" onSubmit={handlePasswordSubmit}>
            <h3>Change Password</h3>
            <Message msg={passwordMsg} />

            <label htmlFor="pf-current">Current Password</label>
            <input
              id="pf-current"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            <label htmlFor="pf-new">New Password</label>
            <input
              id="pf-new"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              autoComplete="new-password"
              required
            />

            <label htmlFor="pf-confirm">Confirm New Password</label>
            <input
              id="pf-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              autoComplete="new-password"
              required
            />

            <button type="submit" disabled={savingPassword}>
              {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>

          <PrivacyDataSection />
          <form className="profile-section danger-zone" onSubmit={handleDelete}>
            <h3>Delete Account</h3>
                       <p className="danger-text">
              Account delete karne par aapka saara data (profile, workouts, nutrition, weight,
              measurements, performance, goals, notifications, support tickets) hamesha ke liye mit
              jaayega.
            </p>
            <Message msg={deleteMsg} />

            <label htmlFor="pf-delete">Password likh kar confirm karein</label>
            <input
              id="pf-delete"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            <button type="submit" className="danger-btn" disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete My Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;