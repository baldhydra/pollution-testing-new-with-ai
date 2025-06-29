import React, { useEffect, useState } from 'react';

const CURRENT_USER_KEY = 'pollution_current_user';

const UserBar = ({ style = {} }) => {
  const [username, setUsername] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
    setUsername(user || 'User');
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', minHeight: 60, ...style }}>
      <span style={{ color: '#888', fontSize: 16, marginRight: 16 }}>Welcome, {username}</span>
      <button
        style={{
          border: '1px solid #1976d2',
          background: '#fff',
          color: '#1976d2',
          borderRadius: 6,
          padding: '8px 18px',
          fontWeight: 500,
          cursor: 'pointer',
        }}
        onClick={() => {
          localStorage.removeItem(CURRENT_USER_KEY);
          window.location.href = '/';
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default UserBar; 