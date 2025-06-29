const API_BASE_URL = 'http://localhost:3001/api';

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