const API_BASE_URL = 'http://localhost:3001/api';

const AUTH_TOKEN_KEY = 'pollution_auth_token';

export const getAuthToken = () => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
};

export const clearAuthToken = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

// Auth endpoints
export const loginUser = async (username, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Login failed');
  }
  const data = await response.json();
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
};

// AI Assistant endpoints
export const sendAiMessage = async (message, conversationId) => {
  let token = getAuthToken();
  if (!token) {
    // Attempt auto-login with stored user if token is missing
    const currentUser = JSON.parse(localStorage.getItem('pollution_current_user') || '""');
    if (currentUser === 'aswin') {
      try {
        const loginRes = await loginUser('aswin', 'aswin123');
        token = loginRes.token;
      } catch {
        // ignore
      }
    }
  }

  const response = await fetch(`${API_BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ message, conversationId })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `AI request failed with status ${response.status}`);
  }

  return response.json();
};

export const clearAiConversation = async (conversationId) => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/ai/clear`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ conversationId })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to clear conversation');
  }

  return response.json();
};

// Vehicle data endpoints
export const getVehicleData = async () => {
  const response = await fetch(`${API_BASE_URL}/vehicles`);
  if (!response.ok) throw new Error('Failed to fetch vehicle data');
  return response.json();
};

export const saveVehicleData = async (data) => {
  const response = await fetch(`${API_BASE_URL}/vehicles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to save vehicle data');
  return response.json();
};

export const deleteVehicleData = async (data) => {
  const response = await fetch(`${API_BASE_URL}/vehicles`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to delete vehicle data');
  return response.json();
};

// User endpoints
export const getUsers = async () => {
  const response = await fetch(`${API_BASE_URL}/users`);
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
};

export const createUser = async (userData) => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  if (!response.ok) throw new Error('Failed to create user');
  return response.json();
};

export const deleteUser = async (username) => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });
  if (!response.ok) throw new Error('Failed to delete user');
  return response.json();
};
