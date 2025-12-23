import React, { useState } from 'react';
import { authAPI } from '../services/api';
import './Auth.css';

function Auth({ onAuthSuccess }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = isSignup
        ? await authAPI.signup(email, password)
        : await authAPI.signin(email, password);

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onAuthSuccess(response.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Mini Postman</h1>
        <h2>{isSignup ? 'Sign Up' : 'Sign In'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              minLength={6}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Loading...' : isSignup ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <p className="toggle-text">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}
          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setError('');
            }}
            className="toggle-btn"
          >
            {isSignup ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Auth;
