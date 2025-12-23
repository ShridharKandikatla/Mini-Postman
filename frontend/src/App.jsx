import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import ApiClient from './components/ApiClient';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <div className="App">
      {user ? (
        <ApiClient user={user} onLogout={handleLogout} />
      ) : (
        <Auth onAuthSuccess={handleAuthSuccess} />
      )}
    </div>
  );
}

export default App;
