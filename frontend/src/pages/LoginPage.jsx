import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/authService';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const userData = await login({ identifier, password });
      loginUser(userData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-brand">🏋️ Fitness Tracker</div>
        <h2>Welcome Back</h2>
        <p className="auth-subtitle">Login to continue your fitness journey</p>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Email or Username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button type="submit">Login</button>
         </form>
        <p>
          <Link to="/forgot-password">Forgot password?</Link>
        </p>

               <p>
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
        <p className="legal-links">
          <Link to="/privacy">Privacy Policy</Link> · <Link to="/terms">Terms</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
