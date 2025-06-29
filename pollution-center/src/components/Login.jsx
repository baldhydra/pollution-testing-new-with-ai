import React, { useState, useEffect } from 'react';
import { getUsers, createUser } from '../services/api';

const CURRENT_USER_KEY = 'pollution_current_user';

const setCurrentUser = (username) => localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(username));

const validateUsername = (username) => username.trim().length > 0;
const validatePassword = (password) => password.length >= 6;

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const userList = await getUsers();
        setUsers(userList);
      } catch (error) {
        console.error('Failed to load users:', error);
      }
    };
    loadUsers();
  }, []);

  useEffect(() => { setError(''); }, [isLogin, username, password, confirmPassword]);

  const isUsernameUnique = (username) => !users.some(u => u.username === username);

  const handleSubmit = async () => {
    try {
      if (isLogin) {
        // Login validation
        const user = users.find(u => u.username === username);
        if (!user) {
          setError('Username not found!');
          return;
        }
        if (user.password !== password) {
          setError('Incorrect password!');
          return;
        }
        setCurrentUser(username);
        window.location.href = '/dashboard';
      } else {
        // Create account validation
        if (!validateUsername(username)) {
          setError('Username cannot be empty!');
          return;
        }
        if (!isUsernameUnique(username)) {
          setError('Username already taken!');
          return;
        }
        if (!validatePassword(password)) {
          setError('Password must be at least 6 characters!');
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match!');
          return;
        }
        // Save new user
        await createUser({ username, password });
        setCurrentUser(username);
        window.location.href = '/dashboard';
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
      console.error('Error:', error);
    }
  };

  return (
    <div style={styles.container}>
      {/* Title */}
      <div style={styles.header}>
        <h1 style={styles.title}>🚀 Pollution Data Manager</h1>
      </div>

      {/* Tabs: Login / Create Account */}
      <div style={styles.tabContainer}>
        <button onClick={() => setIsLogin(true)} style={isLogin ? styles.activeTab : styles.inactiveTab}>
          Login
        </button>
        <button onClick={() => setIsLogin(false)} style={!isLogin ? styles.activeTab : styles.inactiveTab}>
          Create Account
        </button>
      </div>

      {/* Form Section */}
      <div style={styles.formContainer}>
        <h2>{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>
        <p>{isLogin ? 'Log in to manage pollution data.' : 'Create a new account to manage pollution data.'}</p>

        {/* Username Input */}
        <div style={styles.inputContainer}>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            style={styles.inputField}
          />
        </div>

        {/* Password Input */}
        <div style={styles.inputContainer}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            style={styles.inputField}
          />
        </div>

        {/* Confirm Password Input - Only visible for Create Account */}
        {!isLogin && (
          <div style={styles.inputContainer}>
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              style={styles.inputField}
            />
          </div>
        )}

        {/* Error Message - Always show if error exists */}
        {error && <p style={styles.errorText}>{error}</p>}

        {/* Submit Button */}
        <button onClick={handleSubmit} style={styles.submitButton}>
          {isLogin ? 'Login' : 'Create Account'}
        </button>
      </div>

      {/* Footer */}
      <footer style={styles.footer}>© 2025 Pollution Data Manager. Data stored locally on server.</footer>
    </div>
  );
};

// **Centered Layout & Black/Yellow Theme**
const styles = {
  container: { 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: '100vh', 
    backgroundColor: '#ffffff', 
    color: '#333333',
    width: '100%'
  },
  header: { 
    textAlign: 'center', 
    marginBottom: '20px',
    width: '100%'
  },
  title: { 
    color: '#333333', 
    fontSize: '24px',
    margin: '0'
  },
  tabContainer: { 
    display: 'flex', 
    justifyContent: 'center', 
    gap: '10px', 
    marginTop: '20px',
    width: '100%'
  },
  activeTab: { 
    padding: '10px 20px', 
    backgroundColor: '#4a90e2', 
    border: '1px solid #4a90e2', 
    cursor: 'pointer', 
    fontWeight: 'bold',
    color: '#ffffff',
    borderRadius: '5px'
  },
  inactiveTab: { 
    padding: '10px 20px', 
    backgroundColor: '#ffffff', 
    border: '1px solid #4a90e2', 
    cursor: 'pointer', 
    color: '#4a90e2',
    borderRadius: '5px'
  },
  formContainer: { 
    padding: '40px', 
    textAlign: 'center', 
    width: '400px',
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginTop: '20px'
  },
  inputContainer: { 
    marginBottom: '20px', 
    textAlign: 'left',
    width: '100%'
  },
  inputField: { 
    width: '100%', 
    padding: '12px', 
    border: '1px solid #e0e0e0', 
    borderRadius: '5px', 
    backgroundColor: '#ffffff', 
    color: '#333333',
    boxSizing: 'border-box',
    marginTop: '5px'
  },
  errorText: { 
    color: '#e74c3c', 
    fontSize: '14px',
    marginTop: '5px'
  },
  submitButton: { 
    width: '100%', 
    padding: '12px', 
    backgroundColor: '#4a90e2', 
    color: '#ffffff', 
    border: 'none', 
    borderRadius: '5px', 
    cursor: 'pointer', 
    fontWeight: 'bold',
    marginTop: '10px'
  },
  footer: { 
    marginTop: '20px', 
    textAlign: 'center', 
    color: '#666666',
    width: '100%'
  },
};

export default Login;

