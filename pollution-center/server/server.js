import express from 'express';
import cors from 'cors';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Data file paths
const DATA_DIR = path.join(__dirname, 'data');
const VEHICLE_DATA_FILE = path.join(DATA_DIR, 'vehicle_data.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
fs.ensureDirSync(DATA_DIR);

// Initialize data files if they don't exist
if (!fs.existsSync(VEHICLE_DATA_FILE)) {
  fs.writeJsonSync(VEHICLE_DATA_FILE, []);
}
if (!fs.existsSync(USERS_FILE)) {
  fs.writeJsonSync(USERS_FILE, []);
}

app.use(cors());
app.use(express.json());

// Get all vehicle data
app.get('/api/vehicles', (req, res) => {
  try {
    const data = fs.readJsonSync(VEHICLE_DATA_FILE);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read vehicle data' });
  }
});

// Add new vehicle data
app.post('/api/vehicles', (req, res) => {
  try {
    const data = fs.readJsonSync(VEHICLE_DATA_FILE);
    data.push(req.body);
    fs.writeJsonSync(VEHICLE_DATA_FILE, data);
    res.json({ message: 'Vehicle data saved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save vehicle data' });
  }
});

// Delete vehicle data
app.delete('/api/vehicles', (req, res) => {
  try {
    const { vehicleNumber, dateOfEntry, username } = req.body;
    const data = fs.readJsonSync(VEHICLE_DATA_FILE);
    const newData = data.filter(d => 
      !(d.vehicleNumber === vehicleNumber && 
        d.dateOfEntry === dateOfEntry && 
        d.username === username)
    );
    fs.writeJsonSync(VEHICLE_DATA_FILE, newData);
    res.json({ message: 'Vehicle data deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete vehicle data' });
  }
});

// Get all users
app.get('/api/users', (req, res) => {
  try {
    const users = fs.readJsonSync(USERS_FILE);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read users' });
  }
});

// Add new user
app.post('/api/users', (req, res) => {
  try {
    const users = fs.readJsonSync(USERS_FILE);
    users.push(req.body);
    fs.writeJsonSync(USERS_FILE, users);
    res.json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Delete user and their data
app.delete('/api/users', (req, res) => {
  try {
    const { username } = req.body;
    // Remove user from users list
    const users = fs.readJsonSync(USERS_FILE);
    const newUsers = users.filter(u => u.username !== username);
    fs.writeJsonSync(USERS_FILE, newUsers);
    
    // Remove user's vehicle data
    const vehicleData = fs.readJsonSync(VEHICLE_DATA_FILE);
    const newVehicleData = vehicleData.filter(d => d.username !== username);
    fs.writeJsonSync(VEHICLE_DATA_FILE, newVehicleData);
    
    res.json({ message: 'User and their data deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 